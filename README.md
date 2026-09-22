# 이가빈 포트폴리오

개인 포트폴리오 웹사이트입니다. 프론트엔드와 백엔드가 분리되어 있고,
지금은 백엔드가 로컬 JSON 파일을 "가짜 데이터베이스"처럼 사용합니다.
나중에 실제 데이터베이스나 다른 외부 API를 연결하기 쉽도록 계층을 나눠뒀습니다.

## 폴더 구조

```
포트폴리오/
├── frontend/               # 화면(정적 파일)
│   ├── index.html
│   ├── css/
│   │   └── style.css
│   └── js/
│       ├── config.js       # 백엔드 API 주소 설정
│       ├── api.js          # 백엔드와 통신하는 함수 (fetch)
│       ├── render.js       # 받아온 데이터를 화면에 그리는 함수
│       ├── main.js         # 메뉴, 스크롤 애니메이션, 공유하기, PDF 내보내기
│       └── app-init.js     # 페이지 진입 시 데이터 로딩 -> 렌더링 -> 인터랙션 초기화 순서 제어
│
└── backend/                 # API 서버 (Node.js + Express)
    ├── server.js             # 서버 시작점
    ├── package.json
    ├── .env.example          # 환경 변수 예시 (복사해서 .env로 사용)
    └── src/
        ├── app.js             # Express 앱 설정 (CORS, 라우팅, 정적 파일 제공)
        ├── config/            # 환경 설정 (포트, DB 주소 등)
        ├── routes/            # URL 경로와 컨트롤러 연결
        ├── controllers/       # HTTP 요청/응답 처리
        ├── services/          # 업무 로직 (여러 데이터 조합 등)
        ├── data/              # 데이터 저장소 계층 (지금은 JSON, 나중엔 DB로 교체)
        │   ├── portfolioRepository.js
        │   ├── profile.json
        │   ├── education.json
        │   ├── achievements.json
        │   ├── likes.json
        │   └── contact.json
        └── middleware/        # 에러 처리 등 공통 미들웨어
```

## 실행 방법

```bash
cd backend
npm install        # 최초 1회
npm start           # http://localhost:3000 에서 서버 실행 (프론트엔드까지 함께 제공)
```

브라우저에서 `http://localhost:3000` 을 열면 프론트엔드 화면이 보이고,
화면은 내부적으로 `http://localhost:3000/api/portfolio` 등의 API를 호출해서
학력/활동/좋아하는 것/연락처 데이터를 불러옵니다.

개발 중 코드를 저장할 때마다 서버를 자동 재시작하려면:

```bash
npm run dev
```

## API 목록

| Method | 경로 | 설명 |
| --- | --- | --- |
| GET | `/api/portfolio` | 전체 데이터(프로필+학력+활동+좋아하는 것+연락처)를 한 번에 반환 |
| GET | `/api/profile` | 기본 정보 |
| GET | `/api/education` | 학력 타임라인 |
| GET | `/api/achievements` | 활동 & 업적 |
| GET | `/api/likes` | 좋아하는 것 목록 |
| GET | `/api/contact` | 연락처 목록 |

## 나중에 실제 데이터베이스를 연결하려면

1. `backend/.env.example` 을 복사해 `backend/.env` 를 만들고 `DATABASE_URL` 에 접속 주소를 입력합니다.
2. DB 드라이버(mongoose, pg 등)를 설치합니다.
3. `backend/src/data/portfolioRepository.js` 안의 함수들만 DB 조회 코드로 바꿉니다.
   함수 이름과 반환값 형태만 유지하면 `services/`, `controllers/`, `routes/` 는 전혀 손댈 필요가 없습니다.

## 나중에 다른 외부 API를 연결하려면

`backend/src/services/` 안에 새로운 서비스 파일을 추가하고, 그 결과를 사용할
컨트롤러/라우트를 하나 추가하면 됩니다. 프론트엔드에서는 `frontend/js/api.js`
안에 새 함수를 추가해서 호출하면 됩니다.

## 프론트엔드를 백엔드와 분리 배포하려면

`frontend/js/config.js` 의 `API_BASE_URL` 값을 백엔드 서버의 실제 주소로 바꾸고,
`backend/.env` 의 `FRONTEND_ORIGIN` 값을 프론트엔드가 배포된 주소로 설정하면 됩니다(CORS 허용).
