/**
 * Supabase 연결 점검: npm run check-db
 * 1) 8개 표 + booked_slots 뷰를 읽을 수 있는지
 * 2) 임시 행을 쓰고(insert) → 읽고(select) → 지워서(delete) 쓰기 권한까지 확인
 * 키 값은 출력하지 않습니다.
 */
const db = require('../src/config/supabase');

const TABLES = [
  'profile', 'profile_basic_info', 'education', 'achievements',
  'likes', 'contact_links', 'projects', 'reservations',
];

async function main() {
  let failed = false;

  for (const name of [...TABLES, 'booked_slots']) {
    const { count, error } = await db.from(name).select('*', { count: 'exact', head: true });
    if (error) {
      failed = true;
      console.log(`✗ ${name}: ${error.message}`);
    } else {
      console.log(`✓ ${name}: 읽기 성공 (${count}행)`);
    }
  }

  // 쓰기 왕복 테스트 (likes 표에 임시 행)
  const marker = `__connection_test_${Date.now()}`;
  const ins = await db.from('likes').insert({ icon: '🧪', label: marker }).select().single();
  if (ins.error) {
    failed = true;
    console.log(`✗ 쓰기(insert): ${ins.error.message}`);
  } else {
    console.log('✓ 쓰기(insert) 성공');
    const sel = await db.from('likes').select('label').eq('id', ins.data.id).single();
    console.log(sel.error ? `✗ 방금 쓴 행 읽기: ${sel.error.message}` : `✓ 방금 쓴 행 읽기 성공: ${sel.data.label}`);
    if (sel.error) failed = true;
    const del = await db.from('likes').delete().eq('id', ins.data.id);
    if (del.error) {
      failed = true;
      console.log(`✗ 임시 행 삭제: ${del.error.message}`);
    } else {
      console.log('✓ 임시 행 삭제 성공 (DB는 원래 상태)');
    }
  }

  console.log(failed ? '\n결과: 문제가 있습니다.' : '\n결과: Supabase 연결 정상 ✅');
  process.exit(failed ? 1 : 0);
}

main().catch((e) => {
  console.error('연결 실패:', e.message);
  process.exit(1);
});
