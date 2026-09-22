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
├── frontend/admin/          # 관리자 화면(로그인 필요)
│   ├── login.html
│   ├── dashboard.html        # 프로젝트 목록 (초안+공개 모두 보임)
│   ├── editor.html           # 프로젝트 작성/수정 폼
│   ├── css/admin.css
│   └── js/
│       ├── admin-api.js      # 관리자 API 호출 + 로그인 여부 확인
│       ├── login.js
│       ├── dashboard.js
│       └── editor.js
│
└── backend/                 # API 서버 (Node.js + Express)
    ├── server.js             # 서버 시작점
    ├── package.json
    ├── .env.example          # 환경 변수 예시 (복사해서 .env로 사용)
    ├── scripts/
    │   └── hash-password.js  # 관리자 비밀번호 해시 생성 스크립트
    └── src/
        ├── app.js             # Express 앱 설정 (CORS, 쿠키, 라우팅, 정적 파일 제공)
        ├── config/            # 환경 설정 (포트, DB 주소, 관리자 인증 설정 등)
        ├── routes/            # URL 경로와 컨트롤러 연결
        │   ├── portfolio.routes.js
        │   ├── projects.routes.js       # 공개용: 공개(published) 프로젝트만
        │   ├── admin.projects.routes.js # 관리자 전용: 로그인 필요
        │   └── auth.routes.js           # 로그인/로그아웃/세션 확인
        ├── controllers/       # HTTP 요청/응답 처리
        ├── services/          # 업무 로직 (검증 규칙, 여러 데이터 조합 등)
        ├── data/              # 데이터 저장소 계층 (지금은 JSON, 나중엔 DB로 교체)
        │   ├── portfolioRepository.js
        │   ├── projectsRepository.js
        │   ├── profile.json
        │   ├── education.json
        │   ├── achievements.json
        │   ├── likes.json
        │   ├── contact.json
        │   └── projects.json        # 관리자 화면에서 등록한 프로젝트 데이터
        └── middleware/
            ├── requireAuth.js        # 로그인 필요한 API 보호
            ├── rateLimitLogin.js     # 로그인 무차별 대입 시도 제한
            └── errorHandler.js
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

## 관리자 페이지 (프로젝트 관리)

파일을 직접 고치지 않고, 브라우저에서 로그인해서 프로젝트(제목 / 내가 한 역할 / 설명 /
날짜 / 참여인원 수 / 참고사항)를 등록·수정할 수 있습니다.

### 1. 최초 설정 - 관리자 비밀번호 만들기

비밀번호는 평문으로 저장하지 않고 bcrypt 해시로만 저장합니다.

```bash
cd backend
npm run hash-password -- "원하는비밀번호"
```

출력된 해시값을 `backend/.env` 파일에 붙여넣습니다. (`.env.example` 을 복사해서 `.env` 를 만드세요.)

```
ADMIN_PASSWORD_HASH=여기에_출력된_해시값
ADMIN_JWT_SECRET=아무거나_추측하기_어려운_긴_임의의_문자열
```

`ADMIN_JWT_SECRET` 은 아래 명령으로 무작위 생성할 수 있습니다.

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

설정 후 서버를 (재)시작하면 완료입니다.

### 2. 사용 방법

1. 브라우저에서 `http://localhost:3000/admin/login.html` 접속
2. 비밀번호 입력 후 로그인 (로그인 상태는 8시간 동안 유지되며, 기본값은
   `ADMIN_SESSION_HOURS` 로 조절 가능)
3. `+ 새 프로젝트` 로 프로젝트를 작성하거나, 목록에서 `수정`/`삭제`
4. 빈 칸에는 무엇을 입력해야 하는지 옅은 색 예시 문구가 보이고, 입력을 시작하면 자동으로 사라집니다.
5. **초안으로 저장**: 참고사항을 포함해 모든 칸을 비워도 저장할 수 있습니다. 사용자에게는 보이지 않고, 관리자 화면에서만 보입니다.
6. **공개하기**: 참고사항을 제외한 모든 칸(제목/역할/설명/날짜/참여인원 수)을 입력해야 저장됩니다. 저장 즉시 실제 웹사이트의 "프로젝트" 섹션에 반영됩니다.

### 3. 보안

- 비밀번호는 서버에 bcrypt 해시로만 저장되고, 로그인 시 입력값과 비교만 할 뿐
  어디에도 원문으로 남지 않습니다. 프론트엔드 코드(JS/HTML)에는 비밀번호나 해시가
  전혀 포함되지 않습니다.
- 로그인에 성공하면 서버가 `httpOnly` 쿠키에 로그인 토큰(JWT)을 담아 내려줍니다.
  `httpOnly` 쿠키는 자바스크립트로 읽을 수 없어 XSS 공격으로도 토큰을 훔칠 수 없습니다.
