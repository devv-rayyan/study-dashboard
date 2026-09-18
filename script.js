/* ============================================================
   STUDY COMMAND CENTER — script.js
   All data lives in localStorage. No backend, no APIs.
   ============================================================ */
'use strict';

const LS_KEY = 'studyCC_v1';
const $ = id => document.getElementById(id);

/* ---------------- Default state ---------------- */
const DEFAULT_STATE = {
  name: 'Scholar',
  title: 'MISSION: NEET 2027',
  goal: 'NEET 2027',
  why: 'NEET 2027 → MBBS → Build my future.',
  logo: '',            // dataURL, empty = placeholder svg
  showLogo: true,
  neetDate: '2027-05-02',
  examThreshold: 5,
  clock12: false,
  events: [
    { id: 'ev1', name: 'EXAMS',     date: '2026-09-21', time: '09:00', desc: '',        icon: '📝', priority: 'high',   color: '#ff5b6a', showHome: true, pinned: false },
    { id: 'ev2', name: 'VACATION',  date: '2026-10-24', time: '00:00', desc: '',        icon: '🏖️', priority: 'medium', color: '#3ddc97', showHome: true, pinned: false },
    { id: 'ev3', name: 'PRE-BOARDS',date: '2026-11-21', time: '09:00', desc: '',        icon: '📚', priority: 'high',   color: '#ffb454', showHome: true, pinned: false },
    { id: 'ev4', name: 'JDST',      date: '2026-12-13', time: '09:00', desc: '',        icon: '🎯', priority: 'medium', color: '#5b8cff', showHome: true, pinned: false }
  ],
  tasks: [
    { id: 't1', text: 'Physics — Electrostatics MCQs',      subject: 'Physics',   duration: 60, done: false },
    { id: 't2', text: 'Chemistry — Aldehydes revision',     subject: 'Chemistry', duration: 45, done: false },
    { id: 't3', text: 'Biology — NCERT Human Reproduction', subject: 'Biology',   duration: 40, done: false },
    { id: 't4', text: '100 MCQs',                           subject: '',          duration: 90, done: false }
  ],
  quotes: [
    "Today's work becomes tomorrow's result.",
    'Start before you feel ready.',
    'One focused session.',
    "You don't need a perfect day. You need a productive one."
  ],
  subjects: ['Physics', 'Chemistry', 'Biology'],
  presets: [25, 50, 90],
  showSections: { hero: true, why: true, neet: true, events: true, tasks: true, timer: true, stats: true, quote: true },
  theme: 'dark',
  accent: '#5b8cff',
  fontScale: 1,
  transparency: 1,
  compact: false,
  animations: true,
  reducedMotion: false,
  stats: { streak: 0, lastStudyDate: '', mcqTotal: 0, chapters: 0, daily: {} }
};

/* ---------------- State load/save ---------------- */
let state;
try {
  const raw = localStorage.getItem(LS_KEY);
  state = raw ? Object.assign(JSON.parse(JSON.stringify(DEFAULT_STATE)), JSON.parse(raw)) : JSON.parse(JSON.stringify(DEFAULT_STATE));
} catch (e) { state = JSON.parse(JSON.stringify(DEFAULT_STATE)); }
// deep-merge safety for nested stats/showSections
state.stats = Object.assign({ streak: 0, lastStudyDate: '', mcqTotal: 0, chapters: 0, daily: {} }, state.stats);
state.showSections = Object.assign({}, DEFAULT_STATE.showSections, state.showSections);

function save() { localStorage.setItem(LS_KEY, JSON.stringify(state)); }
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

/* ---------------- Helpers ---------------- */
const MONTHS = ['JANUARY','FEBRUARY','MARCH','APRIL','MAY','JUNE','JULY','AUGUST','SEPTEMBER','OCTOBER','NOVEMBER','DECEMBER'];
function eventDate(ev) { return new Date(ev.date + 'T' + (ev.time || '00:00') + ':00'); }
function fmtDate(d) { return `${String(d.getDate()).padStart(2,'0')} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`; }
function fmtCountdown(ms) {
  if (ms <= 0) return null;
  const s = Math.floor(ms / 1000);
  const d = Math.floor(s / 86400), h = Math.floor((s % 86400) / 3600), m = Math.floor((s % 3600) / 60);
  return { d, h, m, s: s % 60 };
}
function todayKey(d = new Date()) { return d.toISOString().slice(0, 10); }
function yesterdayKey() { const d = new Date(); d.setDate(d.getDate() - 1); return todayKey(d); }
function fmtHM(sec) {
  const h = Math.floor(sec / 3600), m = Math.round((sec % 3600) / 60);
  return h ? `${h}h ${String(m).padStart(2,'0')}m` : `${m}m`;
}
function toast(msg) {
  const t = $('toast'); t.textContent = msg; t.classList.remove('hidden');
  clearTimeout(t._to); t._to = setTimeout(() => t.classList.add('hidden'), 2200);
}
function escapeHtml(s) { return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }

