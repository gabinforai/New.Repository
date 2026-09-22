/**
 * 프로젝트 서비스 계층
 * ---------------------------------------------------------------
 * 저장 규칙(공개/초안에 따른 필수 입력값 검증)을 담당합니다.
 * ---------------------------------------------------------------
 */
const repository = require('../data/projectsRepository');

const FIELD_LABELS = {
  title: '제목',
  role: '내가 한 역할',
  description: '설명',
  date: '날짜',
  participants: '참여인원 수',
};

// 참고사항(notes)을 제외한 모든 칸은 "공개" 상태일 때 필수입니다.
const REQUIRED_FOR_PUBLISHED = ['title', 'role', 'description', 'date', 'participants'];

class ValidationError extends Error {
  constructor(errors) {
    super('Validation failed');
    this.validationErrors = errors;
  }
}

function isBlank(value) {
  return value === undefined || value === null || String(value).trim() === '';
}

function validate(data) {
  const errors = [];

  if (data.status !== 'draft' && data.status !== 'published') {
    errors.push('공개 상태(초안/공개)를 선택해주세요.');
  }

  if (data.status === 'published') {
    REQUIRED_FOR_PUBLISHED.forEach((field) => {
      if (isBlank(data[field])) {
        errors.push(`${FIELD_LABELS[field]} 항목을 입력해야 공개할 수 있습니다.`);
      }
    });
  }

  if (!isBlank(data.participants) && (Number.isNaN(Number(data.participants)) || Number(data.participants) < 1)) {
    errors.push('참여인원 수는 1 이상의 숫자여야 합니다.');
  }

  return errors;
}

function normalize(data) {
  return {
    title: (data.title || '').trim(),
    role: (data.role || '').trim(),
    description: (data.description || '').trim(),
    date: (data.date || '').trim(),
    participants: isBlank(data.participants) ? null : Number(data.participants),
    notes: (data.notes || '').trim(),
    status: data.status === 'published' ? 'published' : 'draft',
  };
}

async function getAllProjects() {
  return repository.getAll();
}

async function getPublishedProjects() {
  // 날짜(date)는 자유 입력 텍스트(예: "2026.03 - 2026.05")라 정렬 기준으로 쓰기 어려우므로,
  // 등록 시각(createdAt) 기준 최신순으로 정렬합니다.
  const projects = await repository.getAll();
  return projects
    .filter((project) => project.status === 'published')
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

async function getProjectById(id) {
  return repository.getById(id);
}

async function createProject(data) {
  const errors = validate(data);
  if (errors.length) throw new ValidationError(errors);
  return repository.create(normalize(data));
}

async function updateProject(id, data) {
  const errors = validate(data);
  if (errors.length) throw new ValidationError(errors);
  return repository.update(id, normalize(data));
}

async function deleteProject(id) {
  return repository.remove(id);
}

module.exports = {
  getAllProjects,
  getPublishedProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
  ValidationError,
};
