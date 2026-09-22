const path = require('path');
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');

const config = require('./config');
const portfolioRoutes = require('./routes/portfolio.routes');
const projectsRoutes = require('./routes/projects.routes');
const authRoutes = require('./routes/auth.routes');
const adminProjectsRoutes = require('./routes/admin.projects.routes');
const { notFoundHandler, errorHandler } = require('./middleware/errorHandler');

const app = express();

// credentials(쿠키)를 주고받으려면 origin을 '*'로 둘 수 없으므로,
// 요청의 Origin을 그대로 허용해주는 방식으로 설정합니다.
// (운영 환경에서는 .env의 FRONTEND_ORIGIN을 실제 프론트엔드 주소로 고정하는 것을 권장합니다.)
app.use(
  cors({
    origin: config.frontendOrigin === '*' ? true : config.frontendOrigin,
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

// ---- API 라우트 ----
// 앞으로 다른 기능(예: 방명록, 문의하기 등)을 추가하면
// 이곳에 app.use('/api/xxx', xxxRoutes); 형태로 라우터만 추가하면 됩니다.
app.use('/api', portfolioRoutes);
app.use('/api/projects', projectsRoutes); // 공개용: 공개(published) 프로젝트만
app.use('/api/admin', authRoutes); // 로그인 / 로그아웃 / 세션 확인
app.use('/api/admin/projects', adminProjectsRoutes); // 관리자 전용 프로젝트 CRUD (로그인 필요)

// ---- 프론트엔드 정적 파일 제공 ----
// 개발 중에는 백엔드 서버 하나로 프론트엔드+API를 함께 실행할 수 있습니다.
// (프론트엔드를 완전히 분리 배포하려면 이 부분을 지우고 CORS 설정만 사용하면 됩니다.)
const frontendPath = path.join(__dirname, '..', '..', 'frontend');
app.use(express.static(frontendPath));

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
