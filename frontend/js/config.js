// 백엔드 API 기본 주소
//
// 프론트엔드(Vercel)와 백엔드(Render)가 서로 다른 도메인에 배포되기 때문에,
// 지금 이 페이지가 어느 주소에서 열렸는지에 따라 자동으로 백엔드 주소를 고릅니다.
// - localhost 에서 열었다면(로컬 개발) -> 같은 서버가 API도 제공하므로 상대 경로 '/api'
// - 그 밖의 주소(Vercel 배포 등)에서 열었다면 -> Render에 배포된 백엔드 주소를 사용
//
// Render 백엔드 서비스 이름을 바꿨다면 아래 RENDER_BACKEND_URL 값도 함께 바꿔주세요.
// (render.yaml 의 services[0].name 과 짝이 맞아야 합니다. 기본값:
//  gabin-portfolio-backend -> https://gabin-portfolio-backend.onrender.com)
const RENDER_BACKEND_URL = 'https://gabin-portfolio-backend.onrender.com';

const API_BASE_URL = (() => {
  const host = window.location.hostname;
  const isLocal = host === 'localhost' || host === '127.0.0.1';
  return isLocal ? '/api' : `${RENDER_BACKEND_URL}/api`;
})();
