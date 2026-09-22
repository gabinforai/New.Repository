/**
 * 데이터 저장소 계층 (Repository Layer)
 * ---------------------------------------------------------------
 * 지금은 로컬 JSON 파일을 "가짜 데이터베이스"처럼 읽어서 사용합니다.
 *
 * 나중에 실제 데이터베이스(MongoDB, PostgreSQL, MySQL 등)를 연결할 때는
 * 이 파일 안의 함수 내용만 DB 조회 코드로 바꿔주면 됩니다.
 * 각 함수의 이름과 반환값 형태(모양)만 유지하면,
 * 서비스(services)·컨트롤러(controllers)·라우터(routes)는 전혀 수정할 필요가 없습니다.
 *
 * 예) MongoDB로 바꾸는 경우:
 *   async function getEducation() {
 *     return db.collection('education').find().toArray();
 *   }
 * ---------------------------------------------------------------
 */
const fs = require('fs');
const path = require('path');

function readJson(fileName) {
  const filePath = path.join(__dirname, fileName);
  const raw = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(raw);
}

async function getProfile() {
  // TODO(DB 연결 시): return db.collection('profile').findOne();
  return readJson('profile.json');
}

async function getEducation() {
  // TODO(DB 연결 시): return db.collection('education').find().toArray();
  return readJson('education.json');
}

async function getAchievements() {
  // TODO(DB 연결 시): return db.collection('achievements').find().toArray();
  return readJson('achievements.json');
}

async function getLikes() {
  // TODO(DB 연결 시): return db.collection('likes').find().toArray();
  return readJson('likes.json');
}

async function getContact() {
  // TODO(DB 연결 시): return db.collection('contact').find().toArray();
  return readJson('contact.json');
}

module.exports = {
  getProfile,
  getEducation,
  getAchievements,
  getLikes,
  getContact,
};
