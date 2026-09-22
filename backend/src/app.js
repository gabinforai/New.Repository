const path = require('path');
const express = require('express');
const cors = require('cors');

const config = require('./config');
const portfolioRoutes = require('./routes/portfolio.routes');
const { notFoundHandler, errorHandler } = require('./middleware/errorHandler');

const app = express();

app.use(cors({ origin: config.frontendOrigin }));
app.use(express.json());

// ---- API 라우트 ----
// 앞으로 다른 기능(예: 방명록, 문의하기 등)을 추가하면
// 이곳에 app.use('/api/xxx', xxxRoutes); 형태로 라우터만 추가하면 됩니다.
app.use('/api', portfolioRoutes);

// ---- 프론트엔드 정적 파일 제공 ----
// 개발 중에는 백엔드 서버 하나로 프론트엔드+API를 함께 실행할 수 있습니다.
// (프론트엔드를 완전히 분리 배포하려면 이 부분을 지우고 CORS 설정만 사용하면 됩니다.)
const frontendPath = path.join(__dirname, '..', '..', 'frontend');
app.use(express.static(frontendPath));

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