/* ---------------- Theme ---------------- */
function applyTheme() {
  document.documentElement.dataset.theme = state.theme === 'oled' ? 'oled' : state.theme;
  document.documentElement.style.setProperty('--accent', state.accent);
  document.documentElement.style.setProperty('--fs', state.fontScale);
  document.documentElement.style.setProperty('--transparency', state.transparency);
  document.body.classList.toggle('compact', state.compact);
  document.body.classList.toggle('no-anim', !state.animations);
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.content = state.theme === 'light' ? '#f2f4f9' : (state.theme === 'oled' ? '#000000' : '#0b0e14');
  $('logoImg').src = state.logo || 'assets/logo-placeholder.svg';
  $('logoImg').classList.toggle('hidden-logo', !state.showLogo);
}

/* ---------------- Header ---------------- */
function renderHeader() {
  $('dashTitle').textContent = state.title;
  $('helloName').textContent = state.name ? `Salam, ${state.name}.` : '';
  $('todayDate').textContent = new Date().toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
  $('whyText').textContent = state.why;
}
function tickClock() {
  const now = new Date();
  $('liveClock').textContent = now.toLocaleTimeString('en-GB', { hour12: state.clock12 });
}

/* ---------------- Countdowns ---------------- */
function upcomingEvents() {
  return state.events
    .slice()
    .sort((a, b) => {
      if (!!a.pinned !== !!b.pinned) return a.pinned ? -1 : 1;
      return eventDate(a) - eventDate(b);
    });
}
function renderCountdowns() {
  const now = Date.now();
  // Event cards
  const list = upcomingEvents().filter(e => e.showHome);
  $('eventsList').innerHTML = '';
  let firstUpcoming = null;
  list.forEach(ev => {
    const target = eventDate(ev).getTime();
    const cd = fmtCountdown(target - now);
    const isNext = !firstUpcoming && target > now;
    if (isNext) firstUpcoming = ev;
    const card = document.createElement('div');
    card.className = 'event-card' + (ev.pinned ? ' pinned' : '');
    card.style.setProperty('--ev-color', ev.color || state.accent);
    let middle;
    if (cd) {
      middle = `<div class="ev-count">
        <div class="ev-num"><b>${String(cd.d).padStart(2,'0')}</b><span>DAYS</span></div>
        <div class="ev-num"><b>${String(cd.h).padStart(2,'0')}</b><span>HRS</span></div>
        <div class="ev-num"><b>${String(cd.m).padStart(2,'0')}</b><span>MIN</span></div>
      </div>`;
    } else {
      const diffDays = Math.floor((now - target) / 86400000);
      middle = `<div class="ev-status">${diffDays === 0 ? '🎯 EVENT DAY' : '✅ COMPLETED'}</div>`;
    }
    card.innerHTML = `
      <div class="ev-head">
        <span class="ev-name">${ev.icon || ''} ${escapeHtml(ev.name)}</span>
        <span class="ev-prio">${isNext ? '<span class="next-tag">⚡ NEXT</span> ' : ''}${escapeHtml(ev.priority || '')}</span>
      </div>
      ${middle}
      <div class="ev-date">${fmtDate(eventDate(ev))}${ev.time && ev.time !== '00:00' ? ' · ' + ev.time : ''}</div>
      ${ev.desc ? `<div class="ev-desc">${escapeHtml(ev.desc)}</div>` : ''}`;
    $('eventsList').appendChild(card);
  });

  // Hero (next target)
  const hero = $('heroSection');
  if (firstUpcoming) {
    const cd = fmtCountdown(eventDate(firstUpcoming).getTime() - now);
    $('heroEventName').textContent = `${firstUpcoming.icon || ''} ${firstUpcoming.name}`;
    $('heroCountdown').textContent = cd ? `${String(cd.d).padStart(2,'0')} DAYS  ${String(cd.h).padStart(2,'0')} HRS  ${String(cd.m).padStart(2,'0')} MIN` : 'EVENT DAY';
    $('heroDate').textContent = fmtDate(eventDate(firstUpcoming));
  } else {
    $('heroEventName').textContent = '—';
    $('heroCountdown').textContent = 'ALL EVENTS COMPLETED';
    $('heroDate').textContent = '';
  }

  // Mode badge (Exam mode / Vacation mode)
  const badge = $('modeBadge');
  let badgeText = '';
  if (firstUpcoming) {
    const daysLeft = Math.floor((eventDate(firstUpcoming).getTime() - now) / 86400000);
    if (/exam|board|test|jdst/i.test(firstUpcoming.name) && daysLeft <= state.examThreshold && daysLeft >= 0) {
      badgeText = `⚠️ EXAM MODE — ${daysLeft} DAY${daysLeft === 1 ? '' : 'S'} LEFT`;
    }
  }
  const vac = state.events.find(e => /vacation/i.test(e.name));
  if (vac) {
    const vd = eventDate(vac), start = new Date(vd); start.setHours(0,0,0,0);
    const end = new Date(vd); end.setHours(23,59,59,999);
    const nowD = new Date();
    if (nowD >= start && nowD <= end) badgeText = '🏖️ VACATION MODE — study anyway if you want';
  }
  badge.textContent = badgeText;
  badge.classList.toggle('hidden', !badgeText);

  // NEET card
  const nd = new Date(state.neetDate + 'T00:00:00');
  const cd = fmtCountdown(nd.getTime() - now);
  $('neetDays').textContent = cd ? cd.d : '—';
  $('neetSub').textContent = cd ? `${String(cd.h).padStart(2,'0')} HRS ${String(cd.m).padStart(2,'0')} MIN · ${state.goal || 'NEET'}` : (now > nd.getTime() ? 'EXAM DAY / COMPLETED' : 'Set date in Settings');
}

