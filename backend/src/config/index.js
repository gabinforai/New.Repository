require('dotenv').config();

module.exports = {
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',

  // 나중에 데이터베이스를 연결할 때 사용할 자리입니다.
  // 실제 값은 .env 파일에 넣고, backend/src/data/portfolioRepository.js 에서
  // 이 값을 사용해 DB(MongoDB, PostgreSQL 등)에 접속하면 됩니다.
  databaseUrl: process.env.DATABASE_URL || '',

  // 프론트엔드를 백엔드와 다른 주소/포트에서 따로 띄울 경우
  // CORS로 허용할 프론트엔드 주소입니다. (기본값 '*'은 모든 출처 허용 - 개발용)
  frontendOrigin: process.env.FRONTEND_ORIGIN || '*',
};
