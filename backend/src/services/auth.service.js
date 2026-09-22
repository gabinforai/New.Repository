/**
 * 인증 서비스
 * ---------------------------------------------------------------
 * 관리자 비밀번호 확인과 로그인 세션(JWT) 발급/검증을 담당합니다.
 * 비밀번호 원문은 서버 메모리에도, 어디에도 저장하지 않습니다.
 * .env 에는 bcrypt로 암호화된 해시값만 저장되어 있고, 로그인 시
 * 입력받은 비밀번호를 그 해시와 비교(bcrypt.compare)만 합니다.
 * ---------------------------------------------------------------
 */
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('../config');

async function verifyPassword(password) {
  if (!config.adminPasswordHash) {
    const err = new Error(
      '관리자 비밀번호가 설정되지 않았습니다. backend/.env 의 ADMIN_PASSWORD_HASH 값을 확인하세요.'
    );
    err.status = 500;
    throw err;
  }
  return bcrypt.compare(password, config.adminPasswordHash);
}

function createSessionToken() {
  if (!config.jwtSecret) {
    const err = new Error(
      '로그인 세션 비밀 키가 설정되지 않았습니다. backend/.env 의 ADMIN_JWT_SECRET 값을 확인하세요.'
    );
    err.status = 500;
    throw err;
  }
  return jwt.sign({ role: 'admin' }, config.jwtSecret, { expiresIn: config.jwtExpiresIn });
}

function verifySessionToken(token) {
  if (!token || !config.jwtSecret) return false;
  try {
    const payload = jwt.verify(token, config.jwtSecret);
    return Boolean(payload && payload.role === 'admin');
  } catch (err) {
    return false;
  }
}

module.exports = { verifyPassword, createSessionToken, verifySessionToken };
