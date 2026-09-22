/**
 * 프로젝트 데이터 저장소 계층 (Repository Layer)
 * ---------------------------------------------------------------
 * portfolioRepository.js 와 같은 방식입니다. 지금은 로컬 JSON 파일에
 * 읽고 쓰지만, 나중에 실제 데이터베이스로 바꿀 때는 이 파일 안의 함수
 * 내용만 DB 코드로 교체하면 됩니다. (services/controllers/routes는 그대로)
 * ---------------------------------------------------------------
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const FILE_PATH = path.join(__dirname, 'projects.json');

function readAll() {
  const raw = fs.readFileSync(FILE_PATH, 'utf-8');
  return raw.trim() ? JSON.parse(raw) : [];
}

function writeAll(projects) {
  fs.writeFileSync(FILE_PATH, JSON.stringify(projects, null, 2), 'utf-8');
}

async function getAll() {
  // TODO(DB 연결 시): return db.collection('projects').find().toArray();
  return readAll();
}

async function getById(id) {
  // TODO(DB 연결 시): return db.collection('projects').findOne({ id });
  return readAll().find((project) => project.id === id) || null;
}

async function create(projectData) {
  // TODO(DB 연결 시): return db.collection('projects').insertOne(...);
  const projects = readAll();
  const now = new Date().toISOString();
  const newProject = {
    id: crypto.randomUUID(),
    ...projectData,
    createdAt: now,
    updatedAt: now,
  };
  projects.push(newProject);
  writeAll(projects);
  return newProject;
}

async function update(id, patch) {
  // TODO(DB 연결 시): return db.collection('projects').findOneAndUpdate(...);
  const projects = readAll();
  const index = projects.findIndex((project) => project.id === id);
  if (index === -1) return null;

  const updated = {
    ...projects[index],
    ...patch,
    id: projects[index].id,
    createdAt: projects[index].createdAt,
    updatedAt: new Date().toISOString(),
  };
  projects[index] = updated;
  writeAll(projects);
  return updated;
}

async function remove(id) {
  // TODO(DB 연결 시): return db.collection('projects').deleteOne({ id });
  const projects = readAll();
  const index = projects.findIndex((project) => project.id === id);
  if (index === -1) return false;
  projects.splice(index, 1);
  writeAll(projects);
  return true;
}

module.exports = { getAll, getById, create, update, remove };
