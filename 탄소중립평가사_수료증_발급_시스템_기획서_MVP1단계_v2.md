# 2026 탄소중립평가사 교육 수료증 자동 발급 시스템 (MVP 1단계 v2)

## 📋 프로젝트 개요

### 프로젝트 목적
관리자가 미리 제작한 수료증 PDF를 시스템에 업로드하고, 수료자가 자신의 정보를 입력하면 해당하는 수료증을 자동으로 찾아 다운로드할 수 있는 시스템 구축

### 핵심 변경 사항
- ❌ 수료증 자동 생성 (제거)
- ✅ 관리자가 직접 제작한 PDF 업로드
- ✅ 파일명 기반 자동 매칭
- ✅ 대량 업로드 지원 (120개 이상)

### MVP 1단계 범위
- ✅ 간단한 관리자 대시보드 (PDF 업로드 전용)
- ✅ 수료자 정보 기반 검증
- ✅ 파일명 기반 수료증 매칭
- ✅ PDF 다운로드
- ❌ 다운로드 이력 관리 (2단계 이후)
- ❌ 복잡한 관리자 기능 (2단계 이후)

---

## 🤖 시스템 구조

### 에이전트 구조

#### 에이전트 1: 수료자 검증
**역할**: 사용자 입력 정보를 수료자 리스트와 비교

**처리 프로세스**:
1. 사용자로부터 성명, 생년월일 입력 수신
2. 서버의 `students.json` 파일에서 해당 정보 검색
3. 수료자 여부 판단
   - **수료자 확인**: 에이전트 2 호출
   - **수료자 미확인**: 에러 메시지 표시
     - "죄송합니다. 수료자 목록에 없습니다. 정보를 다시 입력해주세요."

#### 에이전트 2: 수료증 매칭 및 다운로드
**역할**: 검증된 수료자의 수료증 파일을 찾아 다운로드 제공

**처리 프로세스**:
1. 에이전트 1로부터 수료자 정보 수신 (성명, 생년월일)
2. 파일명 형식으로 변환: `성명_생년월일.pdf`
   - 예시: `홍길동_1990-01-01.pdf`
3. `certificates/` 폴더에서 해당 파일명 검색
4. 파일 존재 여부 확인
   - **파일 존재**: PDF 다운로드 제공
   - **파일 없음**: 에러 메시지 표시
     - "수료증 파일을 찾을 수 없습니다. 관리자에게 문의해주세요."

**파일명 규칙**:
- 형식: `성명_생년월일.pdf`
- 예시:
  - `홍길동_1990-01-01.pdf`
  - `김철수_1985-05-15.pdf`
  - `이영희_1992-03-20.pdf`

---

## 🖥️ 페이지 구성

### 1. 사용자 메인 페이지

#### 화면 구성
```
┌─────────────────────────────────────┐
│                                     │
│   2026 탄소중립평가사 수료증 발급   │
│                                     │
├─────────────────────────────────────┤
│                                     │
│   성명                              │
│   [___________________]             │
│                                     │
│   생년월일                          │
│   [____년 __월 __일]                │
│                                     │
│   [    수료증 다운로드    ]         │
│                                     │
├─────────────────────────────────────┤
│   [관리자 로그인]                   │
└─────────────────────────────────────┘
```

#### 주요 기능
- 성명, 생년월일 입력
- 수료증 다운로드 버튼
- 관리자 로그인 버튼 (하단)

### 2. 관리자 로그인 페이지

#### 화면 구성
```
┌─────────────────────────────────────┐
│        관리자 로그인                │
├─────────────────────────────────────┤
│                                     │
│   비밀번호                          │
│   [___________________]             │
│                                     │
│   [   로그인   ]                    │
│                                     │
│   [메인으로 돌아가기]               │
└─────────────────────────────────────┘
```

#### 기능
- 간단한 비밀번호 인증
- 로그인 성공 시 관리자 대시보드로 이동

### 3. 관리자 대시보드 (간소화)

