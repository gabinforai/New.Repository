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

function render(items) {
  if (!items.length) {
    statusEl.textContent = '아직 접수된 예약이 없습니다.';
    statusEl.hidden = false;
    tableWrap.hidden = true;
    return;
  }
  statusEl.hidden = true;
  tableWrap.hidden = false;
  bodyEl.innerHTML = items.map(renderRow).join('');
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
    render(await adminApi.listReservations());
  } catch (err) {
    if (err.status === 401) {
      window.location.href = 'login.html';
      return;
    }
    statusEl.textContent = '목록을 불러오지 못했습니다: ' + err.message;
    statusEl.hidden = false;
  }
}

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