/* ---------------- Tasks ---------------- */
function renderTasks() {
  const ul = $('taskList'); ul.innerHTML = '';
  state.tasks.forEach((t, i) => {
    const li = document.createElement('li');
    li.className = 'task-item' + (t.done ? ' done' : '');
    li.draggable = true; li.dataset.id = t.id;
    li.innerHTML = `
      <button class="task-check" aria-label="Mark complete" data-act="toggle">✓</button>
      <div class="task-body">
        <div class="task-text">${escapeHtml(t.text)}</div>
        <div class="task-meta">${[t.subject, t.duration ? ('≈' + t.duration + ' min') : ''].filter(Boolean).map(escapeHtml).join(' · ')}</div>
      </div>
      <button class="task-del" data-act="del" aria-label="Delete task">✕</button>`;
    ul.appendChild(li);
  });
  updateProgress();
  renderTaskSelects();
}
function updateProgress() {
  const total = state.tasks.length, done = state.tasks.filter(t => t.done).length;
  const pct = total ? Math.round(done / total * 100) : 0;
  $('progressPct').textContent = pct + '%';
  $('progressFill').style.width = pct + '%';
}
function renderTaskSelects() {
  const opts = ['<option value="">— No task —</option>'].concat(
    state.tasks.map(t => `<option value="${t.id}">${escapeHtml(t.text)}</option>`)
  ).join('');
  $('timerTaskSelect').innerHTML = opts;
  if (timer.taskId) $('timerTaskSelect').value = timer.taskId;
  $('setTaskSubject').innerHTML = ['<option value="">Subject…</option>']
    .concat(state.subjects.map(s => `<option>${escapeHtml(s)}</option>`)).join('');
}