#### 화면 구성
```
┌─────────────────────────────────────────────────────┐
│   관리자 대시보드                    [로그아웃]     │
├─────────────────────────────────────────────────────┤
│                                                     │
│   📁 수료증 파일 업로드                             │
│   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━   │
│                                                     │
│   [파일 선택] (여러 파일 선택 가능)                 │
│                                                     │
│   또는                                              │
│                                                     │
│   ┌─────────────────────────────────┐              │
│   │  여기에 파일을 드래그 앤 드롭   │              │
│   │  (최대 150개 파일 동시 업로드)  │              │
│   └─────────────────────────────────┘              │
│                                                     │
│   [모두 업로드]                                     │
│                                                     │
├─────────────────────────────────────────────────────┤
│   📋 업로드된 수료증 목록 (120개)                   │
│   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━   │
│                                                     │
│   [검색: ___________]   [전체 삭제]                │
│                                                     │
│   ┌───────────────────────────────────────────┐   │
│   │ ✓ 홍길동_1990-01-01.pdf       [삭제]      │   │
│   │ ✓ 김철수_1985-05-15.pdf       [삭제]      │   │
│   │ ✓ 이영희_1992-03-20.pdf       [삭제]      │   │
│   │ ✓ 박민수_1988-07-10.pdf       [삭제]      │   │
│   │   ...                                     │   │
│   │   (스크롤)                                │   │
│   └───────────────────────────────────────────┘   │
│                                                     │
├─────────────────────────────────────────────────────┤
│   💾 수료자 리스트 관리                             │
│   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━   │
│                                                     │
│   [JSON 파일 다운로드] [JSON 파일 업로드]          │
│                                                     │
│   현재 등록된 수료자: 120명                         │
│                                                     │
└─────────────────────────────────────────────────────┘
```

#### 주요 기능

**1. 수료증 대량 업로드**
- 여러 파일 동시 선택 (Ctrl/Cmd + 클릭)
- 드래그 앤 드롭 지원
- 최대 150개 파일 동시 업로드
- 업로드 진행률 표시
- 업로드 완료/실패 알림

**2. 업로드된 수료증 관리**
- 전체 수료증 목록 표시
- 파일명 검색 기능
- 개별 파일 삭제
- 전체 파일 삭제 (확인 필요)

**3. 수료자 리스트 관리**
- JSON 파일 다운로드 (현재 수료자 리스트)
- JSON 파일 업로드 (수정된 리스트)
- 등록된 수료자 수 표시

---

## 📁 파일 구조

### 프로젝트 폴더 구조
```
project/
├── public/
│   ├── index.html              # 사용자 메인 페이지
│   ├── admin-login.html        # 관리자 로그인 페이지
│   ├── admin-dashboard.html    # 관리자 대시보드
│   ├── css/
│   │   ├── main.css            # 메인 페이지 스타일
│   │   └── admin.css           # 관리자 페이지 스타일
│   └── js/
│       ├── main.js             # 메인 페이지 스크립트
│       ├── admin-login.js      # 로그인 스크립트
│       └── admin-dashboard.js  # 대시보드 스크립트
├── server.js                   # Node.js 서버
├── data/
│   └── students.json           # 수료자 리스트
├── certificates/               # 업로드된 수료증 PDF 저장 폴더
│   ├── 홍길동_1990-01-01.pdf
│   ├── 김철수_1985-05-15.pdf
│   └── ...
└── config.json                 # 관리자 비밀번호 등 설정
```

### 수료자 데이터 파일 (students.json)

```json
[
  {
    "name": "홍길동",
    "birthDate": "1990-01-01"
  },
  {
    "name": "김철수",
    "birthDate": "1985-05-15"
  },
  {
    "name": "이영희",
    "birthDate": "1992-03-20"
  }
  // ... 120명
]
```

### 관리자 설정 파일 (config.json)

```json
{
  "adminPassword": "admin1234"
}
```

---

## 💻 구현 코드

### 서버 코드 (server.js)

