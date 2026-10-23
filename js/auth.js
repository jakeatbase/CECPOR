const $ = s => document.querySelector(s);
function toast(msg, ok) { const t = $('#toast'); t.textContent = msg; t.className = ok ? 'ok' : 'err'; clearTimeout(t.t); t.t = setTimeout(() => t.className = '', 4000); }
async function post(url, body) {
  try { return await DB.call(url, 'POST', body); } catch (e) { throw new Error(e.error || 'Something went wrong.'); }
}
const form = $('#f'), isLogin = !!$('#pw');
form.addEventListener('submit', async e => {
  e.preventDefault(); const d = Object.fromEntries(new FormData(form)); d.remember = !!d.remember;
  try {
    if (isLogin) { await post('/auth/login', d); location = 'portal.html#home'; }
    else { await post('/auth/signup', d); toast('Account created. Redirecting to log in…', true); setTimeout(() => location = 'login.html', 1200); }
  } catch (err) { toast(err.message); }
});
if (isLogin) {
  $('#eye').onclick = () => { const p = $('#pw'); p.type = p.type === 'password' ? 'text' : 'password'; };
  $('#forgot').onclick = async e => {
    e.preventDefault();
    const username = prompt('Enter your username:'); if (!username) return;
    const email = prompt('Enter the email address registered to this account:'); if (!email) return;
    const password = prompt('Enter a new password (at least 8 characters):'); if (!password) return;
    try { await post('/auth/reset', { username, email, password }); toast('Password updated. You can log in now.', true); } catch (err) { toast(err.message); }
  };
}
