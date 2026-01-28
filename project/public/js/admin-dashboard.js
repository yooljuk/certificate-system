// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', () => {
  checkAuth();
  loadCertificates();
  loadStudentsInfo();
  initializeEventListeners();
});

// 인증 확인
function checkAuth() {
  const isAuthenticated = sessionStorage.getItem('adminAuth');
  if (!isAuthenticated) {
    window.location.href = 'admin-login.html';
  }
}

// 이벤트 리스너 초기화
function initializeEventListeners() {
  // 로그아웃
  document.getElementById('logoutBtn').addEventListener('click', () => {
    sessionStorage.removeItem('adminAuth');
    window.location.href = 'admin-login.html';
  });

  // 새로고침 버튼
  document.getElementById('refreshBtn').addEventListener('click', loadCertificates);

  // 검색
  document.getElementById('searchInput').addEventListener('input', filterCertificates);

  // 수료자 리스트 관리
  document.getElementById('downloadStudentsBtn').addEventListener('click', downloadStudents);
  document.getElementById('uploadStudentsBtn').addEventListener('click', () => {
    document.getElementById('studentsFileInput').click();
  });
  document.getElementById('studentsFileInput').addEventListener('change', uploadStudents);
}

// 수료증 목록 로드 (Google Drive)
async function loadCertificates() {
  const listDiv = document.getElementById('certificateList');
  listDiv.innerHTML = '<p class="no-data">파일 목록을 불러오는 중...</p>';

  try {
    const response = await fetch('/api/admin/certificates');
    const result = await response.json();

    if (result.success) {
      displayCertificates(result.files);
      document.getElementById('totalCount').textContent = result.files.length;
    } else {
      listDiv.innerHTML = '<p class="no-data">파일 목록을 불러올 수 없습니다.</p>';
    }
  } catch (error) {
    console.error('목록 로드 오류:', error);
    listDiv.innerHTML = '<p class="no-data">파일 목록을 불러올 수 없습니다.</p>';
  }
}

// 수료증 목록 표시
let allCertificates = [];

function displayCertificates(files) {
  allCertificates = files;
  const listDiv = document.getElementById('certificateList');

  if (files.length === 0) {
    listDiv.innerHTML = '<p class="no-data">Google Drive에 업로드된 수료증이 없습니다.</p>';
    return;
  }

  listDiv.innerHTML = files.map(file => `
    <div class="certificate-item">
      <div class="certificate-info">
        <span class="certificate-name">📄 ${escapeHtml(file.filename)}</span>
        <span class="certificate-size">${formatFileSize(file.size)}</span>
      </div>
    </div>
  `).join('');
}

// HTML 이스케이프
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// 검색 필터
function filterCertificates() {
  const searchTerm = document.getElementById('searchInput').value.toLowerCase();
  const filtered = allCertificates.filter(file =>
    file.filename.toLowerCase().includes(searchTerm)
  );
  displayCertificates(filtered);
  document.getElementById('totalCount').textContent = filtered.length;
}

// 수료자 정보 로드
async function loadStudentsInfo() {
  try {
    const response = await fetch('/api/admin/students');
    const result = await response.json();

    if (result.success) {
      document.getElementById('studentsCount').textContent = result.students.length;
    }
  } catch (error) {
    console.error('수료자 정보 로드 오류:', error);
  }
}

// 수료자 리스트 다운로드
async function downloadStudents() {
  try {
    const response = await fetch('/api/admin/students');
    const result = await response.json();

    if (result.success) {
      const blob = new Blob([JSON.stringify(result.students, null, 2)],
        { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'students.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    }
  } catch (error) {
    console.error('다운로드 오류:', error);
    alert('다운로드 중 오류가 발생했습니다.');
  }
}

// 수료자 리스트 업로드
async function uploadStudents(e) {
  const file = e.target.files[0];
  if (!file) return;

  try {
    const text = await file.text();
    let students;

    try {
      students = JSON.parse(text);
    } catch (parseError) {
      alert('JSON 파일 형식이 올바르지 않습니다.');
      return;
    }

    if (!Array.isArray(students)) {
      alert('수료자 목록은 배열 형태여야 합니다.');
      return;
    }

    // 데이터 검증
    for (let i = 0; i < students.length; i++) {
      if (!students[i].name || !students[i].birthDate) {
        alert(`${i + 1}번째 항목에 name 또는 birthDate가 누락되었습니다.`);
        return;
      }
    }

    const response = await fetch('/api/admin/students', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ students })
    });

    const result = await response.json();

    if (result.success) {
      alert(result.message);
      loadStudentsInfo();
    } else {
      alert('업로드 실패: ' + result.message);
    }
  } catch (error) {
    console.error('업로드 오류:', error);
    alert('파일을 읽는 중 오류가 발생했습니다.');
  }

  // 파일 입력 초기화
  e.target.value = '';
}

// 파일 크기 포맷
function formatFileSize(bytes) {
  if (!bytes || bytes === 0) return '-';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}
