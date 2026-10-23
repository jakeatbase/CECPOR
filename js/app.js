const $ = s => document.querySelector(s), app = $('#app');
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const ord = n => ['', '1st', '2nd', '3rd', '4th'][n] || n + 'th';
function toast(msg, ok) { const t = $('#toast'); t.textContent = msg; t.className = ok ? 'ok' : 'err'; clearTimeout(t.t); t.t = setTimeout(() => t.className = '', 4500); }
async function api(url, opts = {}) {
  try { return await DB.call(url, opts.method || 'GET', opts.body); }
  catch (e) { if (e.status === 401) { location = 'login.html'; throw new Error('auth'); } throw new Error(e.error || 'Something went wrong.'); }
}
const NUM = [['grades', 'Grades'], ['announcements', 'Announcements'], ['schedule', 'Class Schedule'], ['enrollment', 'Enrollment Status'], ['records', 'Academic Records'], ['settings', 'Settings']];
const NA = 'This page was not included in the supplied design.';
function sideNum(view, extra) {
  return `<aside class="side"><a class="brand" href="#home"><img src="assets/logo.png" alt="">Cebu Eastern College</a><nav class="nav">
  ${NUM.map(([k, l], i) => `<a href="#${k}" class="${view === k ? 'on' : ''}"><b>0${i + 1}</b>${l}</a>`).join('')}${extra || ''}</nav>
  <div class="bot"><a href="about.html">👤&#xFE0E; About Us</a><button class="lo" id="lo">LOGOUT</button></div></aside>`;
}
function sideSec(view) {
  const l = (h, t) => h ? `<a href="#${h}">${t}</a>` : `<span data-na>${t}</span>`;
  return `<aside class="side side2" style="padding-top:34px"><a class="brand" href="#home"><img src="assets/logo.png" alt="">Cebu Eastern College</a>
  <div class="sec" style="border-top:0;padding-top:0"><small>ACADEMIC</small>${l('records', '🎓&#xFE0E; Academic Records')}${l('schedule', '▤ View Schedule')}${l('grades', '↗ Student Grades')}${l('', '✓ Assignments')}${l('', '▦ Attendance')}</div>
  <div class="sec" style="margin-top:60px"><small>ADMINISTRATIVE</small>${l('announcements', '⌂ Announcements')}</div>
  <div class="sec" style="margin-top:50px"><small>SETTINGS</small>${l('settings', '⚙ Account Settings')}${l('settings', '🔔&#xFE0E; Notification References')}${l('', '👤&#xFE0E; About Us').replace('<span data-na>', '<a href="about.html">').replace('</span>', '</a>')}</div>
  <div class="bot"><button class="lo" id="lo">LOGOUT</button></div></aside>`;
}
const shell = (side, body) => { app.innerHTML = `<div class="layout">${side}<main class="main">${body}</main></div>`;
  const lo = $('#lo'); if (lo) lo.onclick = async () => { await DB.call('/auth/logout', 'POST'); location = 'login.html'; };
  document.querySelectorAll('[data-na]').forEach(e => e.onclick = () => toast(NA)); };
const header = (u, t, sem) => `<div class="info"><div>ID NUMBER : ${esc(u.school_id)}<br>STUDENT NAME : ${esc(u.full_name || u.username)}<br>COURSE/YEAR : BSIT / ${esc(sem.year)}<br>SECTION : ${esc((u.section || '—').toUpperCase())}</div>
  <div>ACADEMIC YEAR : ${t.academicYear}<br>${sem.html || 'SEMESTER : ' + esc(sem.label)}</div></div>`;
const sub = u => `${esc(u.full_name || u.username)} &nbsp;•&nbsp; Bachelor of Science Information Technology &nbsp;•&nbsp; ${esc(u.section || 'Section —')}`;
let ME, TERM;

