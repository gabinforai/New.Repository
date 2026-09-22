// 관리자 화면에서 백엔드와 통신하는 함수 모음
// 모든 요청에 credentials: 'include' 를 넣어 로그인 쿠키(httpOnly)를 함께 전송합니다.
// API_BASE_URL은 config.js 에서 정의합니다 (로컬/Vercel 여부에 따라 자동으로
// localhost 또는 Render 백엔드 주소를 가리킵니다). 이 파일보다 먼저 로드되어야 합니다.
const ADMIN_API_BASE = `${API_BASE_URL}/admin`;

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
    }).then(handleResponse),

  logout: () =>
    fetch(`${ADMIN_API_BASE}/logout`, {
      method: 'POST',
      credentials: 'include',
    }).then(handleResponse),

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
