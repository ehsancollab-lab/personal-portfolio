const form = document.querySelector('#login-form');
const error = document.querySelector('#login-error');
form.addEventListener('submit', async (event) => {
  event.preventDefault();
  const button = form.querySelector('button');
  const input = form.querySelector('input');
  error.hidden = true;
  button.disabled = true;
  try {
    const response = await fetch('/api/login', {
      method: 'POST', credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: input.value })
    });
    input.value = '';
    if (response.ok) { location.replace('/'); return; }
    error.textContent = response.status === 429 ? 'Too many attempts. Please wait a minute and try again.'
      : response.status === 401 ? 'Incorrect password.' : 'Sign-in is unavailable. Please try again later.';
    error.hidden = false;
    input.focus();
  } catch {
    input.value = '';
    error.textContent = 'Could not connect. Check your connection and try again.';
    error.hidden = false;
  } finally { button.disabled = false; }
});
