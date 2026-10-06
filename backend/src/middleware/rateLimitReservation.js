// 예약 스팸 방지: IP당 1시간에 10건까지 (서버 재시작 시 초기화되는 가벼운 구현)
const WINDOW_MS = 60 * 60 * 1000;
const MAX = 10;
const hits = new Map();

function rateLimitReservation(req, res, next) {
  const key = req.ip || 'unknown';
  const now = Date.now();
  const rec = hits.get(key);
  if (!rec || now - rec.start > WINDOW_MS) {
    hits.set(key, { count: 1, start: now });
    return next();
  }
  rec.count += 1;
  if (rec.count > MAX) {
    return res.status(429).json({ error: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.' });
  }
  next();
}

module.exports = rateLimitReservation;
