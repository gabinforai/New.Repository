const form = document.getElementById('projectForm');
const errorEl = document.getElementById('formError');
const titleHeading = document.getElementById('editorTitle');
const submitBtn = document.getElementById('formSubmit');

const FIELD_LABELS = {
  title: '제목',
  role: '내가 한 역할',
  description: '설명',
  date: '날짜',
  participants: '참여인원 수',
};

const params = new URLSearchParams(window.location.search);
const editId = params.get('id');

function fillForm(project) {
  form.title.value = project.title || '';
  form.role.value = project.role || '';
  form.description.value = project.description || '';
  form.date.value = project.date || '';
  form.participants.value = project.participants ?? '';
  form.notes.value = project.notes || '';
  const statusInput = form.querySelector(`input[name="status"][value="${project.status}"]`);
  if (statusInput) statusInput.checked = true;
}

// 참고사항(notes)을 제외한 모든 칸은 "공개" 선택 시에만 필수 (백엔드 검증 규칙과 동일)
function validateClientSide(data) {
  if (data.status !== 'published') return [];
  const errors = [];
  Object.keys(FIELD_LABELS).forEach((field) => {
    if (!String(data[field] || '').trim()) {
      errors.push(`${FIELD_LABELS[field]} 항목을 입력해야 공개할 수 있습니다.`);
    }
  });
  return errors;
}

function collectFormData() {
  return {
    title: form.title.value.trim(),
    role: form.role.value.trim(),
    description: form.description.value.trim(),
    date: form.date.value.trim(),
    participants: form.participants.value.trim(),
    notes: form.notes.value.trim(),
    status: form.status.value,
  };
}

function showErrors(messages) {
  errorEl.innerHTML = messages.join('<br>');
  errorEl.hidden = false;
}

async function init() {
  const loggedIn = await requireAdminSession();
  if (!loggedIn) return;

  if (editId) {
    titleHeading.textContent = '프로젝트 수정';
    try {
      const project = await adminApi.getProject(editId);
      fillForm(project);
    } catch (err) {
      showErrors(['프로젝트를 불러오지 못했습니다: ' + err.message]);
    }
  }
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  errorEl.hidden = true;

  const data = collectFormData();
  const clientErrors = validateClientSide(data);
  if (clientErrors.length) {
    showErrors(clientErrors);
    return;
  }

  submitBtn.disabled = true;
  submitBtn.textContent = '저장 중...';

  try {
    if (editId) {
      await adminApi.updateProject(editId, data);
    } else {
      await adminApi.createProject(data);
    }
    window.location.href = 'dashboard.html';
  } catch (err) {
    const messages = err.details && err.details.length ? err.details : [err.message];
    showErrors(messages);
    submitBtn.disabled = false;
    submitBtn.textContent = '저장';
  }
});

init();
