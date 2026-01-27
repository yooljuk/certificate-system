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

      const result = await response.json();

      if (result.success && result.downloadUrl) {
        // Cloudinary URL로 다운로드
        const a = document.createElement('a');
        a.href = result.downloadUrl;
        a.download = result.filename || `수료증_${name}_${birthDate}.pdf`;
        a.target = '_blank';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        showMessage('수료증이 다운로드되었습니다!', 'success');
      } else {
        showMessage(result.message || '다운로드에 실패했습니다.', 'error');
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
