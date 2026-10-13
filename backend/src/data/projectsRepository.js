/**
 * 프로젝트 데이터 저장소 계층 (Repository Layer)
 * ---------------------------------------------------------------
 * Supabase 의 projects 표를 읽고 씁니다.
 * 함수 이름과 반환값 모양(camelCase)은 예전 JSON/Redis 방식과 같게 유지합니다.
 * 공개 여부는 status('draft'/'published')로 관리하며, 걸러내는 일은 service 가 합니다.
 * ---------------------------------------------------------------
 */
const db = require('../config/supabase');
const { unwrap, isUuid } = require('./dbUtil');

// DB 컬럼 → 앱에서 쓰는 이름 (date_text 는 예전 이름인 date 로 돌려줌)
const COLUMNS =
  'id, title, role, description, date:date_text, participants, notes, status, ' +
  'createdAt:created_at, updatedAt:updated_at';

// 앱의 필드명 → DB 컬럼명
const TO_COLUMN = {
  title: 'title',
  role: 'role',
  description: 'description',
  date: 'date_text',
  participants: 'participants',
  notes: 'notes',
  status: 'status',
};

function toRow(data) {
  const row = {};
  Object.entries(TO_COLUMN).forEach(([field, column]) => {
    if (data[field] !== undefined) row[column] = data[field];
  });
  return row;
}

async function getAll() {
  return unwrap(await db.from('projects').select(COLUMNS).order('created_at', { ascending: true }));
}

async function getById(id) {
  if (!isUuid(id)) return null;
  return unwrap(await db.from('projects').select(COLUMNS).eq('id', id).maybeSingle());
}

async function create(projectData) {
  return unwrap(await db.from('projects').insert(toRow(projectData)).select(COLUMNS).single());
}

async function update(id, patch) {
  if (!isUuid(id)) return null;
  // updated_at 은 DB 트리거가 자동으로 갱신합니다.
  return unwrap(
    await db.from('projects').update(toRow(patch)).eq('id', id).select(COLUMNS).maybeSingle()
  );
}

async function remove(id) {
  if (!isUuid(id)) return false;
  const deleted = unwrap(await db.from('projects').delete().eq('id', id).select('id'));
  return deleted.length > 0;
}

module.exports = { getAll, getById, create, update, remove };
