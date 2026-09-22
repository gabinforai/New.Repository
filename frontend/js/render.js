// 서버에서 받아온 데이터를 화면(DOM)에 그리는 함수 모음
// 데이터 구조가 바뀌면 이 파일의 템플릿만 수정하면 됩니다.

// 관리자 화면에서 입력한 텍스트(사용자 입력)를 그대로 innerHTML에 넣으면
// 예상치 못한 HTML이 섞여 들어갈 수 있으므로 이스케이프해서 출력합니다.
function escapeHtml(str) {
  if (str === undefined || str === null) return '';
  return String(str).replace(
    /[&<>"']/g,
    (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch])
  );
}

function renderHero(profile) {
  const eyebrow = document.getElementById('heroEyebrow');
  const desc = document.getElementById('heroDesc');
  const accent = document.querySelector('.hero h1 .accent');
  if (eyebrow) eyebrow.textContent = profile.heroEyebrow;
  if (desc) desc.textContent = profile.heroDesc;
  if (accent) accent.textContent = profile.name;
}

function renderBasicInfo(basicInfo) {
  const grid = document.getElementById('infoGrid');
  if (!grid) return;
  grid.innerHTML = basicInfo
    .map(
      (item) => `
    <div class="info-card reveal">
      <span class="info-icon">${item.icon}</span>
      <p class="info-label">${item.label}</p>
      <p class="info-value">${item.value}</p>
    </div>
  `
    )
    .join('');
}

function renderEducation(education) {
  const timeline = document.getElementById('timeline');
  if (!timeline) return;
  timeline.innerHTML = education
    .map((item) => {
      const statusHtml = item.current
        ? `${item.department} · ${item.admissionYear}학번 · <span class="badge">${item.status}</span>`
        : item.status;
      return `
      <div class="timeline-item reveal${item.current ? ' current' : ''}">
        <div class="timeline-dot"></div>
        <div class="timeline-content">
          <h3>${item.school}</h3>
          <p>${statusHtml}</p>
        </div>
      </div>
    `;
    })
    .join('');
}

function renderAchievements(achievements) {
  const grid = document.getElementById('achieveGrid');
  if (!grid) return;
  grid.innerHTML = achievements
    .map(
      (item) => `
    <div class="achieve-card reveal">
      <span class="achieve-year">${item.year}</span>
      <p class="achieve-desc">${item.prefix} <strong>${item.highlight}</strong></p>
    </div>
  `
    )
    .join('');
}

function renderLikes(likes) {
  const grid = document.getElementById('likesGrid');
  if (!grid) return;
  grid.innerHTML = likes
    .map((item) => `<div class="like-chip reveal"><span>${item.icon}</span>${item.label}</div>`)
    .join('');
}

function renderContact(contact) {
  const wrap = document.getElementById('contactLinks');
  if (!wrap) return;
  wrap.innerHTML = contact
    .map((item) => {
      const target = item.type === 'instagram' ? ' target="_blank" rel="noopener noreferrer"' : '';
      return `
      <a href="${item.href}" class="email-card"${target}>
        <span class="mail-icon">${item.icon}</span>
        <span>${item.label}</span>
      </a>
    `;
    })
    .join('');
}

function renderProjects(projects) {
  const grid = document.getElementById('projectsGrid');
  if (!grid) return;

  if (!projects.length) {
    grid.innerHTML = '<p class="loading-text">아직 공개된 프로젝트가 없습니다.</p>';
    return;
  }

  grid.innerHTML = projects
    .map(
      (item) => `
    <div class="project-card reveal">
      <div class="project-card-head">
        <h3>${escapeHtml(item.title)}</h3>
        <span class="project-date">${escapeHtml(item.date)}</span>
      </div>
      <p class="project-role">${escapeHtml(item.role)}</p>
      <p class="project-desc">${escapeHtml(item.description)}</p>
      <div class="project-meta">
        <span class="project-participants">참여인원 ${escapeHtml(item.participants)}명</span>
      </div>
      ${item.notes ? `<p class="project-notes">${escapeHtml(item.notes)}</p>` : ''}
    </div>
  `
    )
    .join('');
}

function renderError(sectionId, message) {
  const el = document.getElementById(sectionId);
  if (el) el.innerHTML = `<p class="load-error">${message}</p>`;
}
