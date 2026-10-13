/**
 * 데이터 저장소 계층 (Repository Layer)
 * ---------------------------------------------------------------
 * Supabase(PostgreSQL)에서 포트폴리오 데이터를 읽습니다.
 * 함수 이름과 반환값의 모양(camelCase 필드)은 예전 JSON 방식과 똑같이 유지하므로
 * services / controllers / routes / 프론트엔드는 수정할 필요가 없습니다.
 *
 * 공개 여부: 각 표의 is_public 이 true 인 행만 돌려줍니다.
 * (DB 의 RLS 정책도 같은 규칙으로 한 번 더 막고 있습니다.)
 * ---------------------------------------------------------------
 */
const db = require('../config/supabase');
const { unwrap } = require('./dbUtil');

// 공개된 행만, 정해진 순서(sort_order)대로. alias(`별칭:컬럼`)로 snake_case → camelCase 변환
async function listPublic(table, columns) {
  return unwrap(
    await db.from(table).select(columns).eq('is_public', true).order('sort_order', { ascending: true })
  );
}

// null 인 값은 응답에서 뺍니다 (예전 JSON 에서 해당 키가 아예 없던 것과 같은 모양)
function dropNulls(row) {
  return Object.fromEntries(Object.entries(row).filter(([, value]) => value !== null));
}

async function getProfile() {
  const profile = unwrap(
    await db
      .from('profile')
      .select('id, name, tagline, heroEyebrow:hero_eyebrow, heroDesc:hero_desc')
      .eq('is_public', true)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle()
  );

  // 공개된 프로필이 없어도 화면이 깨지지 않도록 빈 모양을 돌려줍니다.
  if (!profile) {
    return { name: '', tagline: '', heroEyebrow: '', heroDesc: '', basicInfo: [] };
  }

  const basicInfo = unwrap(
    await db
      .from('profile_basic_info')
      .select('icon, label, value')
      .eq('profile_id', profile.id)
      .eq('is_public', true)
      .order('sort_order', { ascending: true })
  );

  const { id, ...rest } = profile;
  return { ...rest, basicInfo };
}

async function getEducation() {
  const rows = await listPublic(
    'education',
    'school, department, admissionYear:admission_year, status, current:is_current'
  );
  return rows.map(dropNulls);
}

async function getAchievements() {
  return listPublic('achievements', 'year, prefix, highlight');
}

async function getLikes() {
  return listPublic('likes', 'icon, label');
}

async function getContact() {
  const rows = await listPublic('contact_links', 'type, icon, label, href');
  return rows.map(dropNulls);
}

module.exports = {
  getProfile,
  getEducation,
  getAchievements,
  getLikes,
  getContact,
};
