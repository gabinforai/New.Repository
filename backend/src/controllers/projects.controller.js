const projectsService = require('../services/projects.service');

// ---- 공개용(퍼블릭) ----
async function listPublic(req, res, next) {
  try {
    res.json(await projectsService.getPublishedProjects());
  } catch (err) {
    next(err);
  }
}

// ---- 관리자용 ----
async function listAdmin(req, res, next) {
  try {
    res.json(await projectsService.getAllProjects());
  } catch (err) {
    next(err);
  }
}

async function getOne(req, res, next) {
  try {
    const project = await projectsService.getProjectById(req.params.id);
    if (!project) return res.status(404).json({ error: '프로젝트를 찾을 수 없습니다.' });
    res.json(project);
  } catch (err) {
    next(err);
  }
}

async function create(req, res, next) {
  try {
    const project = await projectsService.createProject(req.body || {});
    res.status(201).json(project);
  } catch (err) {
    if (err instanceof projectsService.ValidationError) {
      return res.status(400).json({ error: '입력값을 확인해주세요.', details: err.validationErrors });
    }
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const project = await projectsService.updateProject(req.params.id, req.body || {});
    if (!project) return res.status(404).json({ error: '프로젝트를 찾을 수 없습니다.' });
    res.json(project);
  } catch (err) {
    if (err instanceof projectsService.ValidationError) {
      return res.status(400).json({ error: '입력값을 확인해주세요.', details: err.validationErrors });
    }
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    const ok = await projectsService.deleteProject(req.params.id);
    if (!ok) return res.status(404).json({ error: '프로젝트를 찾을 수 없습니다.' });
    res.status(204).end();
  } catch (err) {
    next(err);
  }
}

module.exports = { listPublic, listAdmin, getOne, create, update, remove };