/* Task drag & drop reorder */
let dragId = null;
document.addEventListener('dragstart', e => {
  const it = e.target.closest('.task-item'); if (!it) return;
  dragId = it.dataset.id; it.classList.add('dragging');
});
document.addEventListener('dragend', e => {
  const it = e.target.closest('.task-item'); if (it) it.classList.remove('dragging');
});
document.addEventListener('dragover', e => {
  const ul = e.target.closest('.task-list'); if (!ul || !dragId) return;
  e.preventDefault();
  const after = [...ul.querySelectorAll('.task-item:not(.dragging)')].find(el => e.clientY < el.getBoundingClientRect().top + el.offsetHeight / 2);
  const dragEl = document.querySelector('.task-item.dragging');
  if (dragEl) ul.insertBefore(dragEl, after || null);
});
document.addEventListener('drop', e => {
  if (!dragId) return;
  const order = [...document.querySelectorAll('#taskList .task-item')].map(el => el.dataset.id);
  state.tasks.sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id));
  save(); dragId = null; renderTasks();
});

$('taskList').addEventListener('click', e => {
  const btn = e.target.closest('[data-act]'); if (!btn) return;
  const id = btn.closest('.task-item').dataset.id;
  const t = state.tasks.find(x => x.id === id); if (!t) return;
  if (btn.dataset.act === 'toggle') {
    t.done = !t.done;
    if (t.done) { const d = ensureDaily(); d.tasksDone = state.tasks.filter(x => x.done).length; }
    save(); renderTasks(); renderStats();
  } else if (btn.dataset.act === 'del') {
    state.tasks = state.tasks.filter(x => x.id !== id);
    if (timer.taskId === id) timer.taskId = '';
    save(); renderTasks(); renderStats();
  }
});
function addTask(text, subject, duration) {
  text = (text || '').trim(); if (!text) return;
  state.tasks.push({ id: uid(), text, subject: subject || '', duration: duration || 0, done: false });
  save(); renderTasks();
}
$('quickTaskBtn').addEventListener('click', () => { addTask($('quickTaskInput').value); $('quickTaskInput').value = ''; });
$('quickTaskInput').addEventListener('keydown', e => { if (e.key === 'Enter') { addTask(e.target.value); e.target.value = ''; } });

/* ---------------- Deep work timer ---------------- */
const timer = {
  total: 25 * 60, remaining: 25 * 60, running: false, interval: null,
  taskId: '', banked: 0, focusActive: false
};
function timerMode() { return $('timerDisplay').classList.contains('running'); }
function fmtTimer(sec) { return `${String(Math.floor(sec / 60)).padStart(2,'0')}:${String(sec % 60).padStart(2,'0')}`; }
function renderTimer() {
  $('timerDisplay').textContent = fmtTimer(timer.remaining);
  $('focusTime').textContent = fmtTimer(timer.remaining);
  $('timerDisplay').classList.toggle('running', timer.running);
}
function renderPresets() {
  const cur = Math.round(timer.total / 60);
  $('timerPresets').innerHTML = state.presets.map(p =>
    `<button class="preset-btn${p === cur ? ' active' : ''}" data-p="${p}">${p} min</button>`).join('');
}
$('timerPresets').addEventListener('click', e => {
  const b = e.target.closest('.preset-btn'); if (!b) return;
  stopTimer(); timer.total = timer.remaining = (+b.dataset.p) * 60; renderPresets(); renderTimer();
});
$('customMin').addEventListener('change', e => {
  const v = Math.min(600, Math.max(1, +e.target.value || 0)); if (!v) return;
  stopTimer(); timer.total = timer.remaining = v * 60; renderPresets(); renderTimer();
});
$('timerTaskSelect').addEventListener('change', e => { timer.taskId = e.target.value; updateTimerLabel(); });
function updateTimerLabel() {
  const t = state.tasks.find(x => x.id === timer.taskId);
  $('timerTaskLabel').textContent = t ? `Linked: ${t.text}` : 'No task selected';
  $('focusTaskName').textContent = t ? t.text : 'Free study session';
}
function startTimer() {
  if (timer.running) return;
  if (timer.remaining <= 0) timer.remaining = timer.total;
  timer.running = true;
  timer.interval = setInterval(() => {
    timer.remaining--;
    if (timer.remaining <= 0) {
      stopTimer(); timer.remaining = 0;
      bankTime();
      toast('⏰ Session complete. Well done.');
      try { navigator.vibrate && navigator.vibrate([200, 100, 200]); } catch (e) {}
    }
    renderTimer();
  }, 1000);
  timer.focusActive = true;
  $('focusOverlay').classList.remove('hidden');
  updateTimerLabel(); renderTimer();
}
function stopTimer() {
  timer.running = false; clearInterval(timer.interval);
}
function pauseTimer() { stopTimer(); renderTimer(); }
function resetTimer() {
  if (timer.running && timer.total - timer.remaining > 30) bankTime();
  stopTimer(); timer.remaining = timer.total; renderTimer();
}
function bankTime() {
  const secs = timer.total - timer.remaining;
  if (secs <= 0) return;
  const d = ensureDaily();
  d.focusSec += secs;
  // streak
  const tk = todayKey();
  if (state.stats.lastStudyDate !== tk) {
    state.stats.streak = (state.stats.lastStudyDate === yesterdayKey()) ? state.stats.streak + 1 : 1;
    state.stats.lastStudyDate = tk;
  }
  save(); renderStats();
}
$('timerStart').addEventListener('click', startTimer);
$('timerPause').addEventListener('click', pauseTimer);
$('timerReset').addEventListener('click', resetTimer);
$('focusExit').addEventListener('click', () => {
  if (timer.running && timer.total - timer.remaining > 30) bankTime();
  pauseTimer();
  timer.focusActive = false;
  $('focusOverlay').classList.add('hidden');
});

