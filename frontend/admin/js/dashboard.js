const listEl = document.getElementById('projectList');
const statusEl = document.getElementById('listStatus');
const logoutBtn = document.getElementById('logoutBtn');
const duplicateBox = document.getElementById('duplicateWarning');

function escapeHtml(str) {
  if (!str) return '';
  return String(str).replace(
    /[&<>"']/g,
    (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch])
  );
}

function statusBadge(status) {
  return status === 'published'
    ? '<span class="admin-badge admin-badge-published">공개</span>'
    : '<span class="admin-badge admin-badge-draft">초안</span>';
}

function formatDateTime(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleString('ko-KR', { dateStyle: 'medium', timeStyle: 'short' });
}

function renderList(projects) {
  if (!projects.length) {
    statusEl.textContent = '아직 등록된 프로젝트가 없습니다. "+ 새 프로젝트"로 추가해보세요.';
    statusEl.hidden = false;
    listEl.innerHTML = '';
    return;
  }

  statusEl.hidden = true;

  const sorted = [...projects].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

  listEl.innerHTML = sorted
    .map(
      (project) => `
    <div class="admin-project-card">
      <div class="admin-project-info">
        <h3>${escapeHtml(project.title) || '(제목 없는 초안)'} ${statusBadge(project.status)}</h3>
        <p class="admin-project-meta">
          ${project.role ? escapeHtml(project.role) : '역할 미입력'}
          ${project.date ? ' · ' + escapeHtml(project.date) : ''}
        </p>
      </div>
      <div class="admin-project-actions">
        <a href="editor.html?id=${encodeURIComponent(project.id)}" class="btn btn-outline">수정</a>
        <button class="btn btn-outline admin-delete-btn" data-id="${project.id}" type="button">삭제</button>
      </div>
    </div>
  `
    )
    .join('');

  listEl.querySelectorAll('.admin-delete-btn').forEach((btn) => {
    btn.addEventListener('click', () => handleDelete(btn.dataset.id));
  });
}

// ---------- 중복 프로젝트 확인 ----------
// 제목을 간단히 정규화(공백/기호 제거, 소문자 변환)해서 같은 제목끼리 묶습니다.
// 복잡한 유사도 계산 없이 "제목이 사실상 같다"만 판단하는 가벼운 방식입니다.
function normalizeTitle(title) {
  return (title || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/[.,·\-()[\]{}!?'"~`]/g, '');
}

function findDuplicateGroups(projects) {
  const groupsByTitle = new Map();

  projects.forEach((project) => {
    const key = normalizeTitle(project.title);
    if (!key) return; // 제목이 비어있는 초안은 비교하지 않음
    if (!groupsByTitle.has(key)) groupsByTitle.set(key, []);
    groupsByTitle.get(key).push(project);
  });

  return [...groupsByTitle.values()].filter((group) => group.length > 1);
}

function renderDuplicateWarning(projects) {
  const groups = findDuplicateGroups(projects);

  if (!groups.length) {
    duplicateBox.hidden = true;
    duplicateBox.innerHTML = '';
    return;
  }

  duplicateBox.hidden = false;
  duplicateBox.innerHTML = `
    <h2>⚠️ 제목이 같은 프로젝트가 ${groups.length}건 있어요</h2>
    <p>같은 프로젝트를 중복 입력했을 수 있습니다. 남길 1건을 고르면 나머지는 삭제해 정리해드립니다.</p>
    ${groups
      .map(
        (group, groupIndex) => `
      <div class="dup-group">
        <p class="dup-group-title">"${escapeHtml(group[0].title)}" (${group.length}건)</p>
        ${group
          .map(
            (project) => `
          <div class="dup-item">
            <div class="dup-item-info">
              ${statusBadge(project.status)}
              <span class="dup-item-date">${escapeHtml(project.date) || '날짜 미입력'} · 수정 ${formatDateTime(project.updatedAt)}</span>
            </div>
            <div class="dup-item-actions">
              <button class="btn btn-primary dup-keep-btn" data-group="${groupIndex}" data-keep-id="${project.id}" type="button">
                이 항목만 남기기
              </button>
              <a href="editor.html?id=${encodeURIComponent(project.id)}" class="btn btn-outline">보기</a>
              <button class="btn btn-outline admin-delete-btn" data-id="${project.id}" type="button">삭제</button>
            </div>
          </div>
        `
          )
          .join('')}
      </div>
    `
      )
      .join('')}
  `;

  duplicateBox.querySelectorAll('.dup-keep-btn').forEach((btn) => {
    const group = groups[Number(btn.dataset.group)];
    btn.addEventListener('click', () => handleKeepOne(group, btn.dataset.keepId));
  });

  duplicateBox.querySelectorAll('.admin-delete-btn').forEach((btn) => {
    btn.addEventListener('click', () => handleDelete(btn.dataset.id));
  });
}

async function handleKeepOne(group, keepId) {
  const others = group.filter((project) => project.id !== keepId);
  const ok = confirm(`선택한 1건만 남기고 나머지 ${others.length}건을 삭제할까요? 되돌릴 수 없습니다.`);
  if (!ok) return;

  try {
    for (const project of others) {
      await adminApi.deleteProject(project.id);
    }
    load();
  } catch (err) {
    alert('정리에 실패했습니다: ' + err.message);
  }
}

async function handleDelete(id) {
  if (!confirm('이 프로젝트를 삭제할까요? 되돌릴 수 없습니다.')) return;
  try {
    await adminApi.deleteProject(id);
    load();
  } catch (err) {
    alert('삭제에 실패했습니다: ' + err.message);
  }
}

async function load() {
  try {
    const projects = await adminApi.listProjects();
    renderDuplicateWarning(projects);
    renderList(projects);
  } catch (err) {
    if (err.status === 401) {
      window.location.href = 'login.html';
      return;
    }
    statusEl.textContent = '목록을 불러오지 못했습니다: ' + err.message;
    statusEl.hidden = false;
  }
}

logoutBtn.addEventListener('click', async () => {
  try {
    await adminApi.logout();
  } finally {
    window.location.href = 'login.html';
  }
});

load();
