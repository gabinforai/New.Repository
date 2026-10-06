// 방문 예약 페이지: 캘린더(평일/공휴일 제외) + 입력 검증 + 최종 검토 팝업 + 접수
(function () {
  // Formspree 폼 주소 (받는 이메일은 Formspree 대시보드의 폼 설정에서 지정합니다)
  var FORMSPREE_URL = 'https://formspree.io/f/xgaovvkv';
  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  var MAX_MONTHS_AHEAD = 6;
  var DOW = ['일', '월', '화', '수', '목', '금', '토'];

  var $ = function (id) { return document.getElementById(id); };
  var form = $('reserveForm');
  var daysEl = $('calDays');
  var titleEl = $('calTitle');
  var dateBox = $('dateBox');
  var timeSelect = $('timeSelect');
  var nameInput = $('nameInput');
  var emailInput = $('emailInput');
  var purposeInput = $('purposeInput');
  var consentBox = $('consentBox');
  var submitBtn = $('submitBtn');
  var modal = $('confirmModal');

  var today = new Date();
  today.setHours(0, 0, 0, 0);
  var viewYear = today.getFullYear();
  var viewMonth = today.getMonth();
  var selected = '';            // 'YYYY-MM-DD'
  var holidays = {};            // { 'YYYY-MM-DD': '설날' }
  var loadedYears = {};         // { 2026: 'ok' | 'fail' | 'loading' }
  var touched = {};

  function pad(n) { return n < 10 ? '0' + n : '' + n; }
  function ymd(y, m, d) { return y + '-' + pad(m + 1) + '-' + pad(d); }

  // ---- 시간 드롭다운: 10:00 ~ 22:00, 30분 단위 (이미 예약된 시간은 "(완료)" 표시 + 선택 불가) ----
  var ALL_TIMES = [];
  for (var mins = 10 * 60; mins <= 22 * 60; mins += 30) {
    ALL_TIMES.push(pad(Math.floor(mins / 60)) + ':' + pad(mins % 60));
  }
  var booked = {};   // { 'YYYY-MM-DD': { '10:30': true } }

  function isBooked(date, time) { return !!(booked[date] && booked[date][time]); }
  function isDateFull(date) {
    return !!booked[date] && ALL_TIMES.every(function (t) { return booked[date][t]; });
  }

  function rebuildTimes() {
    var prev = timeSelect.value;
    timeSelect.innerHTML = '<option value="">시간을 선택하세요</option>';
    ALL_TIMES.forEach(function (t) {
      var opt = document.createElement('option');
      opt.value = t;
      var taken = selected && isBooked(selected, t);
      opt.textContent = taken ? t + ' (완료)' : t;
      opt.disabled = !!taken;
      timeSelect.appendChild(opt);
    });
    // 이전에 고른 시간이 아직 가능하면 유지, 아니면 초기화
    timeSelect.value = prev && !(selected && isBooked(selected, prev)) ? prev : '';
  }

  // 예약 현황(날짜·시간만)을 서버에서 받아옵니다. 실패해도 서버가 접수 시 한 번 더 검사합니다.
  function loadBooked() {
    return fetch(API_BASE_URL + '/reservations/booked')
      .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(function (list) {
        booked = {};
        list.forEach(function (s) { (booked[s.date] = booked[s.date] || {})[s.time] = true; });
        if (selected && isDateFull(selected)) { selected = ''; dateBox.value = ''; }
        rebuildTimes();
        render();
        update();
      })
      .catch(function () {});
  }

  rebuildTimes();

  // ---- 공휴일 불러오기 (Nager.Date, 연도별 1회) ----
  function loadHolidays(year) {
    if (loadedYears[year]) return;
    loadedYears[year] = 'loading';
    fetch('https://date.nager.at/api/v3/PublicHolidays/' + year + '/KR')
      .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(function (list) {
        list.forEach(function (h) { holidays[h.date] = h.localName; });
        loadedYears[year] = 'ok';
        if (selected && holidays[selected]) {
          selected = '';
          dateBox.value = '';
        }
        render();
        update();
      })
      .catch(function () {
        loadedYears[year] = 'fail';
        render();
      });
  }

  // ---- 캘린더 ----
  function isSelectable(y, m, d) {
    var date = new Date(y, m, d);
    var dow = date.getDay();
    if (dow === 0 || dow === 6) return false;
    if (date <= today) return false;           // 오늘 이전·당일은 제외(최소 하루 전 예약)
    if (holidays[ymd(y, m, d)]) return false;
    if (isDateFull(ymd(y, m, d))) return false;  // 모든 시간이 예약된 날
    var limit = new Date(today.getFullYear(), today.getMonth() + MAX_MONTHS_AHEAD + 1, 0);
    return date <= limit;
  }

  function render() {
    titleEl.textContent = viewYear + '년 ' + (viewMonth + 1) + '월';
    var first = new Date(viewYear, viewMonth, 1).getDay();
    var count = new Date(viewYear, viewMonth + 1, 0).getDate();
    var html = '';
    for (var i = 0; i < first; i++) html += '<span class="cal-empty"></span>';
    for (var d = 1; d <= count; d++) {
      var key = ymd(viewYear, viewMonth, d);
      var cls = 'cal-day';
      if (key === selected) cls += ' is-selected';
      if (viewYear === today.getFullYear() && viewMonth === today.getMonth() && d === today.getDate()) cls += ' is-today';
      var dow = new Date(viewYear, viewMonth, d).getDay();
      if (holidays[key] && dow !== 0 && dow !== 6) cls += ' is-holiday';
      var ok = isSelectable(viewYear, viewMonth, d);
      var title = holidays[key] ? ' title="' + holidays[key] + '"' : '';
      html += '<button type="button" class="' + cls + '" data-date="' + key + '"' + title + (ok ? '' : ' disabled') + '>' + d + '</button>';
    }
    daysEl.innerHTML = html;

    var minMonth = today.getFullYear() * 12 + today.getMonth();
    var cur = viewYear * 12 + viewMonth;
    $('calPrev').disabled = cur <= minMonth;
    $('calNext').disabled = cur >= minMonth + MAX_MONTHS_AHEAD;

    $('calHint').textContent = loadedYears[viewYear] === 'fail'
      ? '공휴일 정보를 불러오지 못해 평일만 표시합니다. 공휴일은 확인 후 별도로 안내드릴게요.'
      : '평일만 선택할 수 있어요. 주말·공휴일은 선택할 수 없습니다.';
  }

  function moveMonth(delta) {
    viewMonth += delta;
    if (viewMonth < 0) { viewMonth = 11; viewYear--; }
    if (viewMonth > 11) { viewMonth = 0; viewYear++; }
    loadHolidays(viewYear);
    render();
  }

  $('calPrev').addEventListener('click', function () { moveMonth(-1); });
  $('calNext').addEventListener('click', function () { moveMonth(1); });

  daysEl.addEventListener('click', function (e) {
    var btn = e.target.closest('.cal-day');
    if (!btn || btn.disabled) return;
    selected = btn.getAttribute('data-date');
    var p = selected.split('-');
    var dow = DOW[new Date(+p[0], +p[1] - 1, +p[2]).getDay()];
    dateBox.value = p[0] + '년 ' + (+p[1]) + '월 ' + (+p[2]) + '일 (' + dow + ')';
    rebuildTimes();
    render();
    update();
  });

  // ---- 검증 ----
  function emailState() {
    var v = emailInput.value.trim();
    if (!v) return 'empty';
    return EMAIL_RE.test(v) ? 'ok' : 'bad';
  }

  function showError(input, errorEl, bad) {
    input.classList.toggle('is-invalid', bad);
    errorEl.hidden = !bad;
  }

  function update() {
    var es = emailState();
    showError(nameInput, $('nameError'), touched.name && !nameInput.value.trim());
    showError(emailInput, $('emailError'), touched.email && es === 'bad');
    if (touched.email && es === 'empty') {
      showError(emailInput, $('emailError'), true);
      $('emailError').textContent = '이메일을 입력해주세요.';
    } else {
      $('emailError').textContent = '잘못 입력했습니다. 이메일 형식(example@email.com)으로 입력해주세요.';
    }
    showError(purposeInput, $('purposeError'), touched.purpose && !purposeInput.value.trim());
    $('purposeCount').textContent = purposeInput.value.length;

    var ready = selected && timeSelect.value &&
      nameInput.value.trim() && es === 'ok' && purposeInput.value.trim() && consentBox.checked;
    submitBtn.disabled = !ready;
  }

  [['name', nameInput], ['email', emailInput], ['purpose', purposeInput]].forEach(function (pair) {
    pair[1].addEventListener('input', function () { update(); });
    pair[1].addEventListener('blur', function () { touched[pair[0]] = true; update(); });
  });
  timeSelect.addEventListener('change', update);
  consentBox.addEventListener('change', update);

  // ---- 최종 검토 팝업 ----
  function values() {
    return {
      name: nameInput.value.trim(),
      email: emailInput.value.trim(),
      purpose: purposeInput.value.trim(),
      date: selected,
      time: timeSelect.value,
      consent: consentBox.checked,
    };
  }

  function openModal() {
    var v = values();
    $('cfDate').textContent = dateBox.value;
    $('cfTime').textContent = v.time;
    $('cfName').textContent = v.name;
    $('cfEmail').textContent = v.email;
    $('cfPurpose').textContent = v.purpose;
    $('submitError').hidden = true;
    modal.hidden = false;
    $('confirmBtn').focus();
  }

  function closeModal() { modal.hidden = true; submitBtn.focus(); }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (submitBtn.disabled) return;
    openModal();
  });
  $('cancelBtn').addEventListener('click', closeModal);
  modal.addEventListener('click', function (e) { if (e.target === modal) closeModal(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !modal.hidden) closeModal(); });

  $('confirmBtn').addEventListener('click', function () {
    var btn = $('confirmBtn');
    var errEl = $('submitError');
    btn.disabled = true;
    btn.textContent = '접수 중...';
    errEl.hidden = true;

    var v = values();

    function sendMail() {
      return fetch(FORMSPREE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({
          _subject: '[방문 예약] ' + v.name + ' - ' + v.date + ' ' + v.time,
          name: v.name,
          email: v.email, // Formspree가 이 값을 답장(Reply-To) 주소로 사용합니다
          date: v.date,
          time: v.time,
          purpose: v.purpose,
          consent: '동의함',
        }),
      }).then(function (res) { return res.ok; }, function () { return false; });
    }

    // 1) 백엔드에 먼저 저장: 같은 날짜·시간이 이미 있으면 여기서 거절(409)되어 메일도 보내지 않습니다.
    // 2) 저장에 성공한 경우에만 Formspree로 운영자 이메일 전달.
    fetch(API_BASE_URL + '/reservations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(v),
    })
      .then(function (res) {
        return res.json().catch(function () { return {}; }).then(function (body) {
          if (!res.ok) {
            var e = new Error(body.error || '예약 접수에 실패했습니다.');
            e.conflict = res.status === 409;
            throw e;
          }
          return sendMail();
        });
      })
      .then(function (mailOk) {
        $('doneMailWarn').hidden = mailOk;
        modal.hidden = true;
        form.hidden = true;
        $('reserveDone').hidden = false;
        window.scrollTo({ top: 0, behavior: 'smooth' });
      })
      .catch(function (err) {
        if (err.conflict) { loadBooked(); }   // 최신 예약 현황으로 갱신(해당 시간은 (완료)로 바뀜)
        errEl.textContent = err instanceof TypeError
          ? '서버에 연결하지 못했습니다. 잠시 후 다시 시도해주세요.'
          : err.message;
        errEl.hidden = false;
      })
      .then(function () {
        btn.disabled = false;
        btn.textContent = '예약하기';
      });
  });

  loadHolidays(viewYear);
  loadBooked();
  render();
  update();
})();