```javascript
const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(express.json());
app.use(express.static('public'));

// 파일 업로드 설정 (대량 업로드 지원)
const storage = multer.diskStorage({
  destination: './certificates',
  filename: (req, file, cb) => {
    // 원본 파일명 유지 (한글 지원)
    cb(null, Buffer.from(file.originalname, 'latin1').toString('utf8'));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { 
    fileSize: 10 * 1024 * 1024, // 파일당 10MB 제한
    files: 150 // 최대 150개 파일
  }
});

// 수료자 데이터 불러오기
let students = JSON.parse(fs.readFileSync('./data/students.json', 'utf8'));

// 관리자 설정 불러오기
const config = JSON.parse(fs.readFileSync('./config.json', 'utf8'));

// ============================================
// 사용자 API
// ============================================

// 수료자 검증 및 파일 다운로드 API
app.post('/api/download-certificate', (req, res) => {
  const { name, birthDate } = req.body;
  
  // 1단계: 수료자 검증
  const student = students.find(s => 
    s.name === name && s.birthDate === birthDate
  );
  
  if (!student) {
    return res.json({ 
      success: false, 
      message: '죄송합니다. 수료자 목록에 없습니다. 정보를 다시 입력해주세요.' 
    });
  }
  
  // 2단계: 파일명 생성 및 파일 찾기
  const filename = `${name}_${birthDate}.pdf`;
  const filepath = path.join(__dirname, 'certificates', filename);
  
  // 파일 존재 확인
  if (!fs.existsSync(filepath)) {
    return res.json({ 
      success: false, 
      message: '수료증 파일을 찾을 수 없습니다. 관리자에게 문의해주세요.' 
    });
  }
  
  // 파일 다운로드
  res.download(filepath, filename, (err) => {
    if (err) {
      console.error('파일 다운로드 오류:', err);
      res.status(500).json({ 
        success: false, 
        message: '다운로드 중 오류가 발생했습니다.' 
      });
    }
  });
});

// ============================================
// 관리자 API
// ============================================

// 관리자 로그인 API
app.post('/api/admin/login', (req, res) => {
  const { password } = req.body;
  
  if (password === config.adminPassword) {
    res.json({ success: true });
  } else {
    res.json({ success: false, message: '비밀번호가 올바르지 않습니다.' });
  }
});

// 수료증 대량 업로드 API
app.post('/api/admin/upload-certificates', upload.array('certificates', 150), (req, res) => {
  try {
    const uploadedFiles = req.files.map(file => ({
      filename: Buffer.from(file.originalname, 'latin1').toString('utf8'),
      size: file.size,
      path: file.path
    }));
    
    res.json({ 
      success: true, 
      message: `${uploadedFiles.length}개 파일이 업로드되었습니다.`,
      files: uploadedFiles
    });
  } catch (error) {
    console.error('업로드 오류:', error);
    res.status(500).json({ 
      success: false, 
      message: '파일 업로드 중 오류가 발생했습니다.' 
    });
  }
});

// 업로드된 수료증 목록 조회 API
app.get('/api/admin/certificates', (req, res) => {
  try {
    const certificatesDir = './certificates';
    const files = fs.readdirSync(certificatesDir)
      .filter(file => file.endsWith('.pdf'))
      .map(file => ({
        filename: file,
        size: fs.statSync(path.join(certificatesDir, file)).size,
        uploadedAt: fs.statSync(path.join(certificatesDir, file)).mtime
      }))
      .sort((a, b) => a.filename.localeCompare(b.filename));
    
    res.json({ success: true, files });
  } catch (error) {
    console.error('파일 목록 조회 오류:', error);
    res.status(500).json({ success: false, message: '파일 목록 조회 실패' });
  }
});

// 수료증 파일 삭제 API
app.delete('/api/admin/certificate/:filename', (req, res) => {
  try {
    const filename = decodeURIComponent(req.params.filename);
    const filepath = path.join(__dirname, 'certificates', filename);
    
    if (fs.existsSync(filepath)) {
      fs.unlinkSync(filepath);
      res.json({ success: true, message: '파일이 삭제되었습니다.' });
    } else {
      res.json({ success: false, message: '파일을 찾을 수 없습니다.' });
    }
  } catch (error) {
    console.error('파일 삭제 오류:', error);
    res.status(500).json({ success: false, message: '파일 삭제 실패' });
  }
});

// 수료자 리스트 다운로드 API
app.get('/api/admin/students', (req, res) => {
  res.json({ success: true, students });
});

// 수료자 리스트 업로드 API
app.post('/api/admin/students', (req, res) => {
  try {
    const newStudents = req.body.students;
    
    // 데이터 검증
    if (!Array.isArray(newStudents)) {
      return res.json({ success: false, message: '올바른 형식이 아닙니다.' });
    }
    
    // 파일에 저장
    fs.writeFileSync('./data/students.json', JSON.stringify(newStudents, null, 2));
    students = newStudents;
    
    res.json({ 
      success: true, 
      message: `${newStudents.length}명의 수료자 정보가 업데이트되었습니다.` 
    });
  } catch (error) {
    console.error('수료자 리스트 업데이트 오류:', error);
    res.status(500).json({ success: false, message: '업데이트 실패' });
  }
});

// 서버 시작
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`서버가 http://localhost:${PORT} 에서 실행 중입니다.`);
});
```

### 사용자 메인 페이지 (index.html)

```html
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>탄소중립평가사 수료증 발급</title>
  <link rel="stylesheet" href="css/main.css">
