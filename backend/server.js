const app = require('./src/app');
const config = require('./src/config');

app.listen(config.port, () => {
  console.log(`✅ 백엔드 서버 실행 중: http://localhost:${config.port}`);
  console.log(`   API 예시: http://localhost:${config.port}/api/portfolio`);
});
