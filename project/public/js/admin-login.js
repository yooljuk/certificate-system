document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('loginForm');
  const loginBtn = document.getElementById('loginBtn');
  const btnText = loginBtn.querySelector('.btn-text');
  const btnLoading = loginBtn.querySelector('.btn-loading');
  const errorMessage = document.getElementById('errorMessage');

  // 이미 로그인된 경우 대시보드로 이동
  if (sessionStorage.getItem('adminAuth')) {
    window.location.href = 'admin-dashboard.html';
    return;
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const password = document.getElementById('password').value;

    if (!password) {
      showError('비밀번호를 입력해주세요.');
      return;
    }

    setLoading(true);
    hideError();

    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });

      const result = await response.json();

      if (result.success) {
        // 인증 상태 저장
        sessionStorage.setItem('adminAuth', 'true');
        // 대시보드로 이동
        window.location.href = 'admin-dashboard.html';
      } else {
        showError(result.message || '로그인에 실패했습니다.');
      }

    } catch (error) {
      console.error('Error:', error);
      showError('서버 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  });

  function setLoading(isLoading) {
    loginBtn.disabled = isLoading;
    btnText.style.display = isLoading ? 'none' : 'inline';
    btnLoading.style.display = isLoading ? 'inline-flex' : 'none';
  }

  function showError(text) {
    errorMessage.textContent = text;
    errorMessage.style.display = 'block';
  }

  function hideError() {
    errorMessage.style.display = 'none';
  }
});
