// 로그인 무차별 대입 공격(brute force)을 늦추기 위한 아주 단순한 제한 장치.
// IP별로 일정 시간 동안 로그인 시도 횟수를 제한합니다.
// (서버가 재시작되면 초기화됩니다 - 개인 포트폴리오 규모에 맞춘 가벼운 구현입니다.)
const WINDOW_MS = 15 * 60 * 1000; // 15분
const MAX_ATTEMPTS = 10;

const attempts = new Map();

function rateLimitLogin(req, res, next) {
  const key = req.ip || 'unknown';
  const now = Date.now();
  const record = attempts.get(key);

  if (!record || now - record.windowStart > WINDOW_MS) {
    attempts.set(key, { count: 1, windowStart: now });
    return next();
  }

  record.count += 1;
  if (record.count > MAX_ATTEMPTS) {
    return res.status(429).json({ error: '로그인 시도가 너무 많습니다. 잠시 후 다시 시도해주세요.' });
  }

  next();
}

module.exports = rateLimitLogin;
