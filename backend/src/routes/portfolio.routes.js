const express = require('express');
const controller = require('../controllers/portfolio.controller');

const router = express.Router();

// 전체 데이터를 한 번에 반환 (프론트엔드 초기 로딩용)
router.get('/portfolio', controller.getFullPortfolio);

// 개별 리소스별 API (나중에 특정 데이터만 따로 쓰거나, 다른 서비스에서 재사용할 때 사용)
router.get('/profile', controller.getProfile);
router.get('/education', controller.getEducation);
router.get('/achievements', controller.getAchievements);
router.get('/likes', controller.getLikes);
router.get('/contact', controller.getContact);

module.exports = router;
