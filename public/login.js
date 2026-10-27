const form = document.getElementById('loginForm');
const errorBox = document.getElementById('loginError');

form.addEventListener('submit', async (event) => {
  event.preventDefault();

  const data = new FormData(form);
  const payload = {
    username: data.get('username')?.toString().trim(),
    password: data.get('password')?.toString(),
  };

  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.error || 'Login failed');
    }

    window.location.href = '/';
  } catch (error) {
    errorBox.textContent = error.message;
    errorBox.classList.remove('hidden');
  }
});
