const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');

const app = express();
app.use(express.json());
app.use(express.static('public'));

// Cloudinary 설정
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Multer 메모리 스토리지 (Cloudinary 업로드용)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 파일당 10MB 제한
    files: 150 // 최대 150개 파일
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('PDF 파일만 업로드할 수 있습니다.'), false);
    }
  }
});

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

// Cloudinary에 파일 업로드
function uploadToCloudinary(buffer, filename) {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: 'certificates',
        public_id: filename.replace('.pdf', ''),
        resource_type: 'raw',
        format: 'pdf',
        access_mode: 'public'
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );
    streamifier.createReadStream(buffer).pipe(uploadStream);
  });
}

// Cloudinary에서 파일 목록 조회
async function getCloudinaryFiles() {
  try {
    const result = await cloudinary.api.resources({
      type: 'upload',
      prefix: 'certificates/',
      resource_type: 'raw',
      max_results: 500
    });
    return result.resources.map(file => ({
      filename: file.public_id.replace('certificates/', '') + '.pdf',
      public_id: file.public_id,
      size: file.bytes,
      url: file.secure_url,
      uploadedAt: file.created_at
    }));
  } catch (error) {
    console.error('Cloudinary 파일 목록 조회 오류:', error);
    return [];
  }
}

// Cloudinary에서 파일 삭제
async function deleteFromCloudinary(publicId) {
  try {
    await cloudinary.uploader.destroy(publicId, { resource_type: 'raw' });
    return true;
  } catch (error) {
    console.error('Cloudinary 파일 삭제 오류:', error);
    return false;
  }
}

// ============================================
// 사용자 API
// ============================================

// 수료자 검증 및 파일 다운로드 API
app.post('/api/download-certificate', async (req, res) => {
  const { name, birthDate } = req.body;

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
    return res.json({
      success: false,
      message: '죄송합니다. 수료자 목록에 없습니다. 정보를 다시 입력해주세요.'
    });
  }

  // 2단계: Cloudinary에서 파일 찾기
  const filename = `${name}_${birthDate}`;
  const publicId = `certificates/${filename}.pdf`;

  try {
    const result = await cloudinary.api.resource(publicId, { resource_type: 'raw' });

    // 다운로드 URL 반환
    res.json({
      success: true,
      downloadUrl: result.secure_url,
      filename: `${filename}.pdf`
    });
  } catch (error) {
    console.error('파일 조회 오류:', error);
    return res.json({
      success: false,
      message: '수료증 파일을 찾을 수 없습니다. 관리자에게 문의해주세요.'
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

// 수료증 대량 업로드 API
app.post('/api/admin/upload-certificates', upload.array('certificates', 150), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.json({
        success: false,
        message: '업로드할 파일이 없습니다.'
      });
    }

    const uploadResults = [];
    const errors = [];

    for (const file of req.files) {
      try {
        const filename = Buffer.from(file.originalname, 'latin1').toString('utf8');
        const result = await uploadToCloudinary(file.buffer, filename);
        uploadResults.push({
          filename: filename,
          url: result.secure_url
        });
      } catch (error) {
        console.error('파일 업로드 실패:', file.originalname, error);
        errors.push(file.originalname);
      }
    }

    if (uploadResults.length > 0) {
      res.json({
        success: true,
        message: `${uploadResults.length}개 파일이 업로드되었습니다.${errors.length > 0 ? ` (${errors.length}개 실패)` : ''}`,
        files: uploadResults
      });
    } else {
      res.json({
        success: false,
        message: '모든 파일 업로드에 실패했습니다.'
      });
    }
  } catch (error) {
    console.error('업로드 오류:', error);
    res.status(500).json({
      success: false,
      message: '파일 업로드 중 오류가 발생했습니다.'
    });
  }
});

// 업로드된 수료증 목록 조회 API
app.get('/api/admin/certificates', async (req, res) => {
  try {
    const files = await getCloudinaryFiles();
    res.json({ success: true, files });
  } catch (error) {
    console.error('파일 목록 조회 오류:', error);
    res.status(500).json({ success: false, message: '파일 목록 조회 실패' });
  }
});

// 수료증 파일 삭제 API
app.delete('/api/admin/certificate/:filename', async (req, res) => {
  try {
    const filename = decodeURIComponent(req.params.filename);
    const publicId = `certificates/${filename.replace('.pdf', '')}`;

    const success = await deleteFromCloudinary(publicId);

    if (success) {
      res.json({ success: true, message: '파일이 삭제되었습니다.' });
    } else {
      res.json({ success: false, message: '파일 삭제에 실패했습니다.' });
    }
  } catch (error) {
    console.error('파일 삭제 오류:', error);
    res.status(500).json({ success: false, message: '파일 삭제 실패' });
  }
});

// 전체 수료증 삭제 API
app.delete('/api/admin/certificates/all', async (req, res) => {
  try {
    const files = await getCloudinaryFiles();
    let deletedCount = 0;

    for (const file of files) {
      const success = await deleteFromCloudinary(file.public_id);
      if (success) deletedCount++;
    }

    res.json({
      success: true,
      message: `${deletedCount}개 파일이 삭제되었습니다.`
    });
  } catch (error) {
    console.error('전체 삭제 오류:', error);
    res.status(500).json({ success: false, message: '전체 삭제 실패' });
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
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: '파일 크기는 10MB를 초과할 수 없습니다.'
      });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: '한 번에 최대 150개 파일만 업로드할 수 있습니다.'
      });
    }
  }
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
  console.log(`  Cloudinary 연동: ${process.env.CLOUDINARY_CLOUD_NAME ? '활성화' : '비활성화'}`);
  console.log(`========================================`);
});
