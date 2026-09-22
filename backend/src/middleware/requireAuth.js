// 관리자 API를 보호하는 미들웨어.
// 로그인 시 발급된 쿠키(admin_session, httpOnly)가 유효한 경우에만 통과시킵니다.
const authService = require('../services/auth.service');
const config = require('../config');

function requireAuth(req, res, next) {
  const token = req.cookies ? req.cookies[config.sessionCookieName] : undefined;
  if (!authService.verifySessionToken(token)) {
    return res.status(401).json({ error: '로그인이 필요합니다.' });
  }
  next();
}

module.exports = requireAuth;
