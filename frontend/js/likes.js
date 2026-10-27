// "좋아하는 것" 칩을 누르면 나타나는 재미 요소 모음
//  초콜릿 -> 초콜릿 비      부리부리대마왕 -> 사진 팝업      강아지 -> 월월
//  고양이 -> 야옹           다람쥐 -> 도토리 까먹기          참새 -> 삐약삐약
//  노래 듣기 -> 애플뮤직 팔로우 + 요즘 빠진 노래(Gracie) 재생
// 소리/팝업 도구는 fun.js 가 공유하는 window.funKit 을 사용합니다.
(function () {
  const grid = document.getElementById('likesGrid');
  const kit = window.funKit;
  if (!grid || !kit) return;
  const { voice, audio, openModal, el, reduceMotion } = kit;

  const APPLE_ID = '@lee89851110';
  const APPLE_PROFILE = 'https://music.apple.com/profile/lee89851110';
  // 요즘 빠진 노래: Naomi Scott - Gracie (앨범 F.I.G)
  const SONG = {
    title: 'Gracie',
    artist: 'Naomi Scott',
    album: 'F.I.G',
    page: 'https://music.apple.com/us/album/gracie/1863525485?i=1863525497',
    embed: 'https://embed.music.apple.com/us/album/gracie/1863525485?i=1863525497',
    cover:
      'https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/9d/be/27/9dbe2762-0b17-07d3-b048-01a95bbb227d/8721416481741.png/400x400bb.jpg',
  };

  // ---------------------------------------------------------------- 소리
  function playBark() {
    // 월! 월!
    [0, 0.34].forEach((t) => {
      voice([[0, 330], [0.05, 520], [0.18, 250]], { filter: 900, gain: 0.22, start: t });
      voice([[0, 160], [0.18, 120]], { type: 'square', filter: 500, gain: 0.08, start: t });
    });
  }
  function playMeow() {
    // 야~옹
    voice([[0, 520], [0.16, 860], [0.5, 760], [0.85, 430]], { filter: 1900, gain: 0.17, vibrato: 6 });
    voice([[0, 1040], [0.16, 1720], [0.5, 1520], [0.85, 860]], { type: 'sine', filter: 3000, gain: 0.04 });
  }
  function playChirp() {
    // 삐약 삐약 삐약
    [0, 0.2, 0.55, 0.75, 1.1].forEach((t) => {
      voice([[0, 2600], [0.05, 3700], [0.11, 2900]], { type: 'sine', filter: 3300, gain: 0.13, start: t });
    });
  }
  function playNibble() {
    // 오도독 오도독
    for (let i = 0; i < 8; i++) {
      voice([[0, 1100 - (i % 2) * 300], [0.04, 380]], { type: 'square', filter: 1300, gain: 0.07, start: i * 0.16 });
    }
  }
  function playSweet() {
    // 달콤한 차임
    [784, 988, 1175, 1568].forEach((f, i) => {
      voice([[0, f], [0.5, f]], { type: 'sine', filter: 2500, gain: 0.1, start: i * 0.12 });
    });
  }

  // ---------------------------------------------------------------- 공통: 동물 팝업
  function animalModal({ tag, icon, say, title, note, sound, actorClass, extra }) {
    const body = el(`
      <div class="fun-center">
        <div class="fun-stage">
          <div class="fun-actor ${actorClass}" id="actor">${icon}</div>
          ${extra || ''}
        </div>
        <div class="fun-bubble" id="bubble">${say}</div>
        <p class="fun-big">${title}</p>
        <p class="fun-note">${note}</p>
        <button class="btn btn-outline" type="button" id="again">🔊 다시 보기</button>
      </div>`);
    const actor = body.querySelector('#actor');
    const bubble = body.querySelector('#bubble');
    function go() {
      sound();
      actor.classList.remove('go');
      bubble.classList.remove('pop');
      void actor.offsetWidth;
      actor.classList.add('go');
      bubble.classList.add('pop');
    }
    body.querySelector('#again').addEventListener('click', go);
    openModal(tag, body);
    go();
  }

  function dog() {
    animalModal({
      tag: 'DOG', icon: '🐶', say: '월월! 월월!', title: '강아지',
      note: '꼬리를 흔들며 신나게 짖어요', sound: playBark, actorClass: 'bark',
    });
  }
  function cat() {
    animalModal({
      tag: 'CAT', icon: '🐱', say: '야옹~', title: '고양이',
      note: '도도하게 한 번, 야옹~', sound: playMeow, actorClass: 'meow',
    });
  }
  function sparrow() {
    animalModal({
      tag: 'BIRD', icon: '🐦', say: '삐약삐약!', title: '참새',
      note: '짹짹, 아니 삐약삐약!', sound: playChirp, actorClass: 'chirp',
    });
  }

  function squirrel() {
    const body = el(`
      <div class="fun-center">
        <div class="fun-stage fun-squirrel">
          <div class="fun-actor" id="actor">🐿️</div>
          <div class="fun-acorn" id="acorn">🌰</div>
          <span class="crumb c1">·</span><span class="crumb c2">·</span><span class="crumb c3">·</span>
        </div>
        <div class="fun-bubble" id="bubble">냠냠 오도독!</div>
        <p class="fun-big">다람쥐</p>
        <p class="fun-note" id="note">도토리를 야금야금 까먹는 중…</p>
        <button class="btn btn-outline" type="button" id="again">🔊 다시 보기</button>
      </div>`);
    const stage = body.querySelector('.fun-squirrel');
    const bubble = body.querySelector('#bubble');
    const note = body.querySelector('#note');
    function go() {
      playNibble();
      stage.classList.remove('eating');
      bubble.classList.remove('pop');
      note.textContent = '도토리를 야금야금 까먹는 중…';
      void stage.offsetWidth;
      stage.classList.add('eating');
      bubble.classList.add('pop');
      setTimeout(() => { note.textContent = '다 먹었다! 맛있어요 😋'; }, 1400);
    }
    body.querySelector('#again').addEventListener('click', go);
    openModal('SQUIRREL', body);
    go();
  }

  // ---------------------------------------------------------------- 초콜릿
  let rainRunning = false;
  function chocolate() {
    playSweet();
    const body = el(`
      <div class="fun-center">
        <div class="fun-actor float" style="font-size:5.5rem">🍫</div>
        <p class="fun-big">달콤한 초콜릿!</p>
        <p class="fun-note">한 조각 먹으면 기분이 좋아져요 🤎</p>
      </div>`);
    openModal('CHOCOLATE', body);
    if (reduceMotion || rainRunning) return;
    rainRunning = true;
    const layer = document.createElement('div');
    layer.className = 'fun-rain';
    const items = ['🍫', '🍫', '🍬', '🍪', '🤎', '🍩'];
    for (let i = 0; i < 40; i++) {
      const s = document.createElement('span');
      s.textContent = items[Math.floor(Math.random() * items.length)];
      s.style.left = Math.random() * 100 + 'vw';
      s.style.fontSize = 22 + Math.random() * 28 + 'px';
      s.style.animationDuration = 2.4 + Math.random() * 2.4 + 's';
      s.style.animationDelay = Math.random() * 1.6 + 's';
      layer.appendChild(s);
    }
    document.body.appendChild(layer);
    setTimeout(() => { layer.remove(); rainRunning = false; }, 6200);
  }

  // ---------------------------------------------------------------- 부리부리대마왕
  function buriburi() {
    const body = el(`
      <div class="fun-center">
        <div class="fun-photo">
          <img src="images/buriburi.jpg" alt="부리부리대마왕" onerror="this.parentNode.classList.add('empty')">
          <div class="fun-photo-fallback">🐽</div>
        </div>
        <p class="fun-big">부리부리대마왕</p>
        <p class="fun-note">만화 〈짱구는 못말려〉에 나오는 그 돼지 무사!</p>
      </div>`);
    openModal('BURIBURI', body);
  }

  // ---------------------------------------------------------------- 노래 듣기
  function music() {
    const body = el(`
      <div class="fun-center">
        <p class="fun-big">🎧 요즘 빠진 노래</p>
        <div class="fun-song">
          <img src="${SONG.cover}" alt="${SONG.album} 앨범 커버" loading="lazy">
          <div>
            <b>${SONG.title}</b>
            <span>${SONG.artist}</span>
            <small>${SONG.album}</small>
          </div>
        </div>
        <iframe class="fun-player" title="${SONG.artist} - ${SONG.title} (Apple Music)"
          allow="autoplay *; encrypted-media *; fullscreen *; clipboard-write"
          sandbox="allow-forms allow-popups allow-same-origin allow-scripts allow-storage-access-by-user-activation allow-top-navigation-by-user-activation"
          loading="lazy" src="${SONG.embed}"></iframe>
        <p class="fun-note"><a href="${SONG.page}" target="_blank" rel="noopener">Apple Music에서 전체 듣기 ↗</a></p>

        <div class="fun-follow">
          <p class="fun-follow-label">내 Apple Music 팔로우하기</p>
          <p class="fun-follow-id" id="appleId">${APPLE_ID}</p>
          <div class="fun-follow-btns">
            <a class="btn btn-primary" href="${APPLE_PROFILE}" target="_blank" rel="noopener">Apple Music에서 팔로우</a>
            <button class="btn btn-outline" type="button" id="copyId">아이디 복사</button>
          </div>
        </div>
      </div>`);
    const copyBtn = body.querySelector('#copyId');
    copyBtn.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(APPLE_ID);
        copyBtn.textContent = '복사됨 ✓';
      } catch (err) {
        copyBtn.textContent = APPLE_ID;
      }
      setTimeout(() => { copyBtn.textContent = '아이디 복사'; }, 1800);
    });
    openModal('NOW PLAYING', body);
  }

  const ACTIONS = {
    '초콜릿': chocolate,
    '부리부리대마왕': buriburi,
    '강아지': dog,
    '고양이': cat,
    '다람쥐': squirrel,
    '참새': sparrow,
    '노래 듣기': music,
  };

  function handle(chip) {
    const act = ACTIONS[(chip.dataset.label || '').trim()];
    if (act) act();
  }
  grid.addEventListener('click', (e) => {
    const chip = e.target.closest('.like-chip');
    if (chip) handle(chip);
  });
  grid.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    const chip = e.target.closest('.like-chip');
    if (chip) {
      e.preventDefault();
      handle(chip);
    }
  });
})();
