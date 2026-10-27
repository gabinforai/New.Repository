// 히어로 배경: 디더링 도트 손 + 날아가는 입자 + 가속(HOLD FOR SPEED) 연출
// - 손은 2D 캔버스에 도형으로 그린 뒤, 작은 칸(cell)으로 나눠 마젠타/보라 도트로 다시 그립니다.
// - 히어로 영역을 누르고 있으면 속도가 올라가고 입자가 길게 늘어나며 띠 문구가 나타납니다.
(function () {
  const hero = document.getElementById('home');
  const canvas = document.getElementById('heroCanvas');
  if (!hero || !canvas) return;

  const ctx = canvas.getContext('2d');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const PINK = '#ff4fc8';
  const PURPLE = '#9b78e0';
  const W = 76; // 손 그림 해상도(칸 수)
  const H = 100;
  const BAYER = [
    [0, 8, 2, 10],
    [12, 4, 14, 6],
    [3, 11, 1, 9],
    [15, 7, 13, 5],
  ];

  const off = document.createElement('canvas');
  off.width = W;
  off.height = H;
  const octx = off.getContext('2d', { willReadFrequently: true });

  // 포즈: curl(접힘 0~1) = [엄지, 검지, 중지, 약지, 소지], spread(벌어짐), rot(손목 기울기)
  const POSES = [
    { name: 'ASTRO DITHER', curl: [0, 0, 0, 0, 0], spread: 1, rot: 0.0 },
    { name: 'ASTRO TACK', curl: [0.2, 0, 0.9, 0.9, 0.9], spread: 0.6, rot: -0.15 },
    { name: 'ASTRO CLICK', curl: [0.6, 0.1, 0.1, 0.9, 0.9], spread: 0.5, rot: 0.25 },
    { name: 'ASTRO CHIK', curl: [0.9, 0.9, 0.9, 0.9, 0.9], spread: 0.3, rot: -0.3 },
    { name: 'ASTRO POW', curl: [0.1, 0.2, 0.1, 0.2, 0.1], spread: 1.25, rot: 0.15 },
    { name: 'ASTRO CLAP', curl: [0.3, 0.05, 0.05, 0.05, 0.1], spread: 0.35, rot: 0.35 },
  ];
  // 손가락 기본 각도(위쪽 기준, 오른쪽이 +) / 길이 / 뿌리 위치
  const FINGERS = [
    { base: [-13, -14], angle: -1.15, len: 22 }, // 엄지
    { base: [-10.5, -40], angle: -0.16, len: 34 }, // 검지
    { base: [-3.5, -40], angle: -0.04, len: 38 }, // 중지
    { base: [3.5, -40], angle: 0.09, len: 34 }, // 약지
    { base: [10.5, -40], angle: 0.24, len: 26 }, // 소지
  ];

  let width = 0;
  let height = 0;
  let dpr = 1;
  let particles = [];
  let poseIndex = 0;
  let curl = POSES[0].curl.slice();
  let spread = 1;
  let rot = 0;
  let speed = 1;
  let holding = false;
  let elapsed = 0; // 속도가 반영된 시간(초)
  let poseTimer = 0;
  let last = 0;
  let running = false;
  let visible = true;

  const hudPose = document.getElementById('hudPose');
  const hudTime = document.getElementById('hudTime');
  const hudSpeed = document.getElementById('hudSpeed');
  const ticker = document.getElementById('heroTicker');

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = hero.clientWidth;
    height = hero.clientHeight;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const count = Math.round(Math.min(220, Math.max(80, width / 7)));
    particles = Array.from({ length: count }, () => newParticle(true));
  }

  function newParticle(scatter) {
    const maxR = Math.hypot(width, height) / 2;
    return {
      a: Math.random() * Math.PI * 2,
      r: scatter ? Math.random() * maxR : Math.random() * 30,
      v: 40 + Math.random() * 120,
      l: 5 + Math.random() * 12,
      hue: Math.floor(Math.random() * 360),
      w: 1 + Math.random() * 1.6,
    };
  }

  // ---- 손 그리기 (손목 기준 좌표계, 위쪽이 -y) ----
  function drawHandMask(t) {
    octx.clearRect(0, 0, W, H);
    octx.save();
    octx.translate(W / 2, H - 6);
    octx.rotate(rot + Math.sin(t * 0.7) * 0.12);
    octx.lineCap = 'round';
    octx.lineJoin = 'round';

    // 팔뚝 + 손바닥 (위에서 아래로 갈수록 밝게 -> 디더 무늬가 위쪽에 보라/핑크로 생김)
    const grad = octx.createLinearGradient(0, -40, 0, 30);
    grad.addColorStop(0, 'rgb(150,150,150)');
    grad.addColorStop(0.55, 'rgb(215,215,215)');
    grad.addColorStop(1, 'rgb(95,95,95)');
    octx.fillStyle = grad;
    octx.beginPath();
    octx.moveTo(-10, 30);
    octx.lineTo(-11, -4);
    octx.lineTo(-15, -14);
    octx.lineTo(-14, -40);
    octx.lineTo(14, -40);
    octx.lineTo(14, -16);
    octx.lineTo(11, -4);
    octx.lineTo(10, 30);
    octx.closePath();
    octx.fill();

    // 손가락
    FINGERS.forEach((f, i) => {
      const c = curl[i];
      const wave = Math.sin(t * 2.6 + i * 0.7) * 0.07;
      const ang = f.angle * spread + wave;
      const len = f.len * (1 - 0.72 * c);
      const segs = 3;
      const width = 6.4 + c * 2.2;
      let x = f.base[0];
      let y = f.base[1];
      for (let s = 0; s < segs; s++) {
        const segLen = len / segs;
        const nx = x + Math.sin(ang) * segLen;
        const ny = y - Math.cos(ang) * segLen;
        const v = s % 2 === 0 ? 225 : 170;
        octx.strokeStyle = `rgb(${v},${v},${v})`;
        octx.lineWidth = width - s * 0.5;
        octx.beginPath();
        octx.moveTo(x, y);
        octx.lineTo(nx, ny);
        octx.stroke();
        x = nx;
        y = ny;
      }
    });
    octx.restore();
  }

  function drawHand(t) {
    drawHandMask(t);
    const data = octx.getImageData(0, 0, W, H).data;
    const isOn = (x, y) => x >= 0 && y >= 0 && x < W && y < H && data[(y * W + x) * 4 + 3] > 60;

    const mobile = width < 900;
    const cs = (height * (mobile ? 0.78 : 0.86)) / H;
    const ox = mobile ? width / 2 - (W * cs) / 2 : width * 0.72 - (W * cs) / 2;
    const oy = height - H * cs + cs * 4 + Math.sin(t * 0.9) * cs * 1.2;
    const alpha = mobile ? 0.4 : 1;
    const g = Math.max(1, cs * 0.14);

    ctx.globalAlpha = alpha;
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        if (!isOn(x, y)) continue;
        const v = data[(y * W + x) * 4];
        const px = ox + x * cs;
        const py = oy + y * cs;
        const edge = !isOn(x - 1, y) || !isOn(x + 1, y) || !isOn(x, y - 1) || !isOn(x, y + 1);
        if (edge) {
          ctx.fillStyle = 'rgba(235,235,245,0.92)';
          ctx.beginPath();
          ctx.arc(px + cs / 2, py + cs / 2, cs * 0.28, 0, Math.PI * 2);
          ctx.fill();
          continue;
        }
        const thr = (BAYER[y & 3][x & 3] / 16) * 255;
        if (v < 100) {
          ctx.strokeStyle = 'rgba(210,210,220,0.75)';
          ctx.lineWidth = 1;
          ctx.strokeRect(px + g, py + g, cs - g * 2, cs - g * 2);
        } else {
          ctx.fillStyle = v > thr + 45 ? PURPLE : PINK;
          ctx.fillRect(px + g, py + g, cs - g * 2, cs - g * 2);
        }
      }
    }
    ctx.globalAlpha = 1;
  }

  // ---- 입자(별빛 화살) ----
  function drawParticles(dt) {
    const cx = width * (width < 900 ? 0.5 : 0.72);
    const cy = height * 0.55;
    const maxR = Math.hypot(width, height) * 0.6;
    particles.forEach((p, i) => {
      p.r += p.v * speed * dt * (0.6 + p.r / maxR);
      if (p.r > maxR) particles[i] = newParticle(false);
      const len = p.l * (1 + speed * 1.4) * (0.4 + p.r / maxR);
      const x1 = cx + Math.cos(p.a) * p.r;
      const y1 = cy + Math.sin(p.a) * p.r;
      const x0 = cx + Math.cos(p.a) * (p.r - len);
      const y0 = cy + Math.sin(p.a) * (p.r - len);
      const fade = Math.min(1, p.r / 80);
      ctx.strokeStyle = `hsla(${(p.hue + elapsed * 40) % 360},95%,68%,${0.85 * fade})`;
      ctx.lineWidth = p.w * (0.6 + speed * 0.08);
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.lineTo(x1, y1);
      ctx.stroke();
      ctx.fillStyle = `rgba(255,255,255,${0.9 * fade})`;
      ctx.fillRect(x1 - 1, y1 - 1, 2, 2);
    });
  }

  function updatePose(dt) {
    poseTimer += dt * Math.min(speed, 4);
    if (poseTimer > 2.6) {
      poseTimer = 0;
      poseIndex = (poseIndex + 1) % POSES.length;
      if (hudPose) hudPose.textContent = POSES[poseIndex].name;
    }
    const target = POSES[poseIndex];
    const k = 1 - Math.pow(0.0015, dt); // 프레임 속도와 무관한 부드러운 보간
    for (let i = 0; i < 5; i++) curl[i] += (target.curl[i] - curl[i]) * k;
    spread += (target.spread - spread) * k;
    rot += (target.rot - rot) * k;
  }

  function updateHud() {
    if (hudSpeed) hudSpeed.textContent = speed.toFixed(2) + 'x';
    if (hudTime) {
      const total = Math.floor(elapsed * 1000);
      const m = String(Math.floor(total / 60000)).padStart(2, '0');
      const s = String(Math.floor((total % 60000) / 1000)).padStart(2, '0');
      const ms = String(total % 1000).padStart(3, '0');
      hudTime.textContent = `${m}:${s}:${ms}`;
    }
    if (ticker) {
      const on = speed > 4;
      if (on && !ticker.classList.contains('on')) {
        // 나타날 때마다 처음(안녕하세요)부터 흐르도록 애니메이션을 다시 시작합니다.
        const span = ticker.firstElementChild;
        if (span) {
          span.style.animation = 'none';
          void span.offsetWidth;
          span.style.animation = '';
        }
      }
      ticker.classList.toggle('on', on);
    }
  }

  function frame(now) {
    if (!running) return;
    const dt = Math.min(0.05, (now - last) / 1000 || 0.016);
    last = now;
    const targetSpeed = holding ? 14 : 1;
    speed += (targetSpeed - speed) * (1 - Math.pow(holding ? 0.2 : 0.05, dt));
    elapsed += dt * speed;
    ctx.clearRect(0, 0, width, height);
    updatePose(dt);
    drawParticles(dt);
    drawHand(elapsed);
    updateHud();
    requestAnimationFrame(frame);
  }

  function start() {
    if (running || reduceMotion || !visible || document.hidden) return;
    running = true;
    last = performance.now();
    requestAnimationFrame(frame);
  }
  function stop() {
    running = false;
  }

  // 누르고 있으면 가속 (링크/버튼 위에서는 반응하지 않음)
  hero.addEventListener('pointerdown', (e) => {
    if (e.target.closest('a, button')) return;
    holding = true;
  });
  ['pointerup', 'pointercancel', 'pointerleave'].forEach((ev) =>
    window.addEventListener(ev, () => {
      holding = false;
    })
  );

  new IntersectionObserver((entries) => {
    visible = entries[0].isIntersecting;
    visible ? start() : stop();
  }).observe(hero);
  document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));
  window.addEventListener('resize', () => {
    resize();
    if (!running) renderStill();
  });

  function renderStill() {
    ctx.clearRect(0, 0, width, height);
    drawParticles(0);
    drawHand(0);
    updateHud();
  }

  resize();
  if (reduceMotion) renderStill();
  else start();
})();
