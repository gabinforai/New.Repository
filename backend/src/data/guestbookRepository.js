/**
 * 방명록 저장소 계층 (Repository Layer)
 * ---------------------------------------------------------------
 * Supabase 의 guestbook_entries 표를 읽고 씁니다. 서버(service_role)만 접근하며,
 * 한 번 저장된 글은 관리자가 지우기 전까지 계속 남습니다.
 * ---------------------------------------------------------------
 */
const db = require('../config/supabase');
const { unwrap, isUuid } = require('./dbUtil');

const COLUMNS = 'id, name, message, hidden:is_hidden, createdAt:created_at';

async function getAll() {
  return unwrap(await db.from('guestbook_entries').select(COLUMNS).order('created_at', { ascending: false }));
}

async function getVisible() {
  return unwrap(
    await db
      .from('guestbook_entries')
      .select(COLUMNS)
      .eq('is_hidden', false)
      .order('created_at', { ascending: false })
  );
}

async function create({ name, message }) {
  return unwrap(await db.from('guestbook_entries').insert({ name, message }).select(COLUMNS).single());
}

async function setHidden(id, hidden) {
  if (!isUuid(id)) return null;
  return unwrap(
    await db.from('guestbook_entries').update({ is_hidden: hidden }).eq('id', id).select(COLUMNS).maybeSingle()
  );
}

async function remove(id) {
  if (!isUuid(id)) return false;
  const deleted = unwrap(await db.from('guestbook_entries').delete().eq('id', id).select('id'));
  return deleted.length > 0;
}

module.exports = { getAll, getVisible, create, setHidden, remove };
