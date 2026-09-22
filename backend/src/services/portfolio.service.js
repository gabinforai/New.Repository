/**
 * 서비스 계층 (Service Layer)
 * ---------------------------------------------------------------
 * 컨트롤러와 데이터 저장소(repository) 사이에서 "업무 로직"을 담당합니다.
 * 지금은 단순히 리포지토리 함수를 그대로 호출하지만,
 * 나중에 여러 데이터를 조합하거나(getFullPortfolio),
 * 외부 API 응답을 가공하거나, 캐싱을 추가하는 등의 로직을
 * 이 계층에 추가하면 됩니다.
 * ---------------------------------------------------------------
 */
const repository = require('../data/portfolioRepository');

async function getProfile() {
  return repository.getProfile();
}

async function getEducation() {
  return repository.getEducation();
}

async function getAchievements() {
  return repository.getAchievements();
}

async function getLikes() {
  return repository.getLikes();
}

async function getContact() {
  return repository.getContact();
}

// 여러 데이터를 한 번에 조합해서 반환 (프론트엔드에서 한 번의 요청으로 전체 데이터를 받을 때 사용)
async function getFullPortfolio() {
  const [profile, education, achievements, likes, contact] = await Promise.all([
    getProfile(),
    getEducation(),
    getAchievements(),
    getLikes(),
    getContact(),
  ]);

  return { profile, education, achievements, likes, contact };
}

module.exports = {
  getProfile,
  getEducation,
  getAchievements,
  getLikes,
  getContact,
  getFullPortfolio,
};
