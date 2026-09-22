// 백엔드와 통신하는 함수 모음 (API 통신 계층)
// 나중에 API 주소나 요청 방식(인증 헤더 추가 등)이 바뀌어도 이 파일만 수정하면 됩니다.

async function fetchJson(path) {
  const res = await fetch(`${API_BASE_URL}${path}`);
  if (!res.ok) {
    throw new Error(`API 요청 실패: ${path} (status ${res.status})`);
  }
  return res.json();
}

const api = {
  getPortfolio: () => fetchJson('/portfolio'),
  getProfile: () => fetchJson('/profile'),
  getEducation: () => fetchJson('/education'),
  getAchievements: () => fetchJson('/achievements'),
  getLikes: () => fetchJson('/likes'),
  getContact: () => fetchJson('/contact'),
};
