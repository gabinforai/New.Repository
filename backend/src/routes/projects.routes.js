// 공개용(퍼블릭) 프로젝트 라우트 - 공개(published) 상태인 프로젝트만 반환합니다.
const express = require('express');
const controller = require('../controllers/projects.controller');

const router = express.Router();

router.get('/', controller.listPublic);

module.exports = router;