/* ---------------- Start Studying flow ---------------- */
$('startStudyingBtn').addEventListener('click', () => {
  const pending = state.tasks.filter(t => !t.done);
  const box = $('studyTaskList');
  if (!pending.length) {
    box.innerHTML = '<p style="color:var(--text-dim);padding:1rem 0">No pending tasks. Add one below — or just start a free session.</p>' +
      '<button class="btn btn-accent wide" id="freeSessionBtn">FREE SESSION</button>';
    $('freeSessionBtn').onclick = () => { closeModal('studyModal'); startTimer(); };
  } else {
    box.innerHTML = '';
    pending.forEach(t => {
      const b = document.createElement('button');
      b.className = 'btn wide'; b.style.textAlign = 'left';
      b.textContent = `${t.subject ? '[' + t.subject + '] ' : ''}${t.text}`;
      b.onclick = () => {
        timer.taskId = t.id; $('timerTaskSelect').value = t.id;
        closeModal('studyModal'); startTimer();
      };
      box.appendChild(b);
    });
  }
  openModal('studyModal');
});
$('studyClose').addEventListener('click', () => closeModal('studyModal'));

/* ---------------- Stats ---------------- */
function ensureDaily(key = todayKey()) {
  if (!state.stats.daily[key]) state.stats.daily[key] = { focusSec: 0, tasksDone: 0 };
  return state.stats.daily[key];
}
function renderStats() {
  const d = ensureDaily();
  d.tasksDone = state.tasks.filter(t => t.done).length;
  $('statFocus').textContent = fmtHM(d.focusSec);
  $('statTasks').textContent = `${d.tasksDone}/${state.tasks.length}`;
  $('statStreak').textContent = state.stats.streak + (state.stats.streak === 1 ? ' DAY' : ' DAYS');
  let week = 0;
  for (let i = 0; i < 7; i++) { const dt = new Date(); dt.setDate(dt.getDate() - i); week += (state.stats.daily[todayKey(dt)] || {}).focusSec || 0; }
  $('statWeekly').textContent = fmtHM(week);
  $('statMcq').textContent = state.stats.mcqTotal;
  $('statChapters').textContent = state.stats.chapters;
}
$('mcqBtn').addEventListener('click', () => {
  const n = +$('mcqInput').value; if (!n || n < 1) return;
  state.stats.mcqTotal += n; $('mcqInput').value = '';
  save(); renderStats(); toast(`+${n} MCQs logged`);
});
$('chapterBtn').addEventListener('click', () => {
  state.stats.chapters++; save(); renderStats(); toast('Chapter completed 🎉');
});

/* ---------------- Quotes ---------------- */
let quoteIdx = Math.floor(Math.random() * 100);
function rotateQuote() {
  if (!state.quotes.length) { $('quoteText').textContent = ''; return; }
  $('quoteText').textContent = '“' + state.quotes[quoteIdx % state.quotes.length] + '”';
  quoteIdx++;
}
setInterval(rotateQuote, 20000);

