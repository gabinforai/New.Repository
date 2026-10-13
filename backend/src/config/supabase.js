/**
 * Supabase 연결 (서버 전용)
 * ---------------------------------------------------------------
 * 모든 repository 가 이 클라이언트 하나를 공유합니다.
 * SERVICE_ROLE(Secret) 키는 RLS 를 우회하는 마스터키이므로
 * 서버(.env / Render 환경 변수)에서만 사용하고 프론트엔드에는 절대 내보내지 않습니다.
 * ---------------------------------------------------------------
 */
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('SUPABASE_URL 과 SUPABASE_SERVICE_ROLE_KEY 를 backend/.env 에 설정해주세요.');
}

module.exports = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});
