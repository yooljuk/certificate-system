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

  // 수료자 리스트 관리 (Excel 업로드)
  document.getElementById('uploadStudentsBtn').addEventListener('click', () => {
    document.getElementById('studentsFileInput').click();
  });
  document.getElementById('studentsFileInput').addEventListener('change', uploadStudentsExcel);
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

// 수료자 리스트 Excel 업로드
async function uploadStudentsExcel(e) {
  const file = e.target.files[0];
  if (!file) return;

  try {
    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data, { type: 'array' });

    // 첫 번째 시트 가져오기
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];

    // 시트를 JSON으로 변환 (첫 행은 헤더로 처리)
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });

    if (rows.length < 2) {
      alert('Excel 파일에 데이터가 없습니다. (헤더 제외 최소 1행 필요)');
      return;
    }

    // 첫 행(헤더) 제외하고 데이터 변환
    const students = [];
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      const name = row[0];  // A열: 이름
      let birthDate = row[1];  // B열: 생년월일

      // 빈 행 건너뛰기
      if (!name && !birthDate) continue;

      if (!name || !birthDate) {
        alert(`${i + 1}행에 이름 또는 생년월일이 누락되었습니다.`);
        return;
      }

      // 생년월일 형식 변환 (Excel 날짜 숫자 또는 문자열 처리)
      if (typeof birthDate === 'number') {
        // Excel 날짜 숫자를 문자열로 변환
        const date = XLSX.SSF.parse_date_code(birthDate);
        birthDate = `${date.y}-${String(date.m).padStart(2, '0')}-${String(date.d).padStart(2, '0')}`;
      } else {
        birthDate = String(birthDate).trim();
      }

      students.push({
        name: String(name).trim(),
        birthDate: birthDate
      });
    }

    if (students.length === 0) {
      alert('유효한 수료자 데이터가 없습니다.');
      return;
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
    alert('Excel 파일을 읽는 중 오류가 발생했습니다.');
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
