// 방문 예약 업무 로직: 입력값 검증 후 저장소에 저장
const crypto = require('crypto');
const repository = require('../data/reservationsRepository');

// 처리 상태: 접수(사용자가 요청한 그대로) / 확정 / 변경 요청 / 취소
const STATUSES = ['received', 'confirmed', 'change_requested', 'canceled'];

// 예약 번호 = 방문 희망 날짜·시간 + 예약자(이름+이메일) 해시 4자리
//   예) R20261008-1030-A3F9
// 같은 사람이 여러 번 방문해도 희망 시간이 다르면 번호가 달라집니다.
// TODO(추후): 방문 희망 시간이 겹치지 않도록 접수 시 중복 시간 검사 필요
function makeReservationNo({ name, email, date, time }) {
  const who = crypto
    .createHash('sha1')
    .update(String(name).trim().toLowerCase() + '|' + String(email).trim().toLowerCase())
    .digest('hex')
    .slice(0, 4)
    .toUpperCase();
  return 'R' + date.replace(/-/g, '') + '-' + time.replace(':', '') + '-' + who;
}

// 예전 데이터(status: 'pending', 번호 없음)도 같은 형태로 보이게 정리
function normalize(item) {
  return {
    ...item,
    reservationNo: item.reservationNo || makeReservationNo(item),
    status: STATUSES.includes(item.status) ? item.status : 'received',
  };
}

class ValidationError extends Error {
  constructor(validationErrors) {
    super('Validation failed');
    this.validationErrors = validationErrors;
  }
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const TIME_RE = /^(\d{2}):(30|00)$/;

function isValidDate(str) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(str)) return false;
  const d = new Date(`${str}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === str;
}

function isWeekday(str) {
  const day = new Date(`${str}T00:00:00Z`).getUTCDay();
  return day >= 1 && day <= 5;
}

function isValidTime(str) {
  const m = TIME_RE.exec(str);
  if (!m) return false;
  const minutes = Number(m[1]) * 60 + Number(m[2]);
  return minutes >= 10 * 60 && minutes <= 22 * 60;
}

function validate(input) {
  const errors = {};
  const name = String(input.name || '').trim();
  const email = String(input.email || '').trim();
  const purpose = String(input.purpose || '').trim();
  const date = String(input.date || '');
  const time = String(input.time || '');

  if (!name || name.length > 50) errors.name = '이름을 입력해주세요. (50자 이내)';
  if (!EMAIL_RE.test(email) || email.length > 254) errors.email = '올바른 이메일 형식이 아닙니다.';
  if (!purpose || purpose.length > 2000) errors.purpose = '방문 목적을 입력해주세요. (2000자 이내)';
  if (!isValidDate(date) || !isWeekday(date)) errors.date = '평일 날짜를 선택해주세요.';
  if (!isValidTime(time)) errors.time = '10:00~22:00 사이 30분 단위로 선택해주세요.';
  if (input.consent !== true) errors.consent = '정보 제공에 동의해야 예약할 수 있습니다.';

  if (Object.keys(errors).length) throw new ValidationError(errors);
  return { name, email, purpose, date, time };
}

class ConflictError extends Error {}

// 같은 날짜·시간에 예약이 겹치지 않게 하기 위한 직렬화 잠금.
// "읽기 → 겹침 검사 → 저장"이 동시에 두 번 실행되면 둘 다 검사를 통과할 수 있으므로,
// 쓰기 작업을 한 줄로 세워서 하나씩만 처리합니다. (서버 1대 기준. 서버를 여러 대로
// 늘리면 DB의 유니크 제약/원자적 연산으로 바꿔야 합니다.)
let writeQueue = Promise.resolve();
function withLock(task) {
  const run = writeQueue.then(task, task);
  writeQueue = run.catch(() => {});
  return run;
}

// 취소된 예약은 시간을 차지하지 않습니다. 그 외(접수/확정/변경 요청)는 해당 시간을 차지합니다.
function occupiesSlot(item) {
  return normalize(item).status !== 'canceled';
}

function slotTaken(items, date, time, exceptId) {
  return items.some((it) => it.id !== exceptId && it.date === date && it.time === time && occupiesSlot(it));
}

async function createReservation(input) {
  const data = validate(input || {});
  return withLock(async () => {
    const items = await repository.getAll();
    if (slotTaken(items, data.date, data.time)) {
      throw new ConflictError('이미 예약이 완료된 날짜·시간입니다. 다른 시간을 선택해주세요.');
    }
    // 같은 사람이 취소 후 같은 시간을 다시 예약하면 번호가 같아질 수 있어 뒤에 순번을 붙입니다.
    let reservationNo = makeReservationNo(data);
    const used = new Set(items.map((it) => normalize(it).reservationNo));
    for (let n = 2; used.has(reservationNo); n += 1) {
      reservationNo = makeReservationNo(data) + '-' + n;
    }
    return repository.create({ ...data, reservationNo, consent: true, status: 'received' });
  });
}

// 예약 페이지에 공개하는 "이미 찼는 시간" 목록 (개인정보 없이 날짜·시간만)
async function listBookedSlots() {
  const items = await repository.getAll();
  return items.filter(occupiesSlot).map((it) => ({ date: it.date, time: it.time }));
}

async function listReservations() {
  const items = await repository.getAll();
  return items.map(normalize).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

async function updateStatus(id, status) {
  if (!STATUSES.includes(status)) {
    throw new ValidationError({ status: '올바르지 않은 처리 상태입니다.' });
  }
  return withLock(async () => {
    const items = await repository.getAll();
    const current = items.find((it) => it.id === id);
    if (!current) return null;
    // 취소된 예약을 되살릴 때, 그 시간에 이미 다른 예약이 들어왔다면 막습니다.
    if (status !== 'canceled' && slotTaken(items, current.date, current.time, id)) {
      throw new ConflictError('같은 날짜·시간에 이미 다른 예약이 있어 이 상태로 바꿀 수 없습니다.');
    }
    const item = await repository.update(id, { status });
    return item ? normalize(item) : null;
  });
}

module.exports = {
  createReservation,
  listBookedSlots,
  listReservations,
  updateStatus,
  ValidationError,
  ConflictError,
};
