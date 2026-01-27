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

  // 파일 선택 버튼
  document.getElementById('selectBtn').addEventListener('click', () => {
    document.getElementById('fileInput').click();
  });

  // 파일 선택
  document.getElementById('fileInput').addEventListener('change', handleFileSelect);

  // 드래그 앤 드롭
  const uploadArea = document.getElementById('uploadArea');

  uploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadArea.classList.add('drag-over');
  });

  uploadArea.addEventListener('dragleave', (e) => {
    e.preventDefault();
    uploadArea.classList.remove('drag-over');
  });

  uploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadArea.classList.remove('drag-over');
    handleFiles(e.dataTransfer.files);
  });

  // 클릭으로도 업로드 영역 활성화
  uploadArea.addEventListener('click', (e) => {
    if (e.target === uploadArea || e.target.classList.contains('upload-placeholder')) {
      document.getElementById('fileInput').click();
    }
  });

  // 선택 초기화 버튼
  document.getElementById('clearFilesBtn').addEventListener('click', clearSelectedFiles);

  // 업로드 버튼
  document.getElementById('uploadBtn').addEventListener('click', uploadFiles);

  // 새로고침 버튼
  document.getElementById('refreshBtn').addEventListener('click', loadCertificates);

  // 전체 삭제 버튼
  document.getElementById('deleteAllBtn').addEventListener('click', deleteAllCertificates);

  // 검색
  document.getElementById('searchInput').addEventListener('input', filterCertificates);

  // 수료자 리스트 관리
  document.getElementById('downloadStudentsBtn').addEventListener('click', downloadStudents);
  document.getElementById('uploadStudentsBtn').addEventListener('click', () => {
    document.getElementById('studentsFileInput').click();
  });
  document.getElementById('studentsFileInput').addEventListener('change', uploadStudents);
}

// 파일 선택 처리
function handleFileSelect(e) {
  handleFiles(e.target.files);
}

// 파일 처리
let selectedFiles = [];

function handleFiles(files) {
  const pdfFiles = Array.from(files).filter(file => file.name.endsWith('.pdf'));

  if (pdfFiles.length === 0) {
    alert('PDF 파일만 선택해주세요.');
    return;
  }

  if (pdfFiles.length > 150) {
    alert('최대 150개 파일까지 업로드할 수 있습니다.');
    selectedFiles = pdfFiles.slice(0, 150);
  } else {
    selectedFiles = pdfFiles;
  }

  // 선택된 파일 표시
  document.getElementById('selectedFiles').style.display = 'block';
  document.getElementById('fileCount').textContent = selectedFiles.length;

  const fileListDiv = document.getElementById('fileList');
  fileListDiv.innerHTML = selectedFiles.map(file => `
    <div class="file-item">
      <span>📄 ${file.name}</span>
      <span class="file-size">${formatFileSize(file.size)}</span>
    </div>
  `).join('');
}

// 선택 초기화
function clearSelectedFiles() {
  selectedFiles = [];
  document.getElementById('selectedFiles').style.display = 'none';
  document.getElementById('fileInput').value = '';
  document.getElementById('fileList').innerHTML = '';
}

// 파일 업로드
async function uploadFiles() {
  if (selectedFiles.length === 0) {
    alert('업로드할 파일을 선택해주세요.');
    return;
  }

  const formData = new FormData();
  selectedFiles.forEach(file => {
    formData.append('certificates', file);
  });

  const uploadBtn = document.getElementById('uploadBtn');
  const progressDiv = document.getElementById('uploadProgress');
  const progressFill = document.getElementById('progressFill');
  const progressText = document.getElementById('progressText');

  uploadBtn.disabled = true;
  progressDiv.style.display = 'block';
  progressFill.style.width = '0%';

  try {
    // 진행률 시뮬레이션
    let progress = 0;
    const progressInterval = setInterval(() => {
      if (progress < 90) {
        progress += 10;
        progressFill.style.width = progress + '%';
        progressText.textContent = progress + '%';
      }
    }, 200);

    const response = await fetch('/api/admin/upload-certificates', {
      method: 'POST',
      body: formData
    });

    clearInterval(progressInterval);
    progressFill.style.width = '100%';
    progressText.textContent = '100%';

    const result = await response.json();

    if (result.success) {
      alert(result.message);
      clearSelectedFiles();
      loadCertificates();
    } else {
      alert('업로드 실패: ' + result.message);
    }
  } catch (error) {
    console.error('업로드 오류:', error);
    alert('업로드 중 오류가 발생했습니다.');
  } finally {
    uploadBtn.disabled = false;
    setTimeout(() => {
      progressDiv.style.display = 'none';
    }, 1000);
  }
}

// 수료증 목록 로드
async function loadCertificates() {
  try {
    const response = await fetch('/api/admin/certificates');
    const result = await response.json();

    if (result.success) {
      displayCertificates(result.files);
      document.getElementById('totalCount').textContent = result.files.length;
    }
  } catch (error) {
    console.error('목록 로드 오류:', error);
    alert('목록을 불러올 수 없습니다.');
  }
}

// 수료증 목록 표시
let allCertificates = [];

function displayCertificates(files) {
  allCertificates = files;
  const listDiv = document.getElementById('certificateList');

  if (files.length === 0) {
    listDiv.innerHTML = '<p class="no-data">업로드된 수료증이 없습니다.</p>';
    return;
  }

  listDiv.innerHTML = files.map(file => `
    <div class="certificate-item">
      <div class="certificate-info">
        <span class="certificate-name">✓ ${escapeHtml(file.filename)}</span>
        <span class="certificate-size">${formatFileSize(file.size)}</span>
      </div>
      <button class="delete-btn" onclick="deleteCertificate('${escapeHtml(file.filename)}')">삭제</button>
    </div>
  `).join('');
}

// HTML 이스케이프
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// 수료증 삭제
async function deleteCertificate(filename) {
  if (!confirm(`"${filename}" 파일을 삭제하시겠습니까?`)) {
    return;
  }

  try {
    const response = await fetch(`/api/admin/certificate/${encodeURIComponent(filename)}`, {
      method: 'DELETE'
    });

    const result = await response.json();

    if (result.success) {
      alert('삭제되었습니다.');
      loadCertificates();
    } else {
      alert('삭제 실패: ' + result.message);
    }
  } catch (error) {
    console.error('삭제 오류:', error);
    alert('삭제 중 오류가 발생했습니다.');
  }
}

// 전체 삭제
async function deleteAllCertificates() {
  if (!confirm('모든 수료증 파일을 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.')) {
    return;
  }

  try {
    const response = await fetch('/api/admin/certificates/all', {
      method: 'DELETE'
    });

    const result = await response.json();

    if (result.success) {
      alert(result.message);
      loadCertificates();
    } else {
      alert('삭제 실패: ' + result.message);
    }
  } catch (error) {
    console.error('전체 삭제 오류:', error);
    alert('전체 삭제 중 오류가 발생했습니다.');
  }
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
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}