/* ---------------- Sections visibility ---------------- */
function renderSections() {
  const map = { hero: 'heroSection', why: 'whySection', neet: 'neetSection', events: 'eventsSection', tasks: 'tasksSection', timer: 'timerSection', stats: 'statsSection', quote: 'quoteSection' };
  for (const k in map) $(map[k]).style.display = state.showSections[k] ? '' : 'none';
}

/* ---------------- Settings ---------------- */
function openModal(id) { $(id).classList.remove('hidden'); }
function closeModal(id) { $(id).classList.add('hidden'); }
$('settingsBtn').addEventListener('click', openSettings);
$('settingsClose').addEventListener('click', () => closeModal('settingsModal'));
document.querySelectorAll('.modal').forEach(m => m.addEventListener('click', e => { if (e.target === m) m.classList.add('hidden'); }));
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') document.querySelectorAll('.modal:not(.hidden), #focusOverlay:not(.hidden)').forEach(m => { if (m.id === 'focusOverlay') $('focusExit').click(); else m.classList.add('hidden'); });
});

document.querySelectorAll('.tab').forEach(t => t.addEventListener('click', () => {
  document.querySelectorAll('.tab').forEach(x => x.classList.toggle('active', x === t));
  document.querySelectorAll('.tab-panel').forEach(p => p.classList.toggle('hidden', p.id !== 'tab-' + t.dataset.tab));
}));

function openSettings() {
  // General
  $('setName').value = state.name; $('setTitle').value = state.title;
  $('setGoal').value = state.goal; $('setWhy').value = state.why;
  $('setNeetDate').value = state.neetDate;
  $('setShowLogo').checked = state.showLogo;
  $('setExamThreshold').value = state.examThreshold;
  $('setClock12').checked = state.clock12;
  // Section toggles
  $('sectionToggles').innerHTML = Object.keys(state.showSections).map(k =>
    `<label class="fld check"><input type="checkbox" data-sec="${k}" ${state.showSections[k] ? 'checked' : ''}><span style="text-transform:capitalize">${k}</span></label>`).join('');
  renderSubjects(); renderEventEditor(); renderSettingsTasks(); renderQuotesEditor(); renderPresetsEditor();
  // Appearance
  $('setTheme').value = state.theme; $('setAccent').value = state.accent;
  $('setFont').value = state.fontScale; $('setTransparency').value = state.transparency;
  $('setCompact').checked = state.compact; $('setAnimations').checked = state.animations;
  $('setReducedMotion').checked = state.reducedMotion;
  openModal('settingsModal');
}

/* General settings bindings */
[['setName','name'],['setTitle','title'],['setGoal','goal'],['setWhy','why'],['setNeetDate','neetDate'],['setExamThreshold','examThreshold']].forEach(([id, key]) => {
  $(id).addEventListener('input', e => { state[key] = e.target.value; save(); renderHeader(); });
});
$('setShowLogo').addEventListener('change', e => { state.showLogo = e.target.checked; save(); applyTheme(); });
$('setClock12').addEventListener('change', e => { state.clock12 = e.target.checked; save(); tickClock(); });
$('setLogo').addEventListener('change', e => {
  const f = e.target.files[0]; if (!f) return;
  const r = new FileReader();
  r.onload = () => { state.logo = r.result; save(); applyTheme(); toast('Logo updated'); };
  r.readAsDataURL(f);
});
$('sectionToggles').addEventListener('change', e => {
  if (e.target.dataset.sec) { state.showSections[e.target.dataset.sec] = e.target.checked; save(); renderSections(); }
});

/* Subjects */
function renderSubjects() {
  $('subjectList').innerHTML = state.subjects.map((s, i) =>
    `<span class="chip">${escapeHtml(s)}<button data-i="${i}" aria-label="Remove subject">✕</button></span>`).join('');
}
$('addSubjectBtn').addEventListener('click', () => {
  const v = $('newSubject').value.trim(); if (!v) return;
  state.subjects.push(v); $('newSubject').value = ''; save(); renderSubjects(); renderTaskSelects();
});
$('subjectList').addEventListener('click', e => {
  const b = e.target.closest('button[data-i]'); if (!b) return;
  state.subjects.splice(+b.dataset.i, 1); save(); renderSubjects(); renderTaskSelects();
});

