const service = require('../services/guestbook.service');

function handleValidation(err, res) {
  if (err instanceof service.ValidationError) {
    res.status(400).json({ error: '입력값을 확인해주세요.', details: err.validationErrors });
    return true;
  }
  return false;
}

async function list(req, res, next) {
  try {
    res.set('Cache-Control', 'no-store');
    res.json(await service.listPublic());
  } catch (err) {
    next(err);
  }
}

async function create(req, res, next) {
  try {
    const body = req.body || {};
    // 스팸 봇 방지용 숨은 입력칸(honeypot): 사람은 비워두므로, 채워져 있으면 저장하지 않고 성공처럼 응답
    if (body.website) return res.status(201).json({ ok: true });
    const item = await service.createEntry(body);
    res.status(201).json(item);
  } catch (err) {
    if (!handleValidation(err, res)) next(err);
  }
}

async function listAdmin(req, res, next) {
  try {
    res.json(await service.listAll());
  } catch (err) {
    next(err);
  }
}

async function setHidden(req, res, next) {
  try {
    const item = await service.setHidden(req.params.id, (req.body || {}).hidden);
    if (!item) return res.status(404).json({ error: '방명록 글을 찾을 수 없습니다.' });
    res.json(item);
  } catch (err) {
    if (!handleValidation(err, res)) next(err);
  }
}

async function remove(req, res, next) {
  try {
    const ok = await service.deleteEntry(req.params.id);
    if (!ok) return res.status(404).json({ error: '방명록 글을 찾을 수 없습니다.' });
    res.status(204).end();
  } catch (err) {
    next(err);
  }
}

module.exports = { list, create, listAdmin, setHidden, remove };
