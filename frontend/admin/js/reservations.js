const statusEl = document.getElementById('listStatus');
const tableWrap = document.getElementById('tableWrap');
const bodyEl = document.getElementById('resvBody');
const logoutBtn = document.getElementById('logoutBtn');

const STATUS_LABELS = {
  received: '접수',
  confirmed: '확정',
  change_requested: '변경 요청',
  canceled: '취소',
};

const summaryBox = document.getElementById('summaryBox');
const summaryText = document.getElementById('summaryText');
const filtersEl = document.getElementById('filters');

let allItems = [];
let currentFilter = 'all'; // 'all' 또는 STATUS_LABELS 의 키

function escapeHtml(str) {
  if (!str) return '';
  return String(str).replace(
    /[&<>"']/g,
    (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch])
  );
}

function formatVisit(date, time) {
  const [y, m, d] = date.split('-').map(Number);
  const dow = ['일', '월', '화', '수', '목', '금', '토'][new Date(y, m - 1, d).getDay()];
  return `${y}.${String(m).padStart(2, '0')}.${String(d).padStart(2, '0')} (${dow})<br>${escapeHtml(time)}`;
}

function renderRow(item) {
  const buttons = Object.entries(STATUS_LABELS)
    .map(([key, label]) => {
      const current = item.status === key;
      return `<button type="button" class="resv-btn${current ? ' is-current' : ''}" data-id="${escapeHtml(item.id)}" data-status="${key}"${current ? ' disabled' : ''}>${label}</button>`;
    })
    .join('');

  return `
    <tr>
      <td class="resv-no">${escapeHtml(item.reservationNo)}</td>
      <td><div class="resv-name">${escapeHtml(item.name)}</div><div class="resv-email">${escapeHtml(item.email)}</div></td>
      <td class="resv-time">${formatVisit(item.date, item.time)}</td>
      <td><div class="resv-purpose">${escapeHtml(item.purpose)}</div></td>
      <td><span class="resv-badge resv-badge-${item.status}">${STATUS_LABELS[item.status]}</span></td>
      <td><div class="resv-actions">${buttons}</div></td>
    </tr>`;
}

function countByStatus(items) {
  const counts = { all: items.length };
  Object.keys(STATUS_LABELS).forEach((key) => {
    counts[key] = items.filter((item) => item.status === key).length;
  });
  return counts;
}

function renderSummary(counts) {
  summaryText.textContent =
    `전체 ${counts.all}건 / ` +
    Object.entries(STATUS_LABELS)
      .map(([key, label]) => `${label} ${counts[key]}건`)
      .join(' / ');

  const filters = [['all', '전체'], ...Object.entries(STATUS_LABELS)];
  filtersEl.innerHTML = filters
    .map(
      ([key, label]) =>
        `<button type="button" class="resv-filter${key === currentFilter ? ' is-active' : ''}" data-filter="${key}" aria-pressed="${key === currentFilter}">${label} <span class="resv-filter-count">${counts[key]}</span></button>`
    )
    .join('');
}

function render() {
  // 예약이 0건이어도 요약과 필터는 항상 보여줍니다.
  renderSummary(countByStatus(allItems));
  summaryBox.hidden = false;

  if (!allItems.length) {
    statusEl.textContent = '아직 접수된 예약이 없습니다.';
    statusEl.hidden = false;
    tableWrap.hidden = true;
    return;
  }

  const visible = currentFilter === 'all' ? allItems : allItems.filter((item) => item.status === currentFilter);
  if (!visible.length) {
    statusEl.textContent = `'${STATUS_LABELS[currentFilter]}' 상태의 예약이 없습니다.`;
    statusEl.hidden = false;
    tableWrap.hidden = true;
    return;
  }

  statusEl.hidden = true;
  tableWrap.hidden = false;
  bodyEl.innerHTML = visible.map(renderRow).join('');
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
    allItems = await adminApi.listReservations();
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

bodyEl.addEventListener('click', async (e) => {
  const btn = e.target.closest('.resv-btn');
  if (!btn || btn.disabled) return;
  if (btn.dataset.status === 'canceled' && !confirm('이 예약을 취소 상태로 바꿀까요?')) return;
  btn.disabled = true;
  try {
    await adminApi.updateReservationStatus(btn.dataset.id, btn.dataset.status);
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
