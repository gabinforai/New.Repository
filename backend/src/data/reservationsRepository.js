/**
 * 방문 예약 저장소 계층 (Repository Layer)
 * ---------------------------------------------------------------
 * Supabase 의 reservations 표를 읽고 씁니다. 이름·이메일이 들어 있어 방문자에게는
 * 공개되지 않으며(RLS), 서버(service_role)만 접근합니다.
 * 같은 날짜·시간 중복 예약은 DB 의 유니크 인덱스(uq_active_slot)가 최종적으로 막고,
 * 그때 던져지는 오류(code 23505)는 service 가 ConflictError 로 바꿉니다.
 * ---------------------------------------------------------------
 */
const db = require('../config/supabase');
const { unwrap, isUuid } = require('./dbUtil');

const COLUMNS =
  'id, reservationNo:reservation_no, name, email, purpose, date:visit_date, time:visit_time, ' +
  'consent, status, createdAt:created_at, updatedAt:updated_at';

const TO_COLUMN = {
  reservationNo: 'reservation_no',
  name: 'name',
  email: 'email',
  purpose: 'purpose',
  date: 'visit_date',
  time: 'visit_time',
  consent: 'consent',
  status: 'status',
};

function toRow(data) {
  const row = {};
  Object.entries(TO_COLUMN).forEach(([field, column]) => {
    if (data[field] !== undefined) row[column] = data[field];
  });
  return row;
}

// DB 의 time 은 '10:30:00' 형태라, 예전처럼 '10:30' 으로 맞춥니다.
function fromRow(row) {
  return row ? { ...row, time: String(row.time).slice(0, 5) } : null;
}

async function getAll() {
  const rows = unwrap(await db.from('reservations').select(COLUMNS).order('created_at', { ascending: true }));
  return rows.map(fromRow);
}

async function create(data) {
  return fromRow(unwrap(await db.from('reservations').insert(toRow(data)).select(COLUMNS).single()));
}

async function update(id, patch) {
  if (!isUuid(id)) return null;
  return fromRow(
    unwrap(await db.from('reservations').update(toRow(patch)).eq('id', id).select(COLUMNS).maybeSingle())
  );
}

module.exports = { getAll, create, update };
