// 모바일 메뉴 토글
const menuToggle = document.getElementById('menuToggle');
const navLinks = document.querySelector('.nav-links');

if (menuToggle && navLinks) {
  menuToggle.addEventListener('click', () => {
    navLinks.classList.toggle('open');
  });

  navLinks.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      navLinks.classList.remove('open');
    });
  });
}

// 스크롤 시 요소 나타나는 애니메이션
const revealEls = document.querySelectorAll('.reveal');

if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15 }
  );

  revealEls.forEach((el) => observer.observe(el));
} else {
  // 구형 브라우저 대응: 그냥 바로 보여주기
  revealEls.forEach((el) => el.classList.add('in-view'));
}

// ---------- 토스트 알림 ----------
const toastEl = document.getElementById('toast');
let toastTimer = null;

function showToast(message) {
  if (!toastEl) return;
  toastEl.textContent = message;
  toastEl.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toastEl.classList.remove('show');
  }, 2400);
}

// ---------- 공유하기 메뉴 ----------
const shareBtn = document.getElementById('shareBtn');
const shareMenu = document.getElementById('shareMenu');
const copyLinkBtn = document.getElementById('copyLinkBtn');
const sharePdfBtn = document.getElementById('sharePdfBtn');

function closeShareMenu() {
  if (!shareMenu || shareMenu.hidden) return;
  shareMenu.hidden = true;
  shareBtn.setAttribute('aria-expanded', 'false');
}

function openShareMenu() {
  if (!shareMenu) return;
  shareMenu.hidden = false;
  shareBtn.setAttribute('aria-expanded', 'true');
}

if (shareBtn && shareMenu) {
  shareBtn.addEventListener('click', (event) => {
    event.stopPropagation();
    if (shareMenu.hidden) {
      openShareMenu();
    } else {
      closeShareMenu();
    }
  });

  document.addEventListener('click', (event) => {
    if (!shareMenu.hidden && !shareMenu.contains(event.target) && event.target !== shareBtn) {
      closeShareMenu();
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeShareMenu();
  });
}

// 링크 공유: 현재 페이지 주소를 클립보드로 복사
async function copyPageLink() {
  const url = window.location.href;
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(url);
    } else {
      // HTTPS가 아니거나 Clipboard API를 지원하지 않는 환경을 위한 대체 방법
      const textarea = document.createElement('textarea');
      textarea.value = url;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    }
    showToast('링크가 복사되었습니다 🔗');
  } catch (err) {
    showToast('링크 복사에 실패했습니다.');
  }
}

if (copyLinkBtn) {
  copyLinkBtn.addEventListener('click', () => {
    closeShareMenu();
    copyPageLink();
  });
}

// ---------- PDF 공유: 핵심 정보만 뽑아 구조화된 문서로 인쇄 ----------
function buildPrintResume() {
  // 이름
  const nameEl = document.querySelector('.hero h1 .accent');
  const prName = document.getElementById('prName');
  if (prName && nameEl) prName.textContent = nameEl.textContent.trim();

  // 기본 정보
  const prBasicInfo = document.getElementById('prBasicInfo');
  if (prBasicInfo) {
    prBasicInfo.innerHTML = '';
    document.querySelectorAll('.info-card').forEach((card) => {
      const label = card.querySelector('.info-label');
      const value = card.querySelector('.info-value');
      if (!label || !value) return;
      const dt = document.createElement('dt');
      dt.textContent = label.textContent.trim();
      const dd = document.createElement('dd');
      dd.innerHTML = value.innerHTML;
      prBasicInfo.appendChild(dt);
      prBasicInfo.appendChild(dd);
    });
  }

  // 학력
  const prEducation = document.getElementById('prEducation');
  if (prEducation) {
    prEducation.innerHTML = '';
    document.querySelectorAll('.timeline-item').forEach((item) => {
      const school = item.querySelector('h3');
      const status = item.querySelector('.timeline-content p');
      if (!school) return;
      const li = document.createElement('li');
      const nameSpan = document.createElement('span');
      nameSpan.textContent = school.textContent.trim();
      const statusSpan = document.createElement('span');
      statusSpan.className = 'pr-tag';
      statusSpan.textContent = status ? status.textContent.trim() : '';
      li.appendChild(nameSpan);
      li.appendChild(statusSpan);
      prEducation.appendChild(li);
    });
  }

  // 활동 & 업적
  const prAchieve = document.getElementById('prAchieve');
  if (prAchieve) {
    prAchieve.innerHTML = '';
    document.querySelectorAll('.achieve-card').forEach((card) => {
      const year = card.querySelector('.achieve-year');
      const desc = card.querySelector('.achieve-desc');
      if (!desc) return;
      const li = document.createElement('li');
      const yearSpan = document.createElement('span');
      yearSpan.className = 'pr-tag';
      yearSpan.textContent = year ? year.textContent.trim() : '';
      const descSpan = document.createElement('span');
      descSpan.textContent = desc.textContent.trim();
      li.appendChild(descSpan);
      li.appendChild(yearSpan);
      prAchieve.appendChild(li);
    });
  }

  // 좋아하는 것
  const prLikes = document.getElementById('prLikes');
  if (prLikes) {
    const likes = Array.from(document.querySelectorAll('.like-chip')).map((chip) => {
      const icon = chip.querySelector('span');
      const iconText = icon ? icon.textContent.trim() : '';
      const label = chip.textContent.replace(iconText, '').trim();
      return iconText ? `${iconText} ${label}` : label;
    });
    prLikes.textContent = likes.join('  ·  ');
  }

  // 연락처
  const prContact = document.getElementById('prContact');
  if (prContact) {
    prContact.innerHTML = '';
    document.querySelectorAll('.contact-links a, .email-card').forEach((link) => {
      const href = link.getAttribute('href') || '';
      const valueSpan = link.querySelector('span:last-child');
      const value = valueSpan ? valueSpan.textContent.trim() : link.textContent.trim();

      let label = '연락처';
      if (href.startsWith('mailto:')) label = '이메일';
      else if (href.includes('instagram.com')) label = '인스타그램';

      const li = document.createElement('li');
      const labelSpan = document.createElement('span');
      labelSpan.className = 'pr-tag';
      labelSpan.textContent = label;
      const valueSpanEl = document.createElement('span');
      valueSpanEl.textContent = value;
      li.appendChild(valueSpanEl);
      li.appendChild(labelSpan);
      prContact.appendChild(li);
    });
  }

  // 생성 일자
  const prDate = document.getElementById('prDate');
  if (prDate) {
    const today = new Date();
    const formatted = today.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    prDate.textContent = `${formatted} 발급`;
  }
}

function sharePdf() {
  buildPrintResume();
  window.print();
}

if (sharePdfBtn) {
  sharePdfBtn.addEventListener('click', () => {
    closeShareMenu();
    sharePdf();
  });
}