/* Event editor */
function renderEventEditor() {
  const box = $('eventEditor');
  box.innerHTML = state.events.map((ev, i) => `
    <div class="ev-edit" data-id="${ev.id}">
      <div class="grid2">
        <input type="text" data-f="name" value="${escapeHtml(ev.name)}" placeholder="Event name" aria-label="Event name">
        <input type="text" data-f="icon" value="${escapeHtml(ev.icon)}" placeholder="Icon" aria-label="Event icon" style="max-width:70px">
      </div>
      <div class="grid2" style="margin-top:.5rem">
        <input type="date" data-f="date" value="${ev.date}" aria-label="Event date">
        <input type="time" data-f="time" value="${ev.time || '00:00'}" aria-label="Event time">
      </div>
      <input type="text" data-f="desc" value="${escapeHtml(ev.desc)}" placeholder="Description (optional)" aria-label="Event description" style="margin-top:.5rem">
      <div class="ev-edit-row">
        <select data-f="priority" aria-label="Priority">
          ${['low','medium','high'].map(p => `<option ${p === ev.priority ? 'selected' : ''}>${p}</option>`).join('')}
        </select>
        <input type="color" data-f="color" value="${ev.color || '#5b8cff'}" aria-label="Event color">
        <label><input type="checkbox" data-f="showHome" ${ev.showHome ? 'checked' : ''}> Home</label>
        <label><input type="checkbox" data-f="pinned" ${ev.pinned ? 'checked' : ''}> 📌 Pin</label>
      </div>
      <div class="ev-edit-row">
        <button class="mini-btn" data-act="up" ${i === 0 ? 'disabled' : ''}>↑</button>
        <button class="mini-btn" data-act="down" ${i === state.events.length - 1 ? 'disabled' : ''}>↓</button>
        <button class="mini-btn" data-act="del" style="color:var(--danger)">Delete</button>
      </div>
    </div>`).join('');
}
$('eventEditor').addEventListener('input', e => {
  const ed = e.target.closest('.ev-edit'); if (!ed) return;
  const ev = state.events.find(x => x.id === ed.dataset.id); if (!ev) return;
  const f = e.target.dataset.f; if (!f) return;
  ev[f] = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
  save(); renderCountdowns();
});
$('eventEditor').addEventListener('click', e => {
  const b = e.target.closest('button[data-act]'); if (!b) return;
  const ed = b.closest('.ev-edit');
  const i = state.events.findIndex(x => x.id === ed.dataset.id);
  if (i < 0) return;
  if (b.dataset.act === 'del') { state.events.splice(i, 1); }
  if (b.dataset.act === 'up' && i > 0) { [state.events[i-1], state.events[i]] = [state.events[i], state.events[i-1]]; }
  if (b.dataset.act === 'down' && i < state.events.length - 1) { [state.events[i+1], state.events[i]] = [state.events[i], state.events[i+1]]; }
  save(); renderEventEditor(); renderCountdowns();
});
$('addEventBtn').addEventListener('click', () => {
  state.events.push({ id: uid(), name: 'NEW EVENT', date: todayKey(), time: '09:00', desc: '', icon: '📌', priority: 'medium', color: state.accent, showHome: true, pinned: false });
  save(); renderEventEditor(); renderCountdowns();
});

/* Settings > tasks tab */
function renderSettingsTasks() {
  $('settingsTaskList').innerHTML = state.tasks.map(t => `
    <li class="task-item${t.done ? ' done' : ''}" data-id="${t.id}">
      <span class="task-body"><span class="task-text">${escapeHtml(t.text)}</span>
      <span class="task-meta">${escapeHtml(t.subject || '')}${t.duration ? ' · ≈' + t.duration + ' min' : ''}</span></span>
      <button class="task-del" data-act="s-del" aria-label="Delete">✕</button>
    </li>`).join('');
}
$('setTaskAdd').addEventListener('click', () => {
  addTask($('setTaskInput').value, $('setTaskSubject').value, +$('setTaskDur').value || 0);
  $('setTaskInput').value = ''; $('setTaskDur').value = '';
  renderSettingsTasks();
});
$('settingsTaskList').addEventListener('click', e => {
  const b = e.target.closest('[data-act="s-del"]'); if (!b) return;
  const id = b.closest('.task-item').dataset.id;
  state.tasks = state.tasks.filter(t => t.id !== id);
  save(); renderTasks(); renderSettingsTasks(); renderStats();
});
function renderPresetsEditor() {
  $('presetEditor').innerHTML = state.presets.map((p, i) =>
    `<span class="chip">${p} min<button data-i="${i}" aria-label="Remove preset">✕</button></span>`).join('') +
    `<div class="row-add"><input id="newPreset" type="number" min="1" max="600" placeholder="Minutes…"><button id="addPresetBtn" class="btn">+</button></div>`;
}
$('presetEditor').addEventListener('click', e => {
  if (e.target.id === 'addPresetBtn') {
    const v = +$('newPreset').value; if (v >= 1 && v <= 600) { state.presets.push(v); state.presets.sort((a,b)=>a-b); save(); renderPresetsEditor(); renderPresets(); }
  }
  const b = e.target.closest('button[data-i]');
  if (b && state.presets.length > 1) { state.presets.splice(+b.dataset.i, 1); save(); renderPresetsEditor(); renderPresets(); }
});