- 이 쿠키는 **세션 쿠키**입니다(만료 시간을 일부러 지정하지 않음). 디스크에 저장되지 않고
  브라우저를 완전히 종료하면 사라지므로, 다음에 브라우저를 다시 열면 항상 비밀번호를
  새로 입력해야 합니다. (탭/창 하나만 닫는 것으로는 지워지지 않습니다 - 쿠키는 브라우저
  프로필 전체가 공유하기 때문에, 같은 브라우저의 다른 창이 열려 있다면 그 창에서는 로그인이
  유지됩니다. 완전히 종료해야 지워집니다.)
- 관리자 전용 API(`/api/admin/...`)는 모두 이 쿠키를 검증하는 `requireAuth` 미들웨어로
  보호되어 있어, 로그인하지 않으면 어떤 경로로도 접근할 수 없습니다.
- 관리자 페이지와 관리자 API 응답에는 `Cache-Control: no-store` 를 붙여 브라우저에
  캐시되지 않도록 했고, 뒤로/앞으로 가기 캐시(bfcache)로 페이지가 복원되는 경우도
  감지해서 새로고침되도록 했습니다. 로그아웃 후 뒤로가기를 눌러도 이전 화면이 그대로
  보이지 않습니다.
- 로그인 폼은 `autocomplete="off"` 로 브라우저의 비밀번호 저장 제안을 최대한 막습니다.
  (브라우저 자체 기능이라 완전히 막을 수는 없고, 사용자가 브라우저 설정에서 저장하지
  않도록 선택하는 것이 가장 확실합니다.)
- 로그인 시도는 IP당 15분에 10회로 제한되어 있어 무차별 대입 공격을 늦춥니다.
- `backend/.env` 파일(비밀번호 해시, 세션 비밀 키 포함)은 `.gitignore` 에 등록되어 있어
  git 저장소에 절대 커밋되지 않습니다.

## API 목록

| Method | 경로 | 인증 | 설명 |
| --- | --- | --- | --- |
| GET | `/api/portfolio` | - | 전체 공개 데이터(프로필+학력+활동+프로젝트+좋아하는 것+연락처) |
| GET | `/api/profile` | - | 기본 정보 |
| GET | `/api/education` | - | 학력 타임라인 |
| GET | `/api/achievements` | - | 활동 & 업적 |
| GET | `/api/likes` | - | 좋아하는 것 목록 |
| GET | `/api/contact` | - | 연락처 목록 |
| GET | `/api/projects` | - | 공개(published) 프로젝트 목록 |
| POST | `/api/admin/login` | - | 관리자 로그인 (비밀번호 확인 후 세션 쿠키 발급) |
| POST | `/api/admin/logout` | - | 로그아웃 (세션 쿠키 삭제) |
| GET | `/api/admin/me` | 필요 | 로그인 상태 확인 |
| GET | `/api/admin/projects` | 필요 | 프로젝트 전체 목록 (초안+공개) |
| GET | `/api/admin/projects/:id` | 필요 | 프로젝트 1건 조회 |
| POST | `/api/admin/projects` | 필요 | 프로젝트 생성 |
| PUT | `/api/admin/projects/:id` | 필요 | 프로젝트 수정 |
| DELETE | `/api/admin/projects/:id` | 필요 | 프로젝트 삭제 |

## 나중에 실제 데이터베이스를 연결하려면

1. `backend/.env.example` 을 복사해 `backend/.env` 를 만들고 `DATABASE_URL` 에 접속 주소를 입력합니다.
2. DB 드라이버(mongoose, pg 등)를 설치합니다.
3. `backend/src/data/portfolioRepository.js` 와 `backend/src/data/projectsRepository.js`
   안의 함수들만 DB 조회 코드로 바꿉니다.
   함수 이름과 반환값 형태만 유지하면 `services/`, `controllers/`, `routes/` 는 전혀 손댈 필요가 없습니다.
   (`projectsRepository.js` 는 이미 로컬 파일 / Redis를 자동으로 구분해 쓰는 예시가 들어있습니다.
   자세한 내용은 아래 "Vercel 배포" 섹션 참고.)

## 나중에 다른 외부 API를 연결하려면

`backend/src/services/` 안에 새로운 서비스 파일을 추가하고, 그 결과를 사용할
컨트롤러/라우트를 하나 추가하면 됩니다. 프론트엔드에서는 `frontend/js/api.js`
안에 새 함수를 추가해서 호출하면 됩니다.

## 프론트엔드를 백엔드와 분리 배포하려면

`frontend/js/config.js` 의 `API_BASE_URL` 값을 백엔드 서버의 실제 주소로 바꾸고,
`backend/.env` 의 `FRONTEND_ORIGIN` 값을 프론트엔드가 배포된 주소로 설정하면 됩니다(CORS 허용).

## 배포 구조: 프론트엔드 = Vercel, 백엔드 = Render

프론트엔드(`frontend/`)와 백엔드(`backend/`)를 완전히 다른 서비스에 각각 배포합니다.

- **프론트엔드 → Vercel**: 정적 파일(`frontend/`)만 올립니다. 빌드 과정이 없는
  순수 HTML/CSS/JS라 Vercel이 가장 잘하는 방식 그대로입니다.
