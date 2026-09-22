const authService = require('../services/auth.service');
const config = require('../config');

function cookieOptions() {
  return {
    httpOnly: true, // 자바스크립트로 읽을 수 없음 (XSS로부터 토큰 보호)
    sameSite: 'lax',
    secure: config.nodeEnv === 'production', // 운영 환경(HTTPS)에서만 secure 플래그 적용
    // maxAge를 일부러 지정하지 않습니다 -> "세션 쿠키"가 되어 브라우저(모든 창)를
    // 완전히 종료하면 자동으로 삭제됩니다. 즉, 브라우저를 껐다 켜면 다시 로그인해야 합니다.
    // (탭/창을 하나만 닫는 것으로는 지워지지 않습니다 - 쿠키는 브라우저 프로필 단위로
    //  공유되기 때문입니다. 완전히 종료해야 지워집니다.)
    path: '/',
  };
}

async function login(req, res, next) {
  try {
    const { password } = req.body || {};
    if (!password) {
      return res.status(400).json({ error: '비밀번호를 입력해주세요.' });
    }

    const ok = await authService.verifyPassword(password);
    if (!ok) {
      return res.status(401).json({ error: '비밀번호가 올바르지 않습니다.' });
    }

    const token = authService.createSessionToken();
    res.cookie(config.sessionCookieName, token, cookieOptions());
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}

function logout(req, res) {
  res.clearCookie(config.sessionCookieName, { path: '/' });
  res.json({ ok: true });
}

function me(req, res) {
  res.json({ ok: true, admin: true });
}

module.exports = { login, logout, me };
