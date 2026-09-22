/**
 * 컨트롤러 계층 (Controller Layer)
 * ---------------------------------------------------------------
 * HTTP 요청/응답을 처리합니다. 실제 데이터 처리는 services에 위임합니다.
 * ---------------------------------------------------------------
 */
const portfolioService = require('../services/portfolio.service');

async function getProfile(req, res, next) {
  try {
    res.json(await portfolioService.getProfile());
  } catch (err) {
    next(err);
  }
}

async function getEducation(req, res, next) {
  try {
    res.json(await portfolioService.getEducation());
  } catch (err) {
    next(err);
  }
}

async function getAchievements(req, res, next) {
  try {
    res.json(await portfolioService.getAchievements());
  } catch (err) {
    next(err);
  }
}

async function getLikes(req, res, next) {
  try {
    res.json(await portfolioService.getLikes());
  } catch (err) {
    next(err);
  }
}

async function getContact(req, res, next) {
  try {
    res.json(await portfolioService.getContact());
  } catch (err) {
    next(err);
  }
}

async function getFullPortfolio(req, res, next) {
  try {
    res.json(await portfolioService.getFullPortfolio());
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getProfile,
  getEducation,
  getAchievements,
  getLikes,
  getContact,
  getFullPortfolio,
};