/* ---------- views ---------- */
const views = {
  async home() {
    const h = await api('/home'), u = ME, c = h.courses, first = (u.full_name || u.username).split(' ')[0];
    const D = { M: 'Monday', T: 'Tuesday', W: 'Wednesday', TH: 'Thursday', F: 'Friday', S: 'Saturday', SU: 'Sunday' };
    const days = s => (s.match(/TH|SU|M|T|W|F|S/g) || []).map(d => D[d]).join(' & ');
    const bg = ['#d9c9ff', '#ffe3b3', '#c4ecff', '#d2f2c5'];
    const cards = list => list.map((x, i) => `<div class="cc" style="background:${bg[i % 4]}"><h5>${esc(x.title)} - ${esc(x.code)}</h5>👤&#xFE0E; ${esc(x.instructor || 'TBA')}<br>▦ ${days(x.days)}<br>◷ ${esc(x.time_text)}<br>⌖ ${esc(x.room)}${i === 1 ? '<a href="#schedule">View all</a>' : ''}</div>`).join('') || '<p style="color:#fff">No enrolled subjects yet.</p>';
    shell(sideSec('home'), `<div class="homebar"><input id="q" placeholder="Search enrolled courses"><div class="ic"><a href="#announcements">💬&#xFE0E;</a><a href="#announcements">🔔&#xFE0E;</a><a href="#profile" class="av"></a></div></div>
    <div class="banner"><div><small>${new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</small><h2>Welcome back, ${esc(first)}</h2><small>Here’s a quick look at your classes and academic progress.</small></div><div class="term"><i>Current term</i><b>${TERM.semester} · S.Y. ${TERM.academicYear.replace('-', '–')}</b></div></div>
    <div class="mycourse"><div>My course<br><b>${esc(u.course || 'No course selected')}</b><br>${u.year_level ? ord(u.year_level) + ' Year · ' : ''}${TERM.semester} · S.Y. ${TERM.academicYear}</div><button id="cc">Change Course</button></div>
    <div class="hrow"><div class="hcol"><div class="stat">GPA<strong>${h.gpa ?? '—'}</strong>${h.gpa ? (h.gpa <= 3 ? 'Good standing' : 'Needs improvement') : 'No grades yet'}</div><div class="stat"><strong style="font-size:20px">Enrolled</strong>${c.length}<br>Subjects</div></div>
    <div class="en"><p>📖&#xFE0E; Enrolled Courses</p><div class="egrid" id="eg">${cards(c.slice(0, 4))}</div></div></div>`);
    $('#cc').onclick = () => location.hash = '#enrollment';
    $('#q').oninput = e => { const t = e.target.value.toLowerCase(); $('#eg').innerHTML = cards(c.filter(x => (x.title + x.code + (x.instructor || '')).toLowerCase().includes(t)).slice(0, t ? 20 : 4)); };
  },
  async grades() {
    const d = await api('/grades'), r = d.rows, units = r.reduce((a, x) => a + x.units, 0), graded = r.filter(x => x.grade != null);
    const avg = graded.length === r.length && r.length ? (graded.reduce((a, x) => a + x.grade * x.units, 0) / units).toFixed(2) : '';
    shell(sideNum('grades'), `<h1 class="pg">Grades</h1><div class="crumb">${sub(ME)}</div>
    <div style="display:flex;justify-content:space-between;font-size:11px"><span>Course grades released by your instructors, term by term.</span><select class="gsel"><option>1st Sem, A.Y. 2026-2027</option></select></div>
    <div class="gr-head"><div style="font-size:17px;min-width:90px">${avg}<br><span style="font-size:8px">Term weighted average</span></div><div><strong>${avg ? 'Complete' : 'In progress'}</strong>Standing</div><div><strong>${units}</strong>Units this term</div></div>
    <table class="gtab"><tr><th>Course</th><th>Instructors</th><th>Units</th><th>Grade</th></tr>${r.map(x => `<tr><td>${esc(x.code)}<br>${esc(x.title)}</td><td>${esc(x.instructor)}</td><td>${x.units}</td><td style="text-align:center">${x.grade != null ? Number(x.grade).toFixed(1) : '<span class="pend">Pending</span>'}</td></tr>`).join('') || '<tr><td colspan="4">No courses for this term yet.</td></tr>'}</table>`);
  },
  async announcements() {
    const rows = (await api('/announcements')).rows, by = s => rows.filter(x => x.slot === s);
    const tag = x => x.tag ? `<span class="tag" style="background:${x.tag_color}">${esc(x.tag)}</span><br>` : '';
    const card = x => `<div class="card">${tag(x)}<h4 class="${x.slot === 'side' ? '' : ''}">${esc(x.title)}</h4><p>${esc(x.body)}${x.author ? `<br><b>${esc(x.author)}</b>` : ''}</p><span class="aud">${esc(x.audience)}</span></div>`;
    shell(sideNum('announcements'), `<div class="ann"><div class="annL"><div class="feat"><h1>Announcements 📣&#xFE0E;</h1><div class="crumb" style="border:0">${sub(ME)}</div>
    ${by('feature').map(x => `<div class="frow"><time>${esc(x.date_label)}</time>${card(x)}</div>`).join('')}</div>
    ${by('wide').map(card).join('')}<div class="small2">${by('small').map(card).join('')}</div></div>
    <div class="annR">${by('side').map(x => `<div>${tag(x).replace('<br>', '')}${card({ ...x, tag: null })}</div>`).join('')}</div></div>`);
  },
  async schedule() {
    const r = (await api('/schedule')).rows, DN = ['M', 'T', 'W', 'TH', 'F', 'S', 'SU'], L = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];
    const tot = r.reduce((a, x) => a + x.units, 0), col = k => r.map(x => `<span>${k(x)}</span>`).join('');
    shell(sideSec('schedule'), `<h1 class="pg" style="font-size:21px">Class Schedule</h1><hr class="rule" style="margin-top:20px">${header(ME, TERM, { year: ord(ME.year_level) + ' YEAR', label: `${ord(ME.year_level)} Year – ${TERM.semester}` }).replace('border-bottom:1px solid #444', '')}<hr class="rule">
    <div class="sched"><div class="hd"><span>EDP CODE</span><span>SUBJECT</span><span>DESCRIPTIVE TITLE</span><span>SCHEDULE</span><span>ROOM</span><span>TYPE</span><span>UNITS</span></div>
    <div class="bd"><div>${col(x => x.edp_code)}</div><div>${col(x => esc(x.code))}</div><div>${r.map(x => `<span class="sm">${esc(x.title)}</span>`).join('')}</div><div>${col(x => x.days + ' ' + x.time_text)}</div><div>${col(x => x.room)}</div><div>${col(x => x.type)}</div><div>${col(x => x.units)}${r.length ? `<span style="border-top:1px solid #111">${tot}</span>` : ''}</div></div></div>
    <hr class="rule" style="margin-top:36px"><div class="dl">DETAILED SCHEDULE</div>
    <div class="dgrid"><div class="h">SUBJECT</div><div class="h wide">${L.map(l => `<span>${l}</span>`).join('')}</div>
    <div class="dcol s">${r.map(x => `<span>${esc(x.code)}</span>`).join('')}</div>
    ${DN.map(d => `<div class="dcol">${r.map(x => ((x.days.match(/TH|SU|M|T|W|F|S/g) || []).includes(d)) ? `<span class="t">${esc(x.time_text)}</span>` : '<span>VACANT</span>').join('')}</div>`).join('')}</div>`);
    document.querySelector('.dgrid').style.gridTemplateColumns = '1.1fr repeat(7,1fr)';
  },
  async records(q) {
    const y = Math.min(4, Math.max(1, +q.get('y') || 1)), s = +q.get('s') === 2 ? 2 : 1, rows = (await api(`/records?year=${y}&sem=${s}`)).rows;
    const sum = k => rows.reduce((a, x) => a + x[k], 0), semName = s === 1 ? 'First' : 'Second';
    const hd = header(ME, TERM, { year: ord(y) + ' YEAR', label: '', html: `SEMESTER : <select id="sel"><option value="1" ${s === 1 ? 'selected' : ''}>${ord(y)} year - First Semester</option><option value="2" ${s === 2 ? 'selected' : ''}>${ord(y)} year - Second Semester</option></select>` });
    shell(sideNum('records'), `<h1 class="pg">Academic Records</h1><div class="crumb">${sub(ME)}</div>${hd}
    <div class="tbl"><table><tr><th style="width:11%">GRADE</th><th style="width:15%">SUBJECT CIDE</th><th>DESCRIPTIVE TITLE</th><th>UNITS</th><th>LEC</th><th>LAB</th><th style="width:17%">PRE-REQUISITES</th></tr>
    ${rows.map(x => `<tr><td>${x.grade != null ? Number(x.grade).toFixed(1) : ''}</td><td>${esc(x.code)}</td><td class="l">${esc(x.title)}</td><td>${x.units}</td><td>${x.lec || ''}</td><td>${x.lab || ''}</td><td>${esc(x.prereq || '')}</td></tr>`).join('')}
    <tr><td></td><td>TOTAL</td><td></td><td>${sum('units')}</td><td>${sum('lec')}</td><td>${sum('lab') || ''}</td><td></td></tr></table></div>
    <div class="btns">${y > 1 ? `<a class="pill back" href="#records?y=${y - 1}&s=${s}" style="text-align:center">BACK</a>` : ''}<span class="sp"></span>${y < 4 ? `<a class="pill" href="#records?y=${y + 1}&s=${s}" style="text-align:center">${ord(y + 1).toUpperCase()} YEAR</a>` : ''}<a class="pill" href="#records?y=${y}&s=${s === 1 ? 2 : 1}" style="text-align:center">${s === 1 ? '2ND' : '1ST'} SEMESTER</a></div>`);
    $('#sel').onchange = e => location.hash = `#records?y=${y}&s=${e.target.value}`;
  },
  async enrollment() {
    const e = (await api('/enrollment')).enrollment || {}, u = ME, v = (k, d) => esc(e[k] ?? d ?? '');
    const dob = (e.dob || u.dob || '').toString().slice(0, 10), files = e.files || {};
    const rq = [['psa', 'PSA Birth Certificate'], ['form138', 'Form 138/ Report Card'], ['moral', 'Certificate of Good Moral Character'], ['idphoto', '2×2 ID Photo'], ['transfer', 'Certificate of Transfer <span style="color:#777">(Transferees Only)</span>']];
    const sel = (n, opts, cur) => `<select name="${n}">${opts.map(o => `<option ${o === cur ? 'selected' : ''}>${o}</option>`).join('')}</select>`;
    shell(sideNum('enrollment'), `<form class="enr" id="ef"><small>Enrollment Status${e.status ? ` · ${e.status === 'submitted' ? 'Submitted' : 'Draft saved'}` : ''}</small><h1>Student Enrollment</h1>
    <h3>Personal Information</h3><div class="eg">
    <label><span>Full Name :</span><input type="text" name="full_name" placeholder="Your Name" value="${v('full_name', u.full_name)}"></label>
    <label><span>Date of Birth :</span><input type="date" name="dob" id="dob" value="${dob}"></label>
    <label><span>Gender</span><label style="gap:6px"><input type="radio" name="gender" value="Male" ${(e.gender || u.gender) !== 'Female' ? 'checked' : ''}> Male</label><label style="gap:6px"><input type="radio" name="gender" value="Female" ${(e.gender || u.gender) === 'Female' ? 'checked' : ''}> Female</label></label>
    <label><span>Age :</span><input type="text" id="age" readonly style="max-width:50px" value="—"></label>
    <label class="full"><span>Home Address :</span><input type="text" name="address" placeholder="Street, Barangay, City" value="${v('address', u.address)}"></label>
    <label><span>Contact Number :</span><input type="text" name="contact" placeholder="09XX XXX XXXX" value="${v('contact', u.contact)}"></label>
    <label><span>Email Address:</span><input type="email" name="email" value="${v('email', u.email)}"></label></div>
    <h3 style="margin-top:34px">Guardian / Emergency Contact</h3><div class="eg"><label><span>Guardian Name:</span><input type="text" name="guardian_name" placeholder="Parent/Guardian" value="${v('guardian_name')}"></label>
    <label><span>Relationship:</span><input type="text" name="relationship" placeholder="eg. Mother" value="${v('relationship')}"></label>
    <label><span>Contact Number :</span><input type="text" name="guardian_contact" placeholder="09XX XXX XXXX" value="${v('guardian_contact')}"></label></div>
    <h3 style="margin-top:44px">Educational Background</h3><div class="eg"><label class="full"><span>Last School Attended:</span><input type="text" name="last_school" placeholder="Name of Previous School" value="${v('last_school')}"></label>
    <label><span>Year Level:</span>${sel('year_level', ['1st Year', '2nd Year', '3rd Year', '4th Year'], e.year_level || (u.year_level ? ord(u.year_level) + ' Year' : ''))}</label>
    <label><span>Course:</span>${sel('course', ['Bachelor of Science in Information Technology'], e.course || u.course)}</label>
    <label><span>Student Type:</span>${sel('student_type', ['New Student', 'Transferee', 'Returning Student'], e.student_type)}</label></div>
    <h3 style="margin-top:44px">Requirements</h3>${rq.map(([k, l]) => `<div class="rq"><span>${l}</span><span><span class="fn" id="fn-${k}" style="font-size:8px;margin-right:6px">${files[k] ? '✓ uploaded' : ''}</span><button type="button" class="up" data-f="${k}">Upload File</button><input type="file" name="${k}" id="in-${k}" accept=".pdf,.jpg,.jpeg,.png" hidden></span></div>`).join('')}
    <div class="cert"><input type="checkbox" id="certify" ${e.status === 'submitted' ? 'checked' : ''}><span>I certify that the information provided above is true and complete, and I agree to the school’s enrollment terms and policies.</span></div>
    <button type="button" class="sub" data-a="submit">Submit Enrollment</button><button type="button" class="dr" data-a="draft">Save as Draft</button></form>`);
    const age = () => { const d = new Date($('#dob').value); $('#age').value = isNaN(d) ? '—' : Math.floor((Date.now() - d) / 31557600000); };
    $('#dob').onchange = age; age();
    document.querySelectorAll('.up').forEach(b => b.onclick = () => $('#in-' + b.dataset.f).click());
    document.querySelectorAll('input[type=file]').forEach(i => i.onchange = () => $('#fn-' + i.name).textContent = i.files[0] ? i.files[0].name.slice(0, 22) : '');
    document.querySelectorAll('[data-a]').forEach(b => b.onclick = async () => {
      const fd = new FormData($('#ef')); fd.set('action', b.dataset.a); fd.set('certify', $('#certify').checked);
      try { const r = await api('/enrollment', { method: 'POST', body: fd }); toast(r.status === 'submitted' ? 'Enrollment submitted.' : 'Draft saved.', true); }
      catch (err) { toast(err.message); }
    });
  },
  profile() {
    const u = ME; const edit = false;
    shell(sideNum('profile', '<a href="#profile" class="on"><b>07</b>Profile Page</a>'), `<h1 class="serif" style="font-size:22px;font-weight:400;margin-bottom:6px">Profile</h1>
    <div class="pcard phead"><div class="avatar"></div><div><b>${esc((u.full_name || u.username).toUpperCase())}</b><small>BSIT ${u.year_level || '—'} · ${esc(u.section || 'Section —')}</small><small>🪪&#xFE0E; Student ID: ${esc(u.school_id)}</small></div><button class="eb" id="eb">✎ Edit Profile</button></div>
    <div class="pg2"><div class="pcard"><h3>Personal Information</h3><div id="pi"></div></div>
    <div class="pcard"><h3>Academic Information</h3>${[['🎓', 'Course', u.course ? 'BSIT' : '—'], ['📖', 'Your Level', u.year_level ? ord(u.year_level) + ' Year' : '—'], ['👥', 'Section', u.section || '—'], ['📅', 'Semester', u.semester || '—']].map(([i, k, val]) => `<div class="kv"><span class="i">${i}</span><span>${k}</span><b>${esc(val)}</b></div>`).join('')}</div></div>
    <div class="pcard acc"><h3>Account Information</h3><div><span>👤&#xFE0E;</span><span>Username</span><b>${esc(u.username)}</b></div><div><span>🔒&#xFE0E;</span><span>Password</span><b>••••••••</b></div></div>`);
    const draw = ed => { const f = [['👤', 'Full Name', 'full_name', u.full_name], ['📅', 'Age', null, u.age], ['✉', 'Email', 'email', u.email], ['☎', 'Contact No.', 'contact', u.contact], ['⌖', 'Address', 'address', u.address]];
      $('#pi').innerHTML = f.map(([i, k, n, val]) => `<div class="kv"><span class="i">${i}</span><span>${k}</span>${ed && n ? `<input name="${n}" value="${esc(val)}">` : `<b>${esc(val ?? '—')}</b>`}</div>`).join(''); };
    draw(false); let ed = false;
    $('#eb').onclick = async () => {
      if (!ed) { ed = true; draw(true); $('#eb').textContent = '✓ Save Profile'; return; }
      const body = {}; document.querySelectorAll('#pi input').forEach(i => body[i.name] = i.value);
      try { ME = (await api('/me', { method: 'PUT', body })).user; toast('Profile saved.', true); views.profile(); } catch (err) { toast(err.message); }
    };
  },
  settings() {
    const u = ME;
    shell(sideNum('settings'), `<h1 class="serif" style="font-size:24px;font-weight:400;border-bottom:1px solid #444;padding-bottom:6px">Settings</h1>
    <div class="sbar"><div class="t">BASIC INFORMATION</div><div style="display:flex;align-items:center;gap:14px;margin-top:2px"><div class="sav"></div><div style="flex:1;font-family:Rosarivo"><b style="font-size:11px">${esc(u.full_name || u.username)}</b><br><span style="font-size:7.5px">BACHELOR'S SCIENCE IN INFORMATION TECHNOLOGIES</span><br><br><span style="font-size:6.5px;font-weight:700">AGE:${u.age ?? '—'}<br>Student ID NO:${esc(u.school_id)}</span></div><a class="vp" href="#profile">View Profile</a></div></div>
    <div style="border-top:1px solid #444;margin-top:30px;padding-top:12px">${[['Privacy and Notifications', ''], ['Payment Methods', ''], ['Subjects', 'schedule'], ['Grades', 'grades'], ['Report', 'records']].map(([l, h]) => `<button class="srow" data-h="${h}">${l}</button>`).join('')}</div>`);
    document.querySelectorAll('.srow').forEach(b => b.onclick = () => b.dataset.h ? location.hash = '#' + b.dataset.h : toast(NA));
  }
};

async function route() {
  const [name, qs] = (location.hash.slice(1) || 'home').split('?');
  try { if (!ME) { const d = await api('/me'); ME = d.user; TERM = d.term; }
    await (views[name] || views.home)(new URLSearchParams(qs || '')); scrollTo(0, 0);
  } catch (e) { if (e.message !== 'auth') toast(e.message); }
}
addEventListener('hashchange', route); route();
