const express = require('express');
const controller = require('../controllers/reservations.controller');
const requireAuth = require('../middleware/requireAuth');
const rateLimitReservation = require('../middleware/rateLimitReservation');

const publicRouter = express.Router();
publicRouter.post('/', rateLimitReservation, controller.create);

const adminRouter = express.Router();
adminRouter.use(requireAuth);
adminRouter.get('/', controller.listAdmin);

module.exports = { publicRouter, adminRouter };
