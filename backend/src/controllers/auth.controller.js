const authService = require('../services/auth.service');
const config = require('../config');

function cookieOptions() {
  return {
    httpOnly: true, // 자바스크립트로 읽을 수 없음 (XSS로부터 토큰 보호)
    sameSite: 'lax',
    secure: config.nodeEnv === 'production', // 운영 환경(HTTPS)에서만 secure 플래그 적용
    maxAge: config.jwtExpiresInMs,
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