</head>
<body>
  <div class="container">
    <h1>2026 탄소중립평가사 수료증 발급</h1>
    
    <form id="certificateForm">
      <div class="form-group">
        <label for="name">성명</label>
        <input type="text" id="name" required placeholder="홍길동">
      </div>
      
      <div class="form-group">
        <label for="birthDate">생년월일</label>
        <input type="date" id="birthDate" required>
      </div>
      
      <button type="submit" class="submit-btn">수료증 다운로드</button>
    </form>
    
    <div id="loading" style="display: none;">
      <p>처리 중입니다...</p>
    </div>
    
    <div id="errorMessage" class="message error" style="display: none;"></div>
    <div id="successMessage" class="message success" style="display: none;"></div>
    
    <div class="admin-link">
      <a href="admin-login.html">관리자 로그인</a>
    </div>
  </div>
  
  <script src="js/main.js"></script>
</body>
</html>
```

### 사용자 페이지 스크립트 (main.js)

```javascript
document.getElementById('certificateForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const name = document.getElementById('name').value;
  const birthDate = document.getElementById('birthDate').value;
  
  showLoading();
  hideMessages();
  
  try {
    const response = await fetch('/api/download-certificate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, birthDate })
    });
    
    const contentType = response.headers.get('content-type');
    
    // PDF 파일인 경우 (성공)
    if (contentType && contentType.includes('application/pdf')) {
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `수료증_${name}_${birthDate}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      hideLoading();
      showSuccess('수료증이 다운로드되었습니다!');
    } 
    // JSON 응답인 경우 (실패)
    else {
      const result = await response.json();
      hideLoading();
      
      if (result.success) {
        showSuccess('수료증이 다운로드되었습니다!');
      } else {
        showError(result.message);
      }
    }
    
  } catch (error) {
    hideLoading();
    showError('오류가 발생했습니다. 다시 시도해주세요.');
    console.error('Error:', error);
  }
});

function showLoading() {
  document.getElementById('loading').style.display = 'block';
}

function hideLoading() {
  document.getElementById('loading').style.display = 'none';
}

function showError(message) {
  const errorElement = document.getElementById('errorMessage');
  errorElement.textContent = message;
  errorElement.style.display = 'block';
  
  setTimeout(() => {
    errorElement.style.display = 'none';
  }, 5000);
}

function showSuccess(message) {
  const successElement = document.getElementById('successMessage');
  successElement.textContent = message;
  successElement.style.display = 'block';
  
  setTimeout(() => {
    successElement.style.display = 'none';
  }, 5000);
}

function hideMessages() {
  document.getElementById('errorMessage').style.display = 'none';
  document.getElementById('successMessage').style.display = 'none';
}
```

### 관리자 대시보드 (admin-dashboard.html)

```html
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>관리자 대시보드</title>
  <link rel="stylesheet" href="css/admin.css">
</head>
<body>
  <div class="admin-container">
    <header>
      <h1>관리자 대시보드</h1>
      <button id="logoutBtn" class="logout-btn">로그아웃</button>
    </header>
    
    <!-- 수료증 업로드 섹션 -->
    <section class="upload-section">
      <h2>📁 수료증 파일 업로드</h2>
      
      <div class="upload-area" id="uploadArea">
        <input type="file" id="fileInput" multiple accept=".pdf" style="display: none;">
        <div class="upload-placeholder">
          <p>📄 여기에 파일을 드래그 앤 드롭하세요</p>
          <p class="sub-text">(최대 150개 파일 동시 업로드 가능)</p>
          <p class="sub-text">파일명 형식: 성명_생년월일.pdf</p>
          <button class="select-btn" onclick="document.getElementById('fileInput').click()">
            파일 선택
          </button>
        </div>
      </div>
      
      <div id="selectedFiles" style="display: none;">
        <h3>선택된 파일: <span id="fileCount">0</span>개</h3>
        <div id="fileList"></div>
        <button id="uploadBtn" class="upload-btn">모두 업로드</button>
      </div>
      
      <div id="uploadProgress" style="display: none;">
        <p>업로드 중... <span id="progressText">0%</span></p>
        <div class="progress-bar">
          <div id="progressFill"></div>
        </div>
      </div>
    </section>
    
    <!-- 업로드된 수료증 목록 -->
    <section class="list-section">
      <h2>📋 업로드된 수료증 목록</h2>
      
      <div class="list-controls">
        <input type="text" id="searchInput" placeholder="파일명 검색...">
        <button id="refreshBtn" class="control-btn">새로고침</button>
        <button id="deleteAllBtn" class="control-btn danger">전체 삭제</button>
      </div>
      
      <div class="certificate-count">
        총 <span id="totalCount">0</span>개
      </div>
      
      <div id="certificateList" class="certificate-list">
        <!-- 파일 목록이 여기에 동적으로 추가됨 -->
      </div>
    </section>
    
    <!-- 수료자 리스트 관리 -->
    <section class="students-section">
      <h2>💾 수료자 리스트 관리</h2>
      
      <div class="students-controls">
        <button id="downloadStudentsBtn" class="control-btn">JSON 파일 다운로드</button>
        <button id="uploadStudentsBtn" class="control-btn">JSON 파일 업로드</button>
        <input type="file" id="studentsFileInput" accept=".json" style="display: none;">
      </div>
      
      <p class="students-info">
        현재 등록된 수료자: <strong id="studentsCount">0</strong>명
      </p>
    </section>
  </div>
  
  <script src="js/admin-dashboard.js"></script>
</body>
</html>
```

### 관리자 대시보드 스크립트 (admin-dashboard.js)

```javascript
// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', () => {
  checkAuth();
  loadCertificates();
  loadStudentsInfo();
  initializeEventListeners();
});

// 인증 확인
function checkAuth() {
  // 간단한 인증 체크 (실제로는 세션/토큰 사용)
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
  
  // 파일 선택
  document.getElementById('fileInput').addEventListener('change', handleFileSelect);
  
  // 드래그 앤 드롭
  const uploadArea = document.getElementById('uploadArea');
  uploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadArea.classList.add('drag-over');
  });
  
  uploadArea.addEventListener('dragleave', () => {
    uploadArea.classList.remove('drag-over');
  });
  
  uploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadArea.classList.remove('drag-over');
    const files = e.dataTransfer.files;
    handleFiles(files);
  });
  
  // 업로드 버튼
  document.getElementById('uploadBtn').addEventListener('click', uploadFiles);
  
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

// 파일 선택 처리
function handleFileSelect(e) {
  handleFiles(e.target.files);
}

// 파일 처리
let selectedFiles = [];

function handleFiles(files) {
  selectedFiles = Array.from(files).filter(file => file.name.endsWith('.pdf'));
  
  if (selectedFiles.length === 0) {
    alert('PDF 파일만 선택해주세요.');
    return;
  }
  
  if (selectedFiles.length > 150) {
    alert('최대 150개 파일까지 업로드할 수 있습니다.');
    selectedFiles = selectedFiles.slice(0, 150);
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
  
  document.getElementById('uploadProgress').style.display = 'block';
  document.getElementById('uploadBtn').disabled = true;
  
  try {
    const response = await fetch('/api/admin/upload-certificates', {
      method: 'POST',
      body: formData
    });
    
    const result = await response.json();
    
    if (result.success) {
      alert(result.message);
      // 초기화
      selectedFiles = [];
      document.getElementById('selectedFiles').style.display = 'none';
      document.getElementById('fileInput').value = '';
      // 목록 새로고침
      loadCertificates();
    } else {
      alert('업로드 실패: ' + result.message);
    }
  } catch (error) {
    console.error('업로드 오류:', error);
    alert('업로드 중 오류가 발생했습니다.');
  } finally {
    document.getElementById('uploadProgress').style.display = 'none';
    document.getElementById('uploadBtn').disabled = false;
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
        <span class="certificate-name">✓ ${file.filename}</span>
        <span class="certificate-size">${formatFileSize(file.size)}</span>
      </div>
      <button class="delete-btn" onclick="deleteCertificate('${file.filename}')">삭제</button>
    </div>
  `).join('');
}

