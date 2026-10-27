const loginForm = document.getElementById('loginForm');
const loginError = document.getElementById('loginError');
const loginSubmit = document.getElementById('loginSubmit');

// 로그인 화면에 들어오면 이전 로그인 흔적을 지워, 항상 비밀번호를 새로 입력하게 합니다.
setAdminTabFlag(false);
adminApi.logout().catch(() => {
  /* 로그인 안 된 상태여도 문제 없음 */
});

loginForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  loginError.hidden = true;

  const password = document.getElementById('password').value;
  if (!password) {
    loginError.textContent = '비밀번호를 입력해주세요.';
    loginError.hidden = false;
    return;
  }

  loginSubmit.disabled = true;
  loginSubmit.textContent = '로그인 중...';

  try {
    await adminApi.login(password);
    window.location.href = 'dashboard.html';
  } catch (err) {
    loginError.textContent = err.message || '로그인에 실패했습니다.';
    loginError.hidden = false;
    loginSubmit.disabled = false;
    loginSubmit.textContent = '로그인';
  }
});
