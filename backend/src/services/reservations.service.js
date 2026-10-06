// 방문 예약 업무 로직: 입력값 검증 후 저장소에 저장
const repository = require('../data/reservationsRepository');

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
  return repository.create({ ...data, consent: true, status: 'pending' });
}

async function listReservations() {
  const items = await repository.getAll();
  return items.slice().sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

module.exports = { createReservation, listReservations, ValidationError };
