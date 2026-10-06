/**
 * 방문 예약 저장소 계층 (Repository Layer)
 * projectsRepository.js 와 같은 방식입니다.
 * - 기본: backend/src/data/reservations.json 파일 (개인정보가 들어 있어 git에는 올라가지 않습니다)
 * - KV_REST_API_URL/TOKEN 환경 변수가 있으면 Upstash Redis
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const FILE_PATH = path.join(__dirname, 'reservations.json');
const REDIS_KEY = 'portfolio:reservations';

const REDIS_URL = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL || '';
const REDIS_TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || '';
const useRedis = Boolean(REDIS_URL && REDIS_TOKEN);

let redisClient = null;
function getRedis() {
  if (!redisClient) {
    const { Redis } = require('@upstash/redis');
    redisClient = new Redis({ url: REDIS_URL, token: REDIS_TOKEN });
  }
  return redisClient;
}

async function readAll() {
  if (useRedis) {
    const data = await getRedis().get(REDIS_KEY);
    return Array.isArray(data) ? data : [];
  }
  if (!fs.existsSync(FILE_PATH)) return [];
  const raw = fs.readFileSync(FILE_PATH, 'utf-8');
  return raw.trim() ? JSON.parse(raw) : [];
}

async function writeAll(items) {
  if (useRedis) {
    await getRedis().set(REDIS_KEY, items);
    return;
  }
  fs.writeFileSync(FILE_PATH, JSON.stringify(items, null, 2), 'utf-8');
}

async function getAll() {
  return readAll();
}

async function create(data) {
  const items = await readAll();
  const item = { id: crypto.randomUUID(), ...data, createdAt: new Date().toISOString() };
  items.push(item);
  await writeAll(items);
  return item;
}

async function update(id, patch) {
  const items = await readAll();
  const index = items.findIndex((item) => item.id === id);
  if (index === -1) return null;
  items[index] = { ...items[index], ...patch, id: items[index].id, updatedAt: new Date().toISOString() };
  await writeAll(items);
  return items[index];
}

module.exports = { getAll, create, update };
