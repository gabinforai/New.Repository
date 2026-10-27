const express = require('express');
const controller = require('../controllers/guestbook.controller');
const requireAuth = require('../middleware/requireAuth');
const rateLimitGuestbook = require('../middleware/rateLimitGuestbook');

const publicRouter = express.Router();
publicRouter.get('/', controller.list);
publicRouter.post('/', rateLimitGuestbook, controller.create);

const adminRouter = express.Router();
adminRouter.use(requireAuth);
adminRouter.get('/', controller.listAdmin);
adminRouter.patch('/:id/hidden', controller.setHidden);
adminRouter.delete('/:id', controller.remove);

module.exports = { publicRouter, adminRouter };
