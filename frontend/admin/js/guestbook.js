const statusEl = document.getElementById('listStatus');
const summaryBox = document.getElementById('summaryBox');
const summaryText = document.getElementById('summaryText');
const filtersEl = document.getElementById('filters');
const listEl = document.getElementById('gbList');
const logoutBtn = document.getElementById('logoutBtn');

let allItems = [];
let currentFilter = 'all';

const FILTERS = [
  ['all', '전체'],
  ['visible', '공개 중'],
  ['hidden', '숨김'],
];

function esc(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function fmt(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}.${p(d.getMonth() + 1)}.${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

function matches(item) {
  if (currentFilter === 'visible') return !item.hidden;
  if (currentFilter === 'hidden') return item.hidden;
  return true;
}

function render() {
  const hiddenCount = allItems.filter((i) => i.hidden).length;
  summaryText.textContent = `총 ${allItems.length}개 · 공개 ${allItems.length - hiddenCount}개 · 숨김 ${hiddenCount}개`;
  filtersEl.innerHTML = FILTERS.map(([key, label]) => {
    const n = key === 'all' ? allItems.length : key === 'hidden' ? hiddenCount : allItems.length - hiddenCount;
    return `<button type="button" class="resv-filter${currentFilter === key ? ' is-active' : ''}" data-filter="${key}">${label} <span class="resv-filter-count">${n}</span></button>`;
  }).join('');
  summaryBox.hidden = false;

  const visible = allItems.filter(matches);
  if (!allItems.length) {
    statusEl.textContent = '아직 남겨진 방명록 글이 없습니다.';
    statusEl.hidden = false;
  } else if (!visible.length) {
    statusEl.textContent = '해당하는 글이 없습니다.';
    statusEl.hidden = false;
  } else {
    statusEl.hidden = true;
  }

  listEl.innerHTML = visible
    .map(
      (it) => `
    <div class="admin-project-card gba-card${it.hidden ? ' is-hidden' : ''}">
      <div class="admin-project-info gba-info">
        <h3>${esc(it.name)}
          <span class="admin-badge ${it.hidden ? 'admin-badge-draft' : 'admin-badge-published'}">${it.hidden ? '숨김' : '공개 중'}</span>
        </h3>
        <p class="gba-msg">${esc(it.message)}</p>
        <p class="admin-project-meta">${fmt(it.createdAt)}</p>
      </div>
      <div class="admin-project-actions">
        <button type="button" class="btn btn-outline" data-act="toggle" data-id="${esc(it.id)}" data-hidden="${it.hidden}">${it.hidden ? '다시 공개' : '숨기기'}</button>
        <button type="button" class="btn btn-outline gba-del" data-act="delete" data-id="${esc(it.id)}">삭제</button>
      </div>
    </div>`
    )
    .join('');
}

function handleError(err) {
  if (err.status === 401) {
    window.location.href = 'login.html';
    return;
  }
  alert('처리에 실패했습니다: ' + err.message);
}

async function load() {
  try {
    allItems = await adminApi.listGuestbook();
    render();
  } catch (err) {
    if (err.status === 401) {
      window.location.href = 'login.html';
      return;
    }
    statusEl.textContent = '목록을 불러오지 못했습니다: ' + err.message;
    statusEl.hidden = false;
  }
}

filtersEl.addEventListener('click', (e) => {
  const btn = e.target.closest('.resv-filter');
  if (!btn) return;
  currentFilter = btn.dataset.filter;
  render();
});

listEl.addEventListener('click', async (e) => {
  const btn = e.target.closest('button[data-act]');
  if (!btn || btn.disabled) return;
  const id = btn.dataset.id;
  if (btn.dataset.act === 'delete' && !confirm('이 글을 완전히 삭제할까요? 되돌릴 수 없습니다.')) return;
  btn.disabled = true;
  try {
    if (btn.dataset.act === 'delete') await adminApi.deleteGuestbook(id);
    else await adminApi.setGuestbookHidden(id, btn.dataset.hidden !== 'true');
    await load();
  } catch (err) {
    btn.disabled = false;
    handleError(err);
  }
});

logoutBtn.addEventListener('click', async () => {
  try {
    await adminApi.logout();
  } finally {
    window.location.href = 'login.html';
  }
});

load();
