// 찾아오는 길 페이지: 상명대학교 천안캠퍼스 좌표 기준 현재 날씨를 Open-Meteo에서 불러와 표시
(function () {
  var LAT = 36.833;
  var LON = 127.179;
  var URL = 'https://api.open-meteo.com/v1/forecast'
    + '?latitude=' + LAT + '&longitude=' + LON
    + '&current=temperature_2m,relative_humidity_2m,apparent_temperature,wind_speed_10m,precipitation,weather_code'
    + '&timezone=Asia%2FSeoul';

  // WMO weather code -> [아이콘, 설명]
  function describe(code) {
    if (code === 0) return ['☀️', '맑음'];
    if (code <= 2) return ['🌤️', '구름 조금'];
    if (code === 3) return ['☁️', '흐림'];
    if (code === 45 || code === 48) return ['🌫️', '안개'];
    if (code >= 51 && code <= 57) return ['🌦️', '이슬비'];
    if ((code >= 61 && code <= 67) || (code >= 80 && code <= 82)) return ['🌧️', '비'];
    if ((code >= 71 && code <= 77) || code === 85 || code === 86) return ['❄️', '눈'];
    if (code >= 95) return ['⛈️', '뇌우'];
    return ['🌡️', '날씨 정보'];
  }

  function item(label, value) {
    return '<div class="weather-item"><span class="weather-item-label">' + label
      + '</span><span class="weather-item-value">' + value + '</span></div>';
  }

  var box = document.getElementById('weather');

  fetch(URL)
    .then(function (res) {
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return res.json();
    })
    .then(function (data) {
      var c = data.current;
      var d = describe(c.weather_code);
      box.innerHTML =
        '<div class="weather-main">'
        + '<span class="weather-icon" aria-hidden="true">' + d[0] + '</span>'
        + '<div><div class="weather-temp">' + Math.round(c.temperature_2m) + '°C</div>'
        + '<div class="weather-desc">' + d[1] + '</div></div></div>'
        + item('체감온도', Math.round(c.apparent_temperature) + '°C')
        + item('습도', c.relative_humidity_2m + '%')
        + item('풍속', c.wind_speed_10m + ' km/h')
        + item('강수량', c.precipitation + ' mm')
        + '<p class="weather-time">기준 시각: ' + c.time.replace('T', ' ') + ' (KST)</p>';
    })
    .catch(function () {
      box.innerHTML = '<p class="weather-error">날씨 정보를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.</p>';
    });
})();
