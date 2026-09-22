require('dotenv').config();

const sessionHours = Number(process.env.ADMIN_SESSION_HOURS || 8);

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

  // ---- 관리자 로그인 설정 ----
  // 비밀번호는 절대 평문으로 저장하지 않습니다. bcrypt 해시만 저장합니다.
  // 생성 방법: backend 폴더에서 `npm run hash-password -- "원하는비밀번호"`
  adminPasswordHash: process.env.ADMIN_PASSWORD_HASH || '',

  // 로그인 세션(JWT)을 서명할 비밀 키. 반드시 추측하기 어려운 임의의 문자열로 설정하세요.
  jwtSecret: process.env.ADMIN_JWT_SECRET || '',

  // 로그인 세션 유지 시간
  jwtExpiresIn: `${sessionHours}h`,
  jwtExpiresInMs: sessionHours * 60 * 60 * 1000,

  // 로그인 세션을 저장하는 쿠키 이름
  sessionCookieName: 'admin_session',
};