- **백엔드 → Render**: `backend/`를 진짜 Node.js 서버(Express, `npm start`)로
  계속 띄워두는 방식입니다. Vercel 서버리스 함수와 달리 파일시스템이 요청 사이에도
  유지되고, 우리 코드를 거의 그대로(파일 기반 저장 포함) 쓸 수 있습니다.
- 두 서비스는 서로 다른 도메인이므로, `frontend/js/config.js` 가 접속 주소를
  보고 자동으로 Render 백엔드 주소를 사용하도록 이미 구성해뒀습니다. 로그인
  쿠키도 도메인을 넘나들 수 있도록(cross-site) 백엔드에서 처리해뒀습니다.

### 1. 백엔드 배포 (Render)

저장소 최상위의 `render.yaml` 이 설정을 자동으로 채워줍니다.

1. [render.com](https://render.com) 에서 GitHub 계정으로 로그인/가입 (무료)
2. **New +** → **Blueprint** → 이 저장소(`gabinforai/New.Repository`) 선택
3. Render가 `render.yaml` 을 읽어 서비스 이름(`gabin-portfolio-backend`), 루트
   폴더(`backend`), 빌드/실행 명령을 자동으로 채웁니다. 아래 값들만 직접 입력해주세요.

   | 이름 | 값 |
   | --- | --- |
   | `ADMIN_PASSWORD_HASH` | 로컬 `backend/.env` 의 현재 값을 그대로 복사 |
   | `ADMIN_JWT_SECRET` | 로컬 `backend/.env` 의 현재 값을 그대로 복사 |
   | `KV_REST_API_URL` / `KV_REST_API_TOKEN` | 아래 "2. 데이터 저장" 참고 (일단 비워두고 나중에 채워도 됩니다) |

4. **Apply** 를 누르면 배포가 시작되고, 완료되면 `https://gabin-portfolio-backend.onrender.com`
   같은 주소가 생깁니다. (서비스 이름을 다르게 지었다면 `frontend/js/config.js` 의
   `RENDER_BACKEND_URL` 값도 그 주소로 바꿔주세요.)

**참고**: Render 무료 플랜은 15분 동안 요청이 없으면 서버가 잠들고, 다음 요청이
올 때 다시 깨어나는 데 30~60초 정도 걸립니다. 개인 포트폴리오처럼 트래픽이
많지 않은 사이트에는 무료로 충분하지만, 첫 방문 시 살짝 느릴 수 있다는 점만
참고해주세요.

### 2. 데이터 저장 (프로젝트 목록이 재시작해도 남아있게)

Render 무료 플랜은 디스크가 영구 저장소가 아니라서, 로컬처럼 파일에만 저장하면
서버가 재시작(재배포, 일정 시간 미사용 후 재기동 등)될 때 관리자 페이지에서
등록한 프로젝트가 사라질 수 있습니다. `backend/src/data/projectsRepository.js`
는 아래 환경 변수가 있으면 자동으로 Redis를 쓰고, 없으면 파일을 씁니다.

1. [Upstash](https://upstash.com) (무료 가입) 또는 Render 자체 Key Value
   서비스에서 Redis(또는 REST API를 지원하는 KV) 데이터베이스를 만듭니다.
2. 발급된 REST URL/Token을 Render 서비스의 환경 변수로 등록합니다.
   `KV_REST_API_URL`, `KV_REST_API_TOKEN`
3. Render에서 **Manual Deploy → Deploy latest commit** 으로 재배포합니다.

이 값이 없어도 사이트 자체는 정상 작동합니다. 다만 관리자 페이지에서 등록한
내용이 서버 재시작 후에도 남아있게 하려면 이 설정을 권장합니다.

### 3. 프론트엔드 배포 (Vercel)

1. Vercel 프로젝트 → **Settings → General → Root Directory** 를 `frontend` 로
   설정합니다. (지금까지는 저장소 최상위를 가리키고 있었을텐데, 이제 프론트엔드는
   완전히 별도의 정적 사이트이므로 `frontend` 폴더를 루트로 지정해야 합니다.)
2. **Settings → General → Framework Preset** 은 `Other` (정적 파일 그대로 제공)로
   두면 됩니다. 별도 빌드 명령이 필요 없습니다.
3. **Deployments** 탭에서 최신 커밋으로 **Redeploy** 합니다.
4. 완료되면 `https://new-repository-one-rose.vercel.app/` 에서 정상적으로
   보이고, 관리자 페이지(`/admin/login.html`)에서 로그인하면 Render에 배포된
   백엔드로 요청이 전달됩니다.

### 요약

| 무엇을 | 어디서 | 비용 |
| --- | --- | --- |
| 정적 프론트엔드 (`frontend/`) | Vercel | 무료 (Hobby) |
| API 서버 (`backend/`) | Render | 무료 (Free 웹 서비스) |
| 프로젝트 데이터 저장 | Upstash Redis (선택) | 무료 (소규모 사용량) |

이후로는 Vercel에 배포된 관리자 페이지에서 저장한 프로젝트가 Redis에 저장되고,
공개 사이트에도 정상적으로 반영됩니다. 로컬 개발 환경은 이 설정과 무관하게
계속 파일 기반으로 동작합니다.
