const service = require('../services/reservations.service');

async function create(req, res, next) {
  try {
    const item = await service.createReservation(req.body);
    res.status(201).json({ id: item.id, createdAt: item.createdAt });
  } catch (err) {
    if (err instanceof service.ValidationError) {
      return res.status(400).json({ error: '입력값을 확인해주세요.', details: err.validationErrors });
    }
    next(err);
  }
}

async function listAdmin(req, res, next) {
  try {
    res.json(await service.listReservations());
  } catch (err) {
    next(err);
  }
}

async function updateStatus(req, res, next) {
  try {
    const item = await service.updateStatus(req.params.id, (req.body || {}).status);
    if (!item) return res.status(404).json({ error: '예약을 찾을 수 없습니다.' });
    res.json(item);
  } catch (err) {
    if (err instanceof service.ValidationError) {
      return res.status(400).json({ error: '입력값을 확인해주세요.', details: err.validationErrors });
    }
    next(err);
  }
}

module.exports = { create, listAdmin, updateStatus };
