# 이가빈 포트폴리오 - 프로젝트 구조

프론트엔드(`frontend/`)와 백엔드(`backend/`, Node.js + Express)로 분리된 구조입니다.
자세한 설명은 [README.md](README.md) 참고.

## 핵심 원칙

- 프론트엔드는 콘텐츠를 하드코딩하지 않고, 백엔드 API(`/api/portfolio` 등)를 fetch로
  불러와 `frontend/js/render.js` 의 함수들로 화면을 그립니다.
- 백엔드는 컨트롤러 → 서비스 → 리포지토리(`backend/src/data/portfolioRepository.js`) 계층으로
  나뉘어 있습니다. 지금은 리포지토리가 로컬 JSON 파일을 읽지만, 실제 DB를 연결할 때는
  리포지토리 함수 내부만 수정하면 되고 그 위 계층(services/controllers/routes)은 그대로 둡니다.
- 새 데이터 종류를 추가할 때: `backend/src/data/*.json` 추가 → repository 함수 추가 →
  service/controller/route 추가 → 프론트엔드 `js/api.js` 에 호출 함수 추가 →
  `js/render.js` 에 렌더링 함수 추가.
- `frontend/admin/` 은 비밀번호 로그인이 필요한 관리자 전용 화면입니다(로그인/대시보드/작성-수정 폼).
  프로젝트(제목/역할/설명/날짜/참여인원/참고사항)를 초안 또는 공개 상태로 저장할 수 있고,
  공개 상태인 것만 `/api/projects` 와 `/api/portfolio` 에 노출되어 실제 사이트에 보입니다.
- 인증: `backend/src/services/auth.service.js` 가 bcrypt 비밀번호 검증 + JWT 세션 발급을 담당하고,
  `backend/src/middleware/requireAuth.js` 가 `/api/admin/*` 요청의 httpOnly 쿠키를 검증합니다.
  비밀번호 해시/세션 비밀키는 `backend/.env` (git에 커밋되지 않음)에만 있습니다.

## 실행

```bash
cd backend
npm install
npm start   # http://localhost:3000
```
