/**
 * 관리자 비밀번호 해시 생성 스크립트
 * ---------------------------------------------------------------
 * 관리자 비밀번호는 평문(그대로의 텍스트)으로 저장하지 않고,
 * bcrypt로 암호화(해시)한 값만 .env 파일에 저장합니다.
 * 이렇게 하면 .env 파일이 유출되더라도 실제 비밀번호를 알아낼 수 없습니다.
 *
 * 사용법:
 *   cd backend
 *   npm run hash-password -- "원하는비밀번호"
 *
 * 출력된 해시값을 backend/.env 파일의 ADMIN_PASSWORD_HASH= 뒤에 붙여넣으세요.
 * ---------------------------------------------------------------
 */
const bcrypt = require('bcryptjs');

const password = process.argv[2];

if (!password) {
  console.error('사용법: npm run hash-password -- "원하는비밀번호"');
  process.exit(1);
}

const hash = bcrypt.hashSync(password, 12);
console.log('');
console.log('아래 값을 backend/.env 파일의 ADMIN_PASSWORD_HASH 에 넣으세요:');
console.log('');
console.log(hash);
console.log('');
