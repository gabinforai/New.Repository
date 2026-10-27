// 방명록: 글 목록 불러오기 + 글 남기기
// 글은 서버(Supabase)에 저장되어, 새로 들어와도 지난 글이 계속 남아 있습니다.
(function () {
  const form = document.getElementById('gbForm');
  const listEl = document.getElementById('gbList');
  if (!form || !listEl || typeof api === 'undefined') return;

  const nameEl = document.getElementById('gbName');
  const msgEl = document.getElementById('gbMessage');
  const hpEl = document.getElementById('gbWebsite');
  const countEl = document.getElementById('gbCount');
  const errEl = document.getElementById('gbError');
  const totalEl = document.getElementById('gbTotal');
  const submitBtn = document.getElementById('gbSubmit');
  const moreBtn = document.getElementById('gbMore');

  const PAGE = 10;
  const NAME_KEY = 'gbName';
  let items = [];
  let shown = PAGE;

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

  function render() {
    totalEl.textContent = items.length ? `총 ${items.length}개의 글` : '';
    if (!items.length) {
      listEl.innerHTML = '<p class="loading-text">아직 남겨진 글이 없어요. 첫 번째 방문자가 되어 주세요!</p>';
      moreBtn.hidden = true;
      return;
    }
    listEl.innerHTML = items
      .slice(0, shown)
      .map(
        (it) => `
      <article class="gb-item">
        <header><b>${esc(it.name)}</b><time datetime="${esc(it.createdAt)}">${fmt(it.createdAt)}</time></header>
        <p>${esc(it.message)}</p>
      </article>`
      )
      .join('');
    moreBtn.hidden = items.length <= shown;
  }

  async function load() {
    try {
      items = await api.getGuestbook();
      render();
    } catch (err) {
      console.error(err);
      listEl.innerHTML = '<p class="load-error">방명록을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.</p>';
      moreBtn.hidden = true;
    }
  }

  function showError(messages) {
    errEl.innerHTML = messages.map(esc).join('<br>');
    errEl.hidden = false;
  }

  msgEl.addEventListener('input', () => {
    countEl.textContent = `${msgEl.value.length} / 500`;
  });
  moreBtn.addEventListener('click', () => {
    shown += PAGE;
    render();
  });

  try {
    nameEl.value = localStorage.getItem(NAME_KEY) || '';
  } catch (e) {
    /* 저장소를 못 쓰는 환경 - 무시 */
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    errEl.hidden = true;
    const name = nameEl.value.trim();
    const message = msgEl.value.trim();
    const errs = [];
    if (!name) errs.push('이름을 입력해주세요.');
    if (!message) errs.push('메시지를 입력해주세요.');
    if (errs.length) return showError(errs);

    submitBtn.disabled = true;
    submitBtn.textContent = '남기는 중...';
    try {
      const created = await api.postGuestbook({ name, message, website: hpEl.value });
      try {
        localStorage.setItem(NAME_KEY, name);
      } catch (e2) {
        /* 무시 */
      }
      msgEl.value = '';
      countEl.textContent = '0 / 500';
      if (created && created.id) {
        items = [created, ...items];
        render();
      } else {
        await load();
      }
    } catch (err) {
      showError(err.details && err.details.length ? err.details : [err.message]);
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = '남기기';
    }
  });

  load();
})();