// 수료증 삭제
async function deleteCertificate(filename) {
  if (!confirm(`${filename}을(를) 삭제하시겠습니까?`)) {
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

// 검색 필터
function filterCertificates() {
  const searchTerm = document.getElementById('searchInput').value.toLowerCase();
  const filtered = allCertificates.filter(file => 
    file.filename.toLowerCase().includes(searchTerm)
  );
  displayCertificates(filtered);
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
      a.click();
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
    const students = JSON.parse(text);
    
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
    alert('파일 형식이 올바르지 않습니다.');
  }
}

// 파일 크기 포맷
function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}
```

---

## 🚀 실행 방법

### 1. 필요한 패키지 설치
```bash
npm init -y
npm install express multer
```

### 2. 폴더 구조 생성
```bash
mkdir -p public/css public/js data certificates
```

### 3. 설정 파일 생성

**config.json**:
```json
{
  "adminPassword": "admin1234"
}
```

**data/students.json** (초기 데이터):
```json
[
  {
    "name": "홍길동",
    "birthDate": "1990-01-01"
  }
]
```

### 4. 서버 실행
```bash
node server.js
```

### 5. 접속
- 사용자 페이지: `http://localhost:3000`
- 관리자 로그인: `http://localhost:3000/admin-login.html`

---

