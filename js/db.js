/* Browser-only data layer (replaces the Node/MySQL backend so the site works on GitHub Pages).
   Data is saved in this browser's localStorage. */
(function () {
  const KEY = 'cec_portal_db', TERM = { academicYear: '2026-2027', semester: '1st Semester' };
  const emailRx = /^[^\s@]+@[^\s@]+\.[^\s@]+$/, phoneRx = /^09\d{9}$/;
  const err = (error, status = 400) => { throw { error, status }; };
  const load = () => { try { return JSON.parse(localStorage.getItem(KEY)); } catch { return null; } };
  let db = load();
  const save = () => localStorage.setItem(KEY, JSON.stringify(db));
  async function hash(s) {
    if (crypto.subtle) { const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode('cec:' + s)); return [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, '0')).join(''); }
    return btoa('cec:' + s);
  }
  async function init() {
    if (db && db.users) return;
    db = { next: 2, users: [], grades: {}, term: {}, sched: {}, enroll: {} };
    db.users.push({ id: 1, username: 'simone', pw: await hash('password123'), school_id: '2410957', email: 'simone@example.com', contact: '09123456789', full_name: 'Simone Kristopher H. Baguio', dob: '2005-03-14', gender: 'Male', address: 'Cebu, Philippines', course: 'Bachelor of Science in Information Technology', year_level: 3, section: 'Section 6', semester: '1st Semester' });
    const g = [2.0, 1.6, 1.9, 2.9, 2.8, 1.9, 2.1, 1.6]; db.grades[1] = {};
    g.forEach((v, i) => db.grades[1][i + 1] = v);
    db.term[1] = [['IT IAS31', 'Introduction to Information Assurance', 'Mr. Jay Base', 3], ['GE ELEC 6', 'Philippine Pop Culture', 'Mrs. Melinda Amante', 4], ['IT NET31 LAB', 'Computer Networking', 'Mr. Arnel Villanueva', 3], ['IT EVD31', 'Database Management Systems', 'Mr. Arnel Villanueva', 3], ['IT SIA31', 'Systems Integration & Architecture', 'Mr. Charles Bacatot', 4], ['GE ELEC 5', 'Panitikan', 'Mrs. Gracelda Tormis', 2], ['IT ELEC 1', 'Elective (LAB)', 'Mrs. En Catarungan', 3]].map(([code, title, instructor, units]) => ({ code, title, instructor, units, grade: null }));
    db.sched[1] = [['2612189', 'IT IAS31', 'Information Assurance and Security 1', 'MW', '07:30-09:00AM', 'CL6', 'Mr. Jay Base'], ['2611845', 'GE ELEC 6', 'Philippine Popular Culture', 'MW', '09:30-10:30AM', 'H204', 'Mrs. Melinda Amante'], ['2612190', 'IT NET31', 'Networking 1', 'MWF', '10:30-12:00PM', 'CL1', 'Mr. Villanueva'], ['2611850', 'IT SPI31', 'Social and Professional Issues', 'TTHS', '07:30-09:00AM', 'CL4', 'Ms. Sadora'], ['2611844', 'GE ELEC 5', 'Ang Panitikan ng Pilipinas', 'TTHS', '09:30-10:30AM', 'H204', 'Mrs. Gracelda Tormis'], ['2612191', 'IT SIA31', 'System Integration and Architecture', 'TTHS', '10:30-12:00PM', 'OCL', 'Mr. Bacotat'], ['2611852', 'FREE ELEC 1', 'Free Elective 1', 'FS', '04:30-06:00PM', 'CL2', 'TBA'], ['2612188', 'IT EVD31', 'Event Driven Programming', 'FS', '06:00-07:30PM', 'H204', 'Mr. Prado'], ['2612192', 'IT ELEC 1', 'Philippine Popular Culture', 'FS', '07:30-09:00PM', 'CL1', 'Mrs. En Catarungan']]
      .map(([edp_code, code, title, days, time_text, room, instructor]) => ({ edp_code, code, title, days, time_text, room, type: 'Lec', units: 1, instructor }));
    save();
  }
  const uid = () => +(sessionStorage.getItem('cec_uid') || localStorage.getItem('cec_uid') || 0);
  const need = () => { const u = db.users.find(x => x.id === uid()); if (!u) err('Please log in.', 401); return u; };
  const pub = u => { const { pw, ...r } = u; r.age = u.dob ? Math.floor((Date.now() - new Date(u.dob)) / 31557600000) : null; return r; };

  const routes = {
    async 'POST /auth/signup'(b) {
      const { username, password, confirm, school_id, contact, email } = b;
      if (!/^[A-Za-z0-9_]{3,30}$/.test(username || '')) err('Username must be 3–30 letters, numbers or underscores.');
      if (!password || password.length < 8) err('Password must be at least 8 characters.');
      if (password !== confirm) err('Passwords do not match.');
      if (!/^\d{5,15}$/.test(school_id || '')) err('School ID must be digits only.');
      if (!phoneRx.test(contact || '')) err('Contact number must look like 09123456789.');
      if (!emailRx.test(email || '')) err('Enter a valid email address.');
      if (db.users.some(u => u.username.toLowerCase() === username.toLowerCase() || u.school_id === school_id || u.email.toLowerCase() === email.toLowerCase())) err('That username, school ID or email is already registered.');
      db.users.push({ id: db.next++, username, pw: await hash(password), school_id, email, contact, course: null, year_level: null, section: null, semester: null });
      save(); return { ok: true };
    },
    async 'POST /auth/login'(b) {
      const u = db.users.find(x => x.username === b.username);
      if (!u || u.pw !== await hash(b.password || '')) err('Incorrect username or password.', 401);
      sessionStorage.removeItem('cec_uid'); localStorage.removeItem('cec_uid');
      (b.remember ? localStorage : sessionStorage).setItem('cec_uid', u.id); return { ok: true };
    },
    'POST /auth/logout'() { sessionStorage.removeItem('cec_uid'); localStorage.removeItem('cec_uid'); return { ok: true }; },
    async 'POST /auth/reset'(b) {
      if (!b.password || b.password.length < 8) err('New password must be at least 8 characters.');
      const u = db.users.find(x => x.username === b.username && x.email === b.email);
      if (!u) err('Username and email do not match an account.');
      u.pw = await hash(b.password); save(); return { ok: true };
    },
    'GET /me'() { return { user: pub(need()), term: TERM }; },
    'PUT /me'(b) {
      const u = need();
      if (!b.full_name || b.full_name.length > 120) err('Enter your full name.');
      if (!phoneRx.test(b.contact || '')) err('Contact number must look like 09123456789.');
      if (!emailRx.test(b.email || '')) err('Enter a valid email address.');
      if (db.users.some(x => x.id !== u.id && x.email.toLowerCase() === b.email.toLowerCase())) err('That email is already in use.');
      Object.assign(u, { full_name: b.full_name, contact: b.contact, email: b.email, address: b.address || null }); save(); return { user: pub(u) };
    },
    'GET /records'(b, q) {
      const u = need(), y = Math.min(4, Math.max(1, +q.get('year') || 1)), s = +q.get('sem') === 2 ? 2 : 1, g = db.grades[u.id] || {};
      return { rows: CURRICULUM.filter(c => c.year_level === y && c.semester === s).sort((a, b) => a.sort - b.sort).map(c => ({ ...c, grade: g[c.id] ?? null })) };
    },
    'GET /grades'() { return { rows: db.term[need().id] || [], term: TERM }; },
    'GET /schedule'() { return { rows: db.sched[need().id] || [] }; },
    'GET /announcements'() { need(); return { rows: ANNOUNCEMENTS }; },
    'GET /home'() {
      const u = need(), g = db.grades[u.id] || {}; let a = 0, n = 0;
      CURRICULUM.forEach(c => { if (g[c.id] != null) { a += g[c.id] * c.units; n += c.units; } });
      return { gpa: n ? +(a / n).toFixed(2) : null, courses: db.sched[u.id] || [] };
    },
    'GET /enrollment'() { return { enrollment: db.enroll[need().id] || null }; },
    'POST /enrollment'(fd) {
      const u = need(), b = Object.fromEntries([...fd.entries()].filter(([, v]) => typeof v === 'string')), submit = b.action === 'submit';
      const old = db.enroll[u.id] || {}, files = { ...(old.files || {}) };
      ['psa', 'form138', 'moral', 'idphoto', 'transfer'].forEach(k => { const f = fd.get(k); if (f && f.name) { if (f.size > 5242880) err('Each file must be 5 MB or smaller.'); files[k] = f.name; } });
      if (submit) {
        for (const [k, l] of [['full_name', 'Full name'], ['dob', 'Date of birth'], ['address', 'Home address'], ['contact', 'Contact number'], ['email', 'Email address'], ['guardian_name', 'Guardian name'], ['relationship', 'Relationship'], ['guardian_contact', 'Guardian contact number'], ['last_school', 'Last school attended']])
          if (!(b[k] || '').trim()) err(`${l} is required.`);
        if (!phoneRx.test(b.contact) || !phoneRx.test(b.guardian_contact)) err('Contact numbers must look like 09123456789.');
        if (!emailRx.test(b.email)) err('Enter a valid email address.');
        if (isNaN(Date.parse(b.dob)) || new Date(b.dob) > new Date()) err('Enter a valid date of birth.');
        if (!['Male', 'Female'].includes(b.gender)) err('Select a gender.');
        if (['psa', 'form138', 'moral', 'idphoto', ...(b.student_type === 'Transferee' ? ['transfer'] : [])].some(k => !files[k])) err('Upload all required documents (PDF, JPG or PNG).');
        if (b.certify !== 'true') err('Please certify that your information is true and complete.');
      }
      const { action, certify, ...rest } = b;
      db.enroll[u.id] = { ...rest, files, status: submit ? 'submitted' : 'draft' };
      if (submit) Object.assign(u, { full_name: b.full_name, dob: b.dob, gender: b.gender, address: b.address, contact: b.contact, course: b.course, year_level: parseInt(b.year_level) || null });
      save(); return { ok: true, status: submit ? 'submitted' : 'draft' };
    }
  };
  window.DB = {
    ready: init(),
    async call(url, method = 'GET', body) {
      await this.ready;
      const [path, qs] = url.split('?'), h = routes[method + ' ' + path];
      if (!h) err('Not found', 404);
      return JSON.parse(JSON.stringify(await h(body || {}, new URLSearchParams(qs || ''))));
    }
  };
  // body for FormData routes must stay a FormData; JSON clone above is fine for results
  const orig = window.DB.call; window.DB.call = async function (u, m, b) { await this.ready; const [p, qs] = u.split('?'), h = routes[(m || 'GET') + ' ' + p]; if (!h) err('Not found', 404); const r = await h(b || {}, new URLSearchParams(qs || '')); return JSON.parse(JSON.stringify(r)); };
})();
