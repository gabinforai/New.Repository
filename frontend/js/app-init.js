// 페이지 진입 시 백엔드에서 데이터를 불러와 화면을 채우고,
// 그 다음 스크롤 애니메이션 등 인터랙션을 초기화합니다.
// (인터랙션 초기화를 데이터 렌더링 뒤로 미루는 이유: 동적으로 추가된 카드들도
//  스크롤 애니메이션(.reveal) 대상에 포함시키기 위해서입니다.)

async function initPortfolio() {
  try {
    const data = await api.getPortfolio();
    renderHero(data.profile);
    renderBasicInfo(data.profile.basicInfo);
    renderEducation(data.education);
    renderAchievements(data.achievements);
    renderProjects(data.projects || []);
    renderLikes(data.likes);
    renderContact(data.contact);
  } catch (err) {
    console.error(err);
    const message = '정보를 불러오지 못했습니다. 백엔드 서버가 실행 중인지 확인해주세요.';
    renderError('infoGrid', message);
    renderError('timeline', message);
    renderError('achieveGrid', message);
    renderError('projectsGrid', message);
    renderError('likesGrid', message);
    renderError('contactLinks', message);
  } finally {
    initInteractions();
  }
}

document.addEventListener('DOMContentLoaded', initPortfolio);