## 📋 사용 가이드

### 관리자 워크플로우

1. **수료증 PDF 제작** (외부 프로그램 사용)
   - 파일명 규칙: `성명_생년월일.pdf`
   - 예시: `홍길동_1990-01-01.pdf`

2. **관리자 로그인**
   - 비밀번호 입력

3. **수료자 리스트 업데이트** (필요시)
   - JSON 다운로드 → 수정 → JSON 업로드

4. **수료증 대량 업로드**
   - 파일 선택 또는 드래그 앤 드롭
   - 한 번에 최대 150개 업로드 가능
   - 120명이면 한 번에 모두 업로드 가능

5. **업로드된 수료증 확인**
   - 목록에서 확인
   - 검색으로 특정 파일 찾기
   - 필요시 개별 삭제

### 사용자 워크플로우

1. **메인 페이지 접속**
2. **성명, 생년월일 입력**
3. **수료증 다운로드 버튼 클릭**
4. **자동 다운로드**

---

## ✅ MVP 1단계 v2 체크리스트

### 준비 단계
- [ ] Node.js 설치
- [ ] 프로젝트 폴더 생성
- [ ] npm 패키지 설치

### 개발 단계
- [ ] 서버 코드 작성
- [ ] 사용자 페이지 작성 (HTML, CSS, JS)
- [ ] 관리자 로그인 페이지 작성
- [ ] 관리자 대시보드 작성
- [ ] config.json, students.json 생성

### 테스트 단계
- [ ] 서버 실행 확인
- [ ] 관리자 로그인 테스트
- [ ] 수료증 업로드 테스트 (1개)
- [ ] 수료증 대량 업로드 테스트 (10개 이상)
- [ ] 사용자 다운로드 테스트
- [ ] 파일 검색 기능 테스트
- [ ] 파일 삭제 기능 테스트

### 운영 단계
- [ ] 수료증 PDF 120개 제작
- [ ] 파일명 검증 (형식 확인)
- [ ] 실제 데이터로 students.json 작성
- [ ] 모든 수료증 업로드
- [ ] 최종 테스트

---

## 💡 주요 특징 및 장점

### 관리자 측면
✅ 수료증 디자인 자유도 100% (외부 프로그램 사용)  
✅ 대량 업로드 지원 (120개 한 번에 가능)  
✅ 드래그 앤 드롭으로 쉬운 업로드  
✅ 업로드된 파일 관리 (검색, 삭제)  
✅ 수료자 리스트 JSON으로 관리  

### 사용자 측면
✅ 간단한 정보 입력만으로 다운로드  
✅ 즉시 다운로드 (생성 대기 시간 없음)  
✅ 깔끔한 UI/UX  

### 기술적 측면
✅ 구현 난이도 낮음  
✅ 서버 부하 적음 (파일 매칭만)  
✅ 유지보수 쉬움  
✅ 확장 가능 (2단계로 발전 가능)  

---

## 🔄 다음 단계

### 2단계: 다운로드 이력 관리
- 1인 1회 다운로드 제한
- 다운로드 이력 기록
- 관리자가 재발급 허용 기능

### 3단계: 고급 관리 기능
- 수료증 통계 대시보드
- 다운로드 이력 조회
- 수료자 검색/필터링
- 대시보드 UI 개선

---

**문서 버전**: MVP 1.0 v2  
**최종 수정일**: 2026-01-27  
**작성자**: Claude
