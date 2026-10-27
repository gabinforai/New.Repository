// 관리자 화면에서 백엔드와 통신하는 함수 모음
// 모든 요청에 credentials: 'include' 를 넣어 로그인 쿠키(httpOnly)를 함께 전송합니다.
// API_BASE_URL은 config.js 에서 정의합니다 (로컬/Vercel 여부에 따라 자동으로
// localhost 또는 Render 백엔드 주소를 가리킵니다). 이 파일보다 먼저 로드되어야 합니다.
const ADMIN_API_BASE = `${API_BASE_URL}/admin`;

// 비밀번호를 "기억"하지 않기 위한 장치: 로그인에 성공한 이 탭에서만 관리자 화면을 열 수 있습니다.
// sessionStorage 는 탭을 닫거나 새 탭을 열면 비어 있으므로, 그때마다 비밀번호를 다시 입력해야 합니다.
const ADMIN_TAB_FLAG = 'adminTabLoggedIn';
function hasAdminTabFlag() {
  try {
    return sessionStorage.getItem(ADMIN_TAB_FLAG) === '1';
  } catch (err) {
    return false;
  }
}
function setAdminTabFlag(on) {
  try {
    if (on) sessionStorage.setItem(ADMIN_TAB_FLAG, '1');
    else sessionStorage.removeItem(ADMIN_TAB_FLAG);
  } catch (err) {
    /* 저장소를 못 쓰는 환경 - 무시 */
  }
}
// 로그인 화면이 아닌데 이 탭에서 로그인한 적이 없다면 곧바로 로그인 화면으로 보냅니다.
if (!/\/login\.html$/.test(window.location.pathname) && !hasAdminTabFlag()) {
  window.location.replace('login.html');
}

async function handleResponse(res) {
  if (res.status === 204) return null;

  let body = null;
  try {
    body = await res.json();
  } catch (err) {
    body = null;
  }

  if (!res.ok) {
    const message = (body && body.error) || `요청에 실패했습니다. (status ${res.status})`;
    const error = new Error(message);
    error.status = res.status;
    error.details = body && body.details;
    throw error;
  }

  return body;
}

const adminApi = {
  login: (password) =>
    fetch(`${ADMIN_API_BASE}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ password }),
    }).then(handleResponse).then((body) => {
      setAdminTabFlag(true);
      return body;
    }),

  logout: () => {
    setAdminTabFlag(false);
    return fetch(`${ADMIN_API_BASE}/logout`, {
      method: 'POST',
      credentials: 'include',
    }).then(handleResponse);
  },

  checkSession: () =>
    fetch(`${ADMIN_API_BASE}/me`, { credentials: 'include' }).then(handleResponse),

  listProjects: () =>
    fetch(`${ADMIN_API_BASE}/projects`, { credentials: 'include' }).then(handleResponse),

  getProject: (id) =>
    fetch(`${ADMIN_API_BASE}/projects/${encodeURIComponent(id)}`, { credentials: 'include' }).then(
      handleResponse
    ),

  createProject: (data) =>
    fetch(`${ADMIN_API_BASE}/projects`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data),
    }).then(handleResponse),

  updateProject: (id, data) =>
    fetch(`${ADMIN_API_BASE}/projects/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data),
    }).then(handleResponse),

  listReservations: () =>
    fetch(`${ADMIN_API_BASE}/reservations`, { credentials: 'include' }).then(handleResponse),

  updateReservationStatus: (id, status) =>
    fetch(`${ADMIN_API_BASE}/reservations/${encodeURIComponent(id)}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ status }),
    }).then(handleResponse),

  deleteProject: (id) =>
    fetch(`${ADMIN_API_BASE}/projects/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      credentials: 'include',
    }).then(handleResponse),
};

// 대시보드/에디터 페이지 진입 시 로그인 여부를 확인하고,
// 로그인되어 있지 않으면 로그인 페이지로 돌려보냅니다.
async function requireAdminSession() {
  try {
    await adminApi.checkSession();
    return true;
  } catch (err) {
    window.location.href = 'login.html';
    return false;
  }
}

// 브라우저의 뒤로/앞으로 가기 캐시(bfcache)로 페이지가 복원되면
// 자바스크립트가 다시 실행되지 않아 로그아웃 이후에도 화면이 남아있을 수 있습니다.
// 이런 경우를 감지해 페이지를 새로고침해서 로그인 상태를 다시 확인하게 합니다.
window.addEventListener('pageshow', (event) => {
  if (event.persisted) {
    window.location.reload();
  }
});
