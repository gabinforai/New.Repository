/**
 * 옛 JSON 데이터를 Supabase 표로 옮기는 일회성 스크립트: npm run seed-db
 * - 표가 이미 비어 있지 않으면 건너뜁니다 (여러 번 실행해도 중복되지 않음).
 * - 모든 항목은 공개(is_public = true)로 들어가며, 배열 순서는 sort_order 로 보존합니다.
 * - 프로젝트/예약은 JSON 에 옮길 데이터가 없어 건드리지 않습니다.
 */
const fs = require('fs');
const path = require('path');
const db = require('../src/config/supabase');

const DATA_DIR = path.join(__dirname, '..', 'src', 'data');
const readJson = (name) => JSON.parse(fs.readFileSync(path.join(DATA_DIR, name), 'utf-8'));

async function isEmpty(table) {
  const { count, error } = await db.from(table).select('*', { count: 'exact', head: true });
  if (error) throw new Error(`${table}: ${error.message}`);
  return count === 0;
}

async function insert(table, rows) {
  const { error } = await db.from(table).insert(rows);
  if (error) throw new Error(`${table}: ${error.message}`);
  console.log(`✓ ${table}: ${rows.length}행 추가`);
}

async function main() {
  // 프로필 + 기본 정보 (profile_basic_info 는 profile 의 id 가 필요)
  if (await isEmpty('profile')) {
    const p = readJson('profile.json');
    const { data, error } = await db
      .from('profile')
      .insert({ name: p.name, tagline: p.tagline, hero_eyebrow: p.heroEyebrow, hero_desc: p.heroDesc })
      .select('id')
      .single();
    if (error) throw new Error(`profile: ${error.message}`);
    console.log('✓ profile: 1행 추가');
    await insert(
      'profile_basic_info',
      p.basicInfo.map((item, i) => ({
        profile_id: data.id,
        icon: item.icon,
        label: item.label,
        value: item.value, // 프론트가 innerHTML 로 그리므로 <br> 을 그대로 둡니다
        sort_order: i,
      }))
    );
  } else {
    console.log('- profile: 이미 데이터가 있어 건너뜀');
  }

  if (await isEmpty('education')) {
    await insert(
      'education',
      readJson('education.json').map((e, i) => ({
        school: e.school,
        department: e.department ?? null,
        admission_year: e.admissionYear ?? null,
        status: e.status,
        is_current: Boolean(e.current),
        sort_order: i,
      }))
    );
  } else console.log('- education: 이미 데이터가 있어 건너뜀');

  if (await isEmpty('achievements')) {
    await insert(
      'achievements',
      readJson('achievements.json').map((a, i) => ({ ...a, sort_order: i }))
    );
  } else console.log('- achievements: 이미 데이터가 있어 건너뜀');

  if (await isEmpty('likes')) {
    await insert('likes', readJson('likes.json').map((l, i) => ({ ...l, sort_order: i })));
  } else console.log('- likes: 이미 데이터가 있어 건너뜀');

  if (await isEmpty('contact_links')) {
    await insert(
      'contact_links',
      readJson('contact.json').map((c, i) => ({
        type: c.type, icon: c.icon, label: c.label, href: c.href, sort_order: i,
      }))
    );
  } else console.log('- contact_links: 이미 데이터가 있어 건너뜀');

  console.log('\n완료');
}

main().catch((e) => {
  console.error('실패:', e.message);
  process.exit(1);
});
