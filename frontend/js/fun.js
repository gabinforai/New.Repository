// "기본 정보" 카드를 누르면 나타나는 재미 요소 모음
//  생년월일 -> 폭죽 + 생일 카운트다운      별자리 -> 전갈자리 별 모양
//  띠 -> 닭 울음소리(꼬끼오)               MBTI -> ISFP 모험가
//  출생 -> 아기 울음(응애응애)             사는 곳/지내는 곳 -> 지도
//  자격증 -> 자동차가 부르릉 지나감
// 소리는 파일 없이 브라우저의 Web Audio 로 직접 합성합니다.
(function () {
  const grid = document.getElementById('infoGrid');
  if (!grid) return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const BIRTH = { y: 2005, m: 11, d: 10 };
  const COLORS = ['#ff4fc8', '#9b78e0', '#ffffff', '#4fe3ff', '#ffd84f'];

  // ---------------------------------------------------------------- 소리
  let actx = null;
  function audio() {
    if (!actx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      actx = new AC();
    }
    if (actx.state === 'suspended') actx.resume();
    return actx;
  }

  // 주파수가 변하는 소리 한 덩어리: points = [[시간(초), Hz], ...]
  function voice(points, { type = 'sawtooth', gain = 0.16, filter = 1400, vibrato = 0, start = 0 } = {}) {
    const ac = audio();
    if (!ac) return;
    const t0 = ac.currentTime + start;
    const end = t0 + points[points.length - 1][0];
    const osc = ac.createOscillator();
    const amp = ac.createGain();
    const bp = ac.createBiquadFilter();
    osc.type = type;
    bp.type = 'bandpass';
    bp.frequency.value = filter;
    bp.Q.value = 0.9;
    osc.frequency.setValueAtTime(points[0][1], t0);
    points.forEach(([t, f]) => osc.frequency.linearRampToValueAtTime(f, t0 + t));
    amp.gain.setValueAtTime(0.0001, t0);
    amp.gain.linearRampToValueAtTime(gain, t0 + 0.03);
    amp.gain.setValueAtTime(gain, Math.max(t0 + 0.03, end - 0.08));
    amp.gain.linearRampToValueAtTime(0.0001, end);
    if (vibrato) {
      const lfo = ac.createOscillator();
      const depth = ac.createGain();
      lfo.frequency.value = vibrato;
      depth.gain.value = points[0][1] * 0.04;
      lfo.connect(depth);
      depth.connect(osc.frequency);
      lfo.start(t0);
      lfo.stop(end);
    }
    osc.connect(bp);
    bp.connect(amp);
    amp.connect(ac.destination);
    osc.start(t0);
    osc.stop(end + 0.05);
  }

  function playCrow() {
    // 꼬 - 끼 - 오오오~
    voice([[0, 640], [0.12, 880]], { filter: 1500 });
    voice([[0, 760], [0.12, 980]], { filter: 1600, start: 0.17 });
    voice([[0, 900], [0.25, 1320], [0.6, 1280], [1.05, 720]], { filter: 1700, vibrato: 13, gain: 0.2, start: 0.36 });
  }

  function playBaby() {
    // 응애~ 응애~ 응애~
    for (let i = 0; i < 3; i++) {
      voice([[0, 380], [0.12, 560], [0.4, 500], [0.55, 420]], { filter: 1500, vibrato: 7, gain: 0.17, start: i * 0.72 });
    }
  }

  function playCar() {
    const ac = audio();
    if (!ac) return;
    // 엔진음(낮은 톱니파 두 개) + 지나가며 높아졌다 낮아지는 도플러 느낌
    [0, 6].forEach((det) => {
      voice([[0, 70 + det], [0.7, 150 + det], [1.1, 230 + det], [2.4, 95 + det]], {
        type: 'sawtooth', gain: 0.1, filter: 420, vibrato: 24,
      });
    });
    // 바람 소리(노이즈)
    const len = Math.floor(ac.sampleRate * 2.4);
    const buf = ac.createBuffer(1, len, ac.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    const src = ac.createBufferSource();
    const amp = ac.createGain();
    const lp = ac.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 900;
    const t0 = ac.currentTime;
    amp.gain.setValueAtTime(0.0001, t0);
    amp.gain.linearRampToValueAtTime(0.16, t0 + 1.1);
    amp.gain.linearRampToValueAtTime(0.0001, t0 + 2.4);
    src.buffer = buf;
    src.connect(lp);
    lp.connect(amp);
    amp.connect(ac.destination);
    src.start(t0);
  }

  // ---------------------------------------------------------------- 모달
  let modal = null;
  let cleanup = null;

  function closeModal() {
    if (cleanup) cleanup();
    cleanup = null;
    if (modal) modal.remove();
    modal = null;
    document.removeEventListener('keydown', onKey);
  }
  function onKey(e) {
    if (e.key === 'Escape') closeModal();
  }

  function openModal(title, bodyEl, onClose) {
    closeModal();
    modal = document.createElement('div');
    modal.className = 'fun-modal';
    modal.innerHTML = `
      <div class="fun-box" role="dialog" aria-modal="true">
        <button class="fun-close" type="button" aria-label="닫기">×</button>
        <p class="fun-tag"></p>
      </div>`;
    modal.querySelector('.fun-tag').textContent = title;
    modal.querySelector('.fun-box').appendChild(bodyEl);
    modal.addEventListener('click', (e) => {
      if (e.target === modal || e.target.closest('.fun-close')) closeModal();
    });
    document.body.appendChild(modal);
    document.addEventListener('keydown', onKey);
    cleanup = onClose || null;
    return modal;
  }

  function el(html) {
    const d = document.createElement('div');
    d.innerHTML = html.trim();
    return d;
  }

  // ---------------------------------------------------------------- 폭죽
  let fwRunning = false;
  function fireworks(duration = 5200) {
    if (reduceMotion || fwRunning) return;
    fwRunning = true;
    const cv = document.createElement('canvas');
    cv.className = 'fun-fx';
    document.body.appendChild(cv);
    const ctx = cv.getContext('2d');
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const resize = () => {
      cv.width = innerWidth * dpr;
      cv.height = innerHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const sparks = [];
    const rockets = [];
    const t0 = performance.now();
    let lastLaunch = 0;
    let prev = t0;

    function launch() {
      rockets.push({
        x: innerWidth * (0.15 + Math.random() * 0.7),
        y: innerHeight,
        ty: innerHeight * (0.12 + Math.random() * 0.4),
        vy: -(520 + Math.random() * 160),
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
      });
    }
    function burst(x, y, color) {
      const n = 70 + Math.floor(Math.random() * 40);
      for (let i = 0; i < n; i++) {
        const a = (Math.PI * 2 * i) / n + Math.random() * 0.2;
        const v = 80 + Math.random() * 220;
        sparks.push({
          x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v,
          life: 1, decay: 0.45 + Math.random() * 0.5,
          color: Math.random() < 0.3 ? '#ffffff' : color,
        });
      }
    }
    function frame(now) {
      const dt = Math.min(0.04, (now - prev) / 1000);
      prev = now;
      const el = now - t0;
      if (el < duration - 1500 && el - lastLaunch > 380) {
        lastLaunch = el;
        launch();
        if (Math.random() < 0.4) launch();
      }
      ctx.clearRect(0, 0, innerWidth, innerHeight);
      for (let i = rockets.length - 1; i >= 0; i--) {
        const r = rockets[i];
        r.y += r.vy * dt;
        ctx.fillStyle = r.color;
        ctx.fillRect(r.x - 1.5, r.y, 3, 10);
        if (r.y <= r.ty) {
          burst(r.x, r.y, r.color);
          rockets.splice(i, 1);
        }
      }
      for (let i = sparks.length - 1; i >= 0; i--) {
        const s = sparks[i];
        s.vy += 160 * dt;
        s.vx *= 0.985;
        s.x += s.vx * dt;
        s.y += s.vy * dt;
        s.life -= s.decay * dt;
        if (s.life <= 0) { sparks.splice(i, 1); continue; }
        ctx.globalAlpha = Math.max(0, s.life);
        ctx.fillStyle = s.color;
        ctx.fillRect(s.x, s.y, 3, 3); // 도트 느낌의 네모 불꽃
      }
      ctx.globalAlpha = 1;
      if (el < duration || sparks.length || rockets.length) requestAnimationFrame(frame);
      else {
        cv.remove();
        fwRunning = false;
      }
    }
    requestAnimationFrame(frame);
  }

  // ---------------------------------------------------------------- 각 카드의 동작
  function pad(n) { return String(n).padStart(2, '0'); }

  function birthday() {
    fireworks();
    const body = el(`
      <div class="fun-center">
        <p class="fun-big" id="bdTitle"></p>
        <p class="fun-sub" id="bdSub"></p>
        <div class="fun-count" id="bdCount"></div>
        <p class="fun-note">${BIRTH.y}년 ${BIRTH.m}월 ${BIRTH.d}일생</p>
      </div>`);
    const title = body.querySelector('#bdTitle');
    const sub = body.querySelector('#bdSub');
    const count = body.querySelector('#bdCount');

    function tick() {
      const now = new Date();
      let next = new Date(now.getFullYear(), BIRTH.m - 1, BIRTH.d);
      const isToday = now.getMonth() === BIRTH.m - 1 && now.getDate() === BIRTH.d;
      if (!isToday && next <= now) next = new Date(now.getFullYear() + 1, BIRTH.m - 1, BIRTH.d);
      const age = (isToday ? now.getFullYear() : next.getFullYear()) - BIRTH.y;
      if (isToday) {
        title.textContent = '🎉 오늘은 생일이에요!';
        sub.textContent = `${age}번째 생일을 축하해요`;
        count.innerHTML = '';
        return;
      }
      const diff = next - now;
      const days = Math.floor(diff / 86400000);
      const h = Math.floor((diff % 86400000) / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      title.textContent = `다음 생일까지 D-${days}`;
      sub.textContent = `${next.getFullYear()}년 ${BIRTH.m}월 ${BIRTH.d}일 · ${age}번째 생일`;
      count.innerHTML = [
        [days, '일'], [pad(h), '시간'], [pad(m), '분'], [pad(s), '초'],
      ].map(([v, u]) => `<div><b>${v}</b><span>${u}</span></div>`).join('');
    }
    tick();
    const timer = setInterval(tick, 1000);
    openModal('BIRTHDAY', body, () => clearInterval(timer));
  }

  function scorpio() {
    // 전갈자리 별 좌표(0~100 상자 안의 대략적인 모양)
    const stars = {
      beta: [20, 12, 'β'], delta: [27, 22, 'δ'], pi: [14, 25, 'π'], sigma: [33, 34, 'σ'],
      antares: [38, 43, 'α 안타레스'], tau: [42, 53, 'τ'], eps: [48, 65, 'ε'], mu: [56, 75, 'μ'],
      zeta: [66, 81, 'ζ'], eta: [76, 79, 'η'], theta: [84, 69, 'θ'], iota: [88, 58, 'ι'],
      kappa: [90, 47, 'κ'], lambda: [86, 37, 'λ'], ups: [80, 34, 'υ'],
    };
    const lines = [
      ['pi', 'delta'], ['beta', 'delta'], ['delta', 'sigma'], ['sigma', 'antares'], ['antares', 'tau'],
      ['tau', 'eps'], ['eps', 'mu'], ['mu', 'zeta'], ['zeta', 'eta'], ['eta', 'theta'],
      ['theta', 'iota'], ['iota', 'kappa'], ['kappa', 'lambda'], ['lambda', 'ups'],
    ];
    const body = el(`
      <div class="fun-center">
        <canvas class="fun-sky" width="640" height="560"></canvas>
        <p class="fun-big">♏ 전갈자리</p>
        <p class="fun-note">붉은 별 안타레스가 전갈의 심장이에요 · 10월 23일 ~ 11월 22일</p>
      </div>`);
    const cv = body.querySelector('canvas');
    const ctx = cv.getContext('2d');
    const bg = Array.from({ length: 70 }, () => [Math.random() * 640, Math.random() * 560, Math.random() * 6]);
    const P = ([x, y]) => [40 + x * 5.6, 30 + y * 5.0];
    let raf;
    const t0 = performance.now();

    function frame(now) {
      const t = (now - t0) / 1000;
      ctx.clearRect(0, 0, 640, 560);
      bg.forEach(([x, y, ph]) => {
        ctx.globalAlpha = 0.25 + 0.25 * Math.sin(t * 2 + ph);
        ctx.fillStyle = '#fff';
        ctx.fillRect(x, y, 2, 2);
      });
      ctx.globalAlpha = 1;
      // 선이 하나씩 이어지는 연출
      const shown = reduceMotion ? lines.length : Math.min(lines.length, t * 5);
      ctx.strokeStyle = 'rgba(155,120,224,0.9)';
      ctx.lineWidth = 2;
      lines.forEach(([a, b], i) => {
        if (i > shown) return;
        const [x1, y1] = P(stars[a]);
        const [x2, y2] = P(stars[b]);
        const k = Math.min(1, shown - i);
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x1 + (x2 - x1) * k, y1 + (y2 - y1) * k);
        ctx.stroke();
      });
      Object.entries(stars).forEach(([name, s], i) => {
        const [x, y] = P(s);
        const big = name === 'antares';
        const tw = 0.75 + 0.25 * Math.sin(t * 3 + i);
        const r = (big ? 11 : 5.5) * tw;
        const g = ctx.createRadialGradient(x, y, 0, x, y, r * 3);
        g.addColorStop(0, big ? 'rgba(255,90,90,0.9)' : 'rgba(255,255,255,0.8)');
        g.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(x, y, r * 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = big ? '#ff6b6b' : '#fff';
        ctx.fillRect(x - r / 2, y - r / 2, r, r);
        if (big) {
          ctx.fillStyle = '#ffb3b3';
          ctx.font = '700 15px "Space Mono", monospace';
          ctx.fillText(s[2], x + 16, y + 5);
        }
      });
      raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);
    openModal('CONSTELLATION', body, () => cancelAnimationFrame(raf));
  }

  function rooster() {
    const body = el(`
      <div class="fun-center">
        <div class="fun-actor" id="actor">🐓</div>
        <div class="fun-bubble" id="bubble">꼬끼오~!</div>
        <p class="fun-big">닭띠 · 을유년(乙酉年)</p>
        <p class="fun-note">2005년생은 닭띠예요</p>
        <button class="btn btn-outline" type="button" id="again">🔊 다시 울기</button>
      </div>`);
    const actor = body.querySelector('#actor');
    const bubble = body.querySelector('#bubble');
    function crow() {
      playCrow();
      actor.classList.remove('crowing');
      bubble.classList.remove('pop');
      void actor.offsetWidth;
      actor.classList.add('crowing');
      bubble.classList.add('pop');
    }
    body.querySelector('#again').addEventListener('click', crow);
    openModal('ZODIAC', body);
    crow();
  }

  function adventurer() {
    const traits = [
      ['🎨', '감성이 풍부한 예술가', '아름다운 것과 새로운 경험에 마음이 움직여요.'],
      ['🧭', '자유로운 탐험가', '정해진 길보다 내가 끌리는 길을 따라가요.'],
      ['🌿', '온화하고 배려 깊음', '다정하게 곁을 지키고, 부딪히기보다 조용히 품어요.'],
      ['✨', '지금 이 순간을 즐김', '눈앞의 경험과 감각을 소중히 여겨요.'],
    ];
    const body = el(`
      <div class="fun-center">
        <div class="fun-actor float">🧭</div>
        <p class="fun-big">ISFP · 모험가</p>
        <p class="fun-sub">Adventurer</p>
        <ul class="fun-traits">
          ${traits.map(([i, t, d]) => `<li><span>${i}</span><div><b>${t}</b><p>${d}</p></div></li>`).join('')}
        </ul>
      </div>`);
    openModal('MBTI', body);
  }

  function baby() {
    const body = el(`
      <div class="fun-center">
        <div class="fun-actor-wrap">
          <div class="fun-actor" id="actor">👶</div>
          <span class="tear t1">💧</span><span class="tear t2">💧</span>
        </div>
        <div class="fun-bubble" id="bubble">응애~ 응애~!</div>
        <p class="fun-big">${BIRTH.y}.${pad(BIRTH.m)}.${pad(BIRTH.d)} 출생</p>
        <p class="fun-note">서울특별시 강서구 유광사 산부인과</p>
        <button class="btn btn-outline" type="button" id="again">🔊 다시 울기</button>
      </div>`);
    const actor = body.querySelector('#actor');
    const bubble = body.querySelector('#bubble');
    const wrap = body.querySelector('.fun-actor-wrap');
    function cry() {
      playBaby();
      [actor, wrap].forEach((n) => n.classList.remove('crying'));
      bubble.classList.remove('pop');
      void actor.offsetWidth;
      [actor, wrap].forEach((n) => n.classList.add('crying'));
      bubble.classList.add('pop');
    }
    body.querySelector('#again').addEventListener('click', cry);
    openModal('BIRTH', body);
    cry();
  }

  function map(title, place, lat, lon, span) {
    const bbox = [lon - span * 1.4, lat - span, lon + span * 1.4, lat + span].join(',');
    const src = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat},${lon}`;
    const big = `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lon}#map=13/${lat}/${lon}`;
    const body = el(`
      <div class="fun-center">
        <p class="fun-big">📍 ${place}</p>
        <div class="fun-map"><iframe title="${place} 지도" loading="lazy" src="${src}"></iframe></div>
        <p class="fun-note"><a href="${big}" target="_blank" rel="noopener">큰 지도로 보기 ↗</a> · 지도 ©OpenStreetMap 기여자</p>
      </div>`);
    openModal(title, body);
  }

  function car() {
    playCar();
    if (reduceMotion) return;
    const lane = document.createElement('div');
    lane.className = 'fun-road';
    lane.innerHTML = `
      <div class="fun-car"><span class="fun-vroom">부르릉~!</span><span class="fun-car-emoji">🚗</span><span class="fun-dust">💨</span></div>
      <i class="fun-line l1"></i><i class="fun-line l2"></i><i class="fun-line l3"></i>`;
    document.body.appendChild(lane);
    setTimeout(() => lane.remove(), 2800);
  }

  const ACTIONS = {
    '생년월일': birthday,
    '별자리': scorpio,
    '띠': rooster,
    'MBTI': adventurer,
    '출생': baby,
    '사는 곳': () => map('HOME', '서울특별시 강서구', 37.5509, 126.8495, 0.045),
    '지내는 곳': () => map('CAMPUS TOWN', '충청남도 천안시 동남구', 36.8066, 127.1523, 0.06),
    '자격증': car,
  };

  function handle(card) {
    const act = ACTIONS[(card.dataset.label || '').trim()];
    if (act) act();
  }
  grid.addEventListener('click', (e) => {
    const card = e.target.closest('.info-card');
    if (card) handle(card);
  });
  grid.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    const card = e.target.closest('.info-card');
    if (card) {
      e.preventDefault();
      handle(card);
    }
  });
})();
