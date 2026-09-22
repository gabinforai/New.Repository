const app = require('./src/app');
const config = require('./src/config');

if (!config.adminPasswordHash || !config.jwtSecret) {
  console.warn('');
  console.warn('⚠️  관리자 로그인이 아직 설정되지 않았습니다.');
  console.warn('   backend/.env 파일에 ADMIN_PASSWORD_HASH 와 ADMIN_JWT_SECRET 값을 설정해주세요.');
  console.warn('   비밀번호 해시 생성: npm run hash-password -- "원하는비밀번호"');
  console.warn('   (설정 전까지는 관리자 로그인 및 관리 기능을 사용할 수 없습니다.)');
  console.warn('');
}

app.listen(config.port, () => {
  console.log(`✅ 백엔드 서버 실행 중: http://localhost:${config.port}`);
  console.log(`   API 예시: http://localhost:${config.port}/api/portfolio`);
  console.log(`   관리자 페이지: http://localhost:${config.port}/admin/login.html`);
});
