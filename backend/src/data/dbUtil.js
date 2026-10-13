// Supabase 응답 공통 처리: error 가 있으면 Error 로 바꿔 던지고, 없으면 data 를 돌려줍니다.
// (Supabase 의 error 는 Error 객체가 아니라서, errorHandler 에서 다루기 쉽게 변환)
function unwrap({ data, error }) {
  if (error) {
    const err = new Error(error.message);
    err.code = error.code;
    throw err;
  }
  return data;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// uuid 형식이 아닌 id 로 조회하면 DB 가 오류를 내므로, 미리 "없음"으로 처리하기 위한 검사
function isUuid(value) {
  return typeof value === 'string' && UUID_RE.test(value);
}

module.exports = { unwrap, isUuid };
