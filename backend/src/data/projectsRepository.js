/**
 * 프로젝트 데이터 저장소 계층 (Repository Layer)
 * ---------------------------------------------------------------
 * 저장 방식이 두 가지입니다.
 *
 * 1) 로컬 개발 환경 (기본값): backend/src/data/projects.json 파일에 직접 읽고 씁니다.
 *    별도 설정이 필요 없어 지금처럼 바로 npm start 로 개발할 수 있습니다.
 *
 * 2) Vercel 배포 환경: Vercel은 배포된 코드 영역이 읽기 전용이라 파일에 쓸 수 없습니다.
 *    그래서 Redis 접속 정보(KV_REST_API_URL/TOKEN 또는 UPSTASH_REDIS_REST_URL/TOKEN)가
 *    환경 변수에 있으면 자동으로 Upstash Redis(Vercel 마켓플레이스 연동)를 사용합니다.
 *
 * 어느 쪽을 쓰는지는 이 파일 안에서만 판단하고, 함수 이름과 반환값 형태를 그대로
 * 유지하기 때문에 services/controllers/routes 는 전혀 손댈 필요가 없습니다.
 * 나중에 다른 실제 DB(MongoDB, PostgreSQL 등)로 바꿀 때도 이 파일만 고치면 됩니다.
 * ---------------------------------------------------------------
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const FILE_PATH = path.join(__dirname, 'projects.json');
const REDIS_KEY = 'portfolio:projects';

const REDIS_URL = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL || '';
const REDIS_TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || '';
const useRedis = Boolean(REDIS_URL && REDIS_TOKEN);

let redisClient = null;
function getRedis() {
  if (!redisClient) {
    // 실제로 Redis를 쓸 때만 패키지를 불러옵니다 (로컬 개발 환경에서는 필요 없음).
    const { Redis } = require('@upstash/redis');
    redisClient = new Redis({ url: REDIS_URL, token: REDIS_TOKEN });
  }
  return redisClient;
}

function readAllFromFile() {
  const raw = fs.readFileSync(FILE_PATH, 'utf-8');
  return raw.trim() ? JSON.parse(raw) : [];
}

function writeAllToFile(projects) {
  fs.writeFileSync(FILE_PATH, JSON.stringify(projects, null, 2), 'utf-8');
}

async function readAll() {
  if (useRedis) {
    const data = await getRedis().get(REDIS_KEY);
    return Array.isArray(data) ? data : [];
  }
  return readAllFromFile();
}

async function writeAll(projects) {
  if (useRedis) {
    await getRedis().set(REDIS_KEY, projects);
    return;
  }
  writeAllToFile(projects);
}

async function getAll() {
  return readAll();
}

async function getById(id) {
  const projects = await readAll();
  return projects.find((project) => project.id === id) || null;
}

async function create(projectData) {
  const projects = await readAll();
  const now = new Date().toISOString();
  const newProject = {
    id: crypto.randomUUID(),
    ...projectData,
    createdAt: now,
    updatedAt: now,
  };
  projects.push(newProject);
  await writeAll(projects);
  return newProject;
}

async function update(id, patch) {
  const projects = await readAll();
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
  await writeAll(projects);
  return updated;
}

async function remove(id) {
  const projects = await readAll();
  const index = projects.findIndex((project) => project.id === id);
  if (index === -1) return false;
  projects.splice(index, 1);
  await writeAll(projects);
  return true;
}

module.exports = { getAll, getById, create, update, remove };
