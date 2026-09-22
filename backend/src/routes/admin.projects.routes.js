// 관리자 전용 프로젝트 라우트 - 로그인(requireAuth)해야 접근 가능합니다.
// 초안(draft)과 공개(published) 프로젝트를 모두 다룹니다.
const express = require('express');
const controller = require('../controllers/projects.controller');
const requireAuth = require('../middleware/requireAuth');

const router = express.Router();

router.use(requireAuth);

router.get('/', controller.listAdmin);
router.get('/:id', controller.getOne);
router.post('/', controller.create);
router.put('/:id', controller.update);
router.delete('/:id', controller.remove);

module.exports = router;
