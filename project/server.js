const express = require('express');
const fs = require('fs');
const path = require('path');
const axios = require('axios');

const app = express();
app.use(express.json());
app.use(express.static('public'));

// Google Drive 설정
const GOOGLE_DRIVE_FOLDER_ID = process.env.GOOGLE_DRIVE_FOLDER_ID;
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;

// 데이터 파일 경로
const DATA_DIR = './data';
const STUDENTS_PATH = path.join(DATA_DIR, 'students.json');
const CONFIG_PATH = './config.json';

// 데이터 폴더 확인 및 생성
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// 수료자 데이터 불러오기
function loadStudents() {
  try {
    if (fs.existsSync(STUDENTS_PATH)) {
      return JSON.parse(fs.readFileSync(STUDENTS_PATH, 'utf8'));
    }
    return [];
  } catch (error) {
    console.error('수료자 데이터 로드 오류:', error);
    return [];
  }
}

// 수료자 데이터 저장
function saveStudents(students) {
  fs.writeFileSync(STUDENTS_PATH, JSON.stringify(students, null, 2), 'utf8');
}

// 관리자 설정 불러오기
function loadConfig() {
  try {
    if (fs.existsSync(CONFIG_PATH)) {
      return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
    }
    return { adminPassword: process.env.ADMIN_PASSWORD || 'admin1234' };
  } catch (error) {
    console.error('설정 파일 로드 오류:', error);
    return { adminPassword: process.env.ADMIN_PASSWORD || 'admin1234' };
  }
}

// Google Drive에서 파일 검색
async function findFileInGoogleDrive(filename) {
  try {
    const query = encodeURIComponent(`name='${filename}' and '${GOOGLE_DRIVE_FOLDER_ID}' in parents`);
    const url = `https://www.googleapis.com/drive/v3/files?q=${query}&key=${GOOGLE_API_KEY}&fields=files(id,name,size)`;

    console.log('🔍 Google Drive 검색:', filename);

    const response = await axios.get(url);

    if (response.data.files && response.data.files.length > 0) {
      console.log('✅ 파일 찾음:', response.data.files[0]);
      return response.data.files[0];
    }

    console.log('❌ 파일 없음');
    return null;
  } catch (error) {
    console.error('Google Drive 검색 오류:', error.message);
    return null;
  }
}

// Google Drive에서 폴더 내 모든 파일 목록 조회
async function listGoogleDriveFiles() {
  try {
    const query = encodeURIComponent(`'${GOOGLE_DRIVE_FOLDER_ID}' in parents and mimeType='application/pdf'`);
    const url = `https://www.googleapis.com/drive/v3/files?q=${query}&key=${GOOGLE_API_KEY}&fields=files(id,name,size,createdTime)&pageSize=1000`;

    const response = await axios.get(url);

    return response.data.files || [];
  } catch (error) {
    console.error('Google Drive 목록 조회 오류:', error.message);
    return [];
  }
}

// ============================================
// 사용자 API
// ============================================

// 수료자 검증 및 파일 다운로드 API
app.post('/api/download-certificate', async (req, res) => {
  const { name, birthDate } = req.body;

  console.log('=== 다운로드 요청 ===');
  console.log('요청 정보:', { name, birthDate });

  if (!name || !birthDate) {
    return res.json({
      success: false,
      message: '성명과 생년월일을 모두 입력해주세요.'
    });
  }

  const students = loadStudents();

  // 1단계: 수료자 검증
  const student = students.find(s =>
    s.name === name && s.birthDate === birthDate
  );

  if (!student) {
    console.log('❌ 수료자 검증 실패');
    return res.json({
      success: false,
      message: '죄송합니다. 수료자 목록에 없습니다. 정보를 다시 입력해주세요.'
    });
  }

  console.log('✅ 수료자 검증 성공');

  // 2단계: Google Drive에서 파일 찾기
  const filename = `${name}_${birthDate}.pdf`;

  try {
    const file = await findFileInGoogleDrive(filename);

    if (!file) {
      return res.json({
        success: false,
        message: '수료증 파일을 찾을 수 없습니다. 관리자에게 문의해주세요.'
      });
    }

    // Google Drive 직접 다운로드 URL
    const downloadUrl = `https://www.googleapis.com/drive/v3/files/${file.id}?alt=media&key=${GOOGLE_API_KEY}`;

    console.log('📥 다운로드 시작...');

    // Google Drive에서 파일 다운로드
    const response = await axios.get(downloadUrl, {
      responseType: 'arraybuffer',
      timeout: 30000
    });

    console.log('✅ 파일 다운로드 완료:', response.data.byteLength, 'bytes');

    // PDF 파일로 응답
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);
    res.send(Buffer.from(response.data));

    console.log('✅ 사용자에게 전송 완료');

  } catch (error) {
    console.error('❌ 파일 다운로드 오류:', error.message);

    return res.json({
      success: false,
      message: '수료증 파일을 불러오는 중 오류가 발생했습니다. 관리자에게 문의해주세요.'
    });
  }
});

// ============================================
// 관리자 API
// ============================================

// 관리자 로그인 API
app.post('/api/admin/login', (req, res) => {
  const { password } = req.body;
  const config = loadConfig();

  if (password === config.adminPassword) {
    res.json({ success: true });
  } else {
    res.json({ success: false, message: '비밀번호가 올바르지 않습니다.' });
  }
});

// 업로드된 수료증 목록 조회 API (Google Drive)
app.get('/api/admin/certificates', async (req, res) => {
  try {
    const files = await listGoogleDriveFiles();

    const formattedFiles = files.map(file => ({
      filename: file.name,
      size: file.size,
      uploadedAt: file.createdTime,
      driveId: file.id
    }));

    res.json({ success: true, files: formattedFiles });
  } catch (error) {
    console.error('파일 목록 조회 오류:', error);
    res.status(500).json({ success: false, message: '파일 목록 조회 실패' });
  }
});

// 수료자 리스트 조회 API
app.get('/api/admin/students', (req, res) => {
  const students = loadStudents();
  res.json({ success: true, students });
});

// 수료자 리스트 업데이트 API
app.post('/api/admin/students', (req, res) => {
  try {
    const newStudents = req.body.students;

    // 데이터 검증
    if (!Array.isArray(newStudents)) {
      return res.json({ success: false, message: '올바른 형식이 아닙니다.' });
    }

    // 각 항목 검증
    for (const student of newStudents) {
      if (!student.name || !student.birthDate) {
        return res.json({
          success: false,
          message: '모든 수료자는 name과 birthDate 필드가 필요합니다.'
        });
      }
    }

    // 파일에 저장
    saveStudents(newStudents);

    res.json({
      success: true,
      message: `${newStudents.length}명의 수료자 정보가 업데이트되었습니다.`
    });
  } catch (error) {
    console.error('수료자 리스트 업데이트 오류:', error);
    res.status(500).json({ success: false, message: '업데이트 실패' });
  }
});

// 에러 핸들러
app.use((err, req, res, next) => {
  console.error('서버 오류:', err);
  res.status(500).json({ success: false, message: '서버 오류가 발생했습니다.' });
});

// 서버 시작
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`========================================`);
  console.log(`  탄소중립평가사 수료증 발급 시스템`);
  console.log(`========================================`);
  console.log(`  서버가 포트 ${PORT}에서 실행 중입니다.`);
  console.log(`  Google Drive 연동: ${GOOGLE_DRIVE_FOLDER_ID ? '활성화' : '비활성화'}`);
  console.log(`========================================`);
});
