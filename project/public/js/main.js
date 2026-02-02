document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('certificateForm');
  const submitBtn = document.getElementById('submitBtn');
  const btnText = submitBtn.querySelector('.btn-text');
  const btnLoading = submitBtn.querySelector('.btn-loading');
  const messageDiv = document.getElementById('message');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = document.getElementById('name').value.trim();
    const birthDate = document.getElementById('birthDate').value;

    if (!name || !birthDate) {
      showMessage('성명과 생년월일을 모두 입력해주세요.', 'error');
      return;
    }

    setLoading(true);
    hideMessage();

    try {
      const response = await fetch('/api/download-certificate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, birthDate })
      });

      // Content-Type 확인
      const contentType = response.headers.get('content-type');

      // JSON 응답인 경우
      if (contentType && contentType.includes('application/json')) {
        const result = await response.json();

        if (result.success && result.downloadUrl) {
          // Cloudinary URL로 새 탭에서 다운로드
          window.open(result.downloadUrl, '_blank');
          showMessage('수료증이 다운로드되었습니다!', 'success');
          setTimeout(() => showDriveModal(), 500);
        } else {
          showMessage(result.message || '다운로드에 실패했습니다.', 'error');
        }
      }
      // PDF 직접 반환인 경우 (이전 버전 호환)
      else if (contentType && contentType.includes('application/pdf')) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `수료증_${name}_${birthDate}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        showMessage('수료증이 다운로드되었습니다!', 'success');
        setTimeout(() => showDriveModal(), 500);
      }
      // 기타 응답
      else {
        const text = await response.text();
        try {
          const result = JSON.parse(text);
          showMessage(result.message || '다운로드에 실패했습니다.', 'error');
        } catch {
          showMessage('서버 응답 오류가 발생했습니다.', 'error');
        }
      }

    } catch (error) {
      console.error('Error:', error);
      showMessage('오류가 발생했습니다. 다시 시도해주세요.', 'error');
    } finally {
      setLoading(false);
    }
  });

  function setLoading(isLoading) {
    submitBtn.disabled = isLoading;
    btnText.style.display = isLoading ? 'none' : 'inline';
    btnLoading.style.display = isLoading ? 'inline-flex' : 'none';
  }

  function showMessage(text, type) {
    messageDiv.textContent = text;
    messageDiv.className = `message ${type}`;
    messageDiv.style.display = 'block';

    // 5초 후 자동 숨김
    setTimeout(() => {
      hideMessage();
    }, 5000);
  }

  function hideMessage() {
    messageDiv.style.display = 'none';
  }
});

// ========================================
// 구글 드라이브 링크 모달 함수들
// ========================================

// 구글 드라이브 공유 링크 (여기에 실제 링크 입력)
const GOOGLE_DRIVE_LINK = 'https://drive.google.com/drive/folders/1JAcNMW_Ugie8hmeB8t6kh-1klZrFzxaW?usp=sharing';

function showDriveModal() {
  const modal = document.getElementById('driveModal');
  const linkInput = document.getElementById('driveLink');
  linkInput.value = GOOGLE_DRIVE_LINK;
  modal.style.display = 'flex';
}

function closeDriveModal() {
  const modal = document.getElementById('driveModal');
  modal.style.display = 'none';
}

function copyDriveLink() {
  const linkInput = document.getElementById('driveLink');

  if (navigator.clipboard) {
    navigator.clipboard.writeText(linkInput.value)
      .then(() => alert('링크가 복사되었습니다!'))
      .catch(() => fallbackCopy(linkInput));
  } else {
    fallbackCopy(linkInput);
  }
}

function fallbackCopy(input) {
  input.select();
  document.execCommand('copy');
  alert('링크가 복사되었습니다!');
}

function openDriveLink() {
  window.open(GOOGLE_DRIVE_LINK, '_blank');
  closeDriveModal();
}

// ESC 키로 모달 닫기
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeDriveModal();
  }
});
