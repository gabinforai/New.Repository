// 방명록 업무 로직: 입력값 검증 후 저장소에 저장
const repository = require('../data/guestbookRepository');

class ValidationError extends Error {
  constructor(errors) {
    super('Validation failed');
    this.validationErrors = errors;
  }
}

const NAME_MAX = 20;
const MESSAGE_MAX = 500;

function clean(value) {
  // 제어문자 제거 + 앞뒤 공백 정리 (줄바꿈은 메시지에서만 허용)
  return String(value === undefined || value === null ? '' : value)
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .trim();
}

async function listPublic() {
  return (await repository.getVisible()).map(({ id, name, message, createdAt }) => ({
    id,
    name,
    message,
    createdAt,
  }));
}

async function listAll() {
  return repository.getAll();
}

async function createEntry(data) {
  const name = clean(data.name).replace(/\s+/g, ' ');
  const message = clean(data.message).replace(/\r\n/g, '\n').replace(/\n{3,}/g, '\n\n');
  const errors = [];
  if (!name) errors.push('이름을 입력해주세요.');
  else if (name.length > NAME_MAX) errors.push(`이름은 ${NAME_MAX}자 이하로 입력해주세요.`);
  if (!message) errors.push('메시지를 입력해주세요.');
  else if (message.length > MESSAGE_MAX) errors.push(`메시지는 ${MESSAGE_MAX}자 이하로 입력해주세요.`);
  if (errors.length) throw new ValidationError(errors);
  const item = await repository.create({ name, message });
  return { id: item.id, name: item.name, message: item.message, createdAt: item.createdAt };
}

async function setHidden(id, hidden) {
  if (typeof hidden !== 'boolean') throw new ValidationError(['hidden 값은 true/false 여야 합니다.']);
  return repository.setHidden(id, hidden);
}

async function deleteEntry(id) {
  return repository.remove(id);
}

module.exports = { listPublic, listAll, createEntry, setHidden, deleteEntry, ValidationError };
