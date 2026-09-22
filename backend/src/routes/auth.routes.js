const express = require('express');
const controller = require('../controllers/auth.controller');
const requireAuth = require('../middleware/requireAuth');
const rateLimitLogin = require('../middleware/rateLimitLogin');

const router = express.Router();

router.post('/login', rateLimitLogin, controller.login);
router.post('/logout', controller.logout);
router.get('/me', requireAuth, controller.me);

module.exports = router;
