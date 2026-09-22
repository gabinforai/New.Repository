// 관리자 화면에서 백엔드와 통신하는 함수 모음
// 모든 요청에 credentials: 'include' 를 넣어 로그인 쿠키(httpOnly)를 함께 전송합니다.
const ADMIN_API_BASE = '/api/admin';

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