/* Quotes editor */
function renderQuotesEditor() {
  $('quoteList').innerHTML = state.quotes.map((q, i) =>
    `<li><span>“${escapeHtml(q)}”</span><button class="task-del" data-i="${i}" aria-label="Delete quote">✕</button></li>`).join('');
}
$('addQuoteBtn').addEventListener('click', () => {
  const v = $('newQuote').value.trim(); if (!v) return;
  state.quotes.push(v); $('newQuote').value = ''; save(); renderQuotesEditor(); rotateQuote();
});
$('quoteList').addEventListener('click', e => {
  const b = e.target.closest('button[data-i]'); if (!b) return;
  state.quotes.splice(+b.dataset.i, 1); save(); renderQuotesEditor(); rotateQuote();
});

/* Appearance bindings */
$('setTheme').addEventListener('change', e => { state.theme = e.target.value; save(); applyTheme(); });
$('setAccent').addEventListener('input', e => { state.accent = e.target.value; save(); applyTheme(); });
$('setFont').addEventListener('input', e => { state.fontScale = +e.target.value; save(); applyTheme(); });
$('setTransparency').addEventListener('input', e => { state.transparency = +e.target.value; save(); applyTheme(); });
$('setCompact').addEventListener('change', e => { state.compact = e.target.checked; save(); applyTheme(); });
$('setAnimations').addEventListener('change', e => { state.animations = e.target.checked; save(); applyTheme(); });
$('setReducedMotion').addEventListener('change', e => {
  state.reducedMotion = e.target.checked; save();
  document.body.classList.toggle('no-anim', state.reducedMotion || !state.animations);
});

/* ---------------- Data: export / import / reset ---------------- */
$('exportBtn').addEventListener('click', () => {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'study-command-center-backup-' + todayKey() + '.json';
  a.click(); URL.revokeObjectURL(a.href);
  toast('Backup downloaded');
});
$('importFile').addEventListener('change', e => {
  const f = e.target.files[0]; if (!f) return;
  const r = new FileReader();
  r.onload = () => {
    try {
      const data = JSON.parse(r.result);
      if (!data || !Array.isArray(data.events)) throw new Error('bad file');
      state = Object.assign(JSON.parse(JSON.stringify(DEFAULT_STATE)), data);
      save(); applyTheme(); renderAll(); closeModal('settingsModal');
      toast('Data imported successfully');
    } catch (err) { toast('Invalid backup file'); }
  };
  r.readAsText(f); e.target.value = '';
});
$('resetBtn').addEventListener('click', () => {
  if (!confirm('Reset ALL data? This will erase events, tasks, stats and settings. This cannot be undone.')) return;
  localStorage.removeItem(LS_KEY);
  state = JSON.parse(JSON.stringify(DEFAULT_STATE));
  applyTheme(); renderAll(); closeModal('settingsModal');
  toast('All data reset');
});

/* ---------------- PWA ---------------- */
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./service-worker.js').catch(() => {});
  });
}

/* ---------------- Init ---------------- */
function renderAll() {
  applyTheme(); renderHeader(); tickClock(); renderSections();
  renderCountdowns(); renderTasks(); renderStats(); rotateQuote();
  renderPresets(); renderTimer(); updateTimerLabel();
}
setInterval(tickClock, 1000);
setInterval(renderCountdowns, 1000);
renderAll();
