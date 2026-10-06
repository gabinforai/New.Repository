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

async function createReservation(input) {
  const data = validate(input || {});
  return repository.create({
    ...data,
    reservationNo: makeReservationNo(data),
    consent: true,
    status: 'received',
  });
}

async function listReservations() {
  const items = await repository.getAll();
  return items.map(normalize).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

async function updateStatus(id, status) {
  if (!STATUSES.includes(status)) {
    throw new ValidationError({ status: '올바르지 않은 처리 상태입니다.' });
  }
  const item = await repository.update(id, { status });
  return item ? normalize(item) : null;
}

module.exports = { createReservation, listReservations, updateStatus, ValidationError };
