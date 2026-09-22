const loginForm = document.getElementById('loginForm');
const loginError = document.getElementById('loginError');
const loginSubmit = document.getElementById('loginSubmit');

// 이미 로그인되어 있다면 바로 대시보드로 이동
adminApi
  .checkSession()
  .then(() => {
    window.location.href = 'dashboard.html';
  })
  .catch(() => {
    /* 로그인 안 된 상태 - 로그인 폼을 계속 보여줌 */
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
