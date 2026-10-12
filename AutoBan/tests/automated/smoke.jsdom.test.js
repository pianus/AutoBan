// AutoBan smoke test (jsdom): migration, outline editing, issue mirroring, drag/drop, month view,
// v1.1 package across weeks, grouping styles, hide done, collapse issues, drag auto-scroll.
const { JSDOM } = require('jsdom');
const fs = require('fs'), path = require('path'), assert = require('assert');
const html = fs.readFileSync(path.join(__dirname, '../../src/autoban.html'), 'utf8');
const monday = (() => { const d = new Date(); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); })();
const isoOf = d => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
const shift = (s, n) => { const p = s.split('-'); return isoOf(new Date(+p[0], +p[1] - 1, +p[2] + n)); };
const lastMonday = shift(monday, -7);
const legacy = { ['tracker:week:' + monday]: JSON.stringify({ tasks: [
  { id: 'p1', title: 'Parent', parent: null, days: [0], done: false },
  { id: 'c1', title: 'Child', parent: 'p1', days: [2], done: false }] }),
  ['tracker:week:' + lastMonday]: JSON.stringify({ tasks: [
  { id: 'o1', title: 'Old task', parent: null, days: [1], done: false },
  { id: 'o2', title: 'Old sub', parent: 'o1', days: [], done: false }] }) };
const dom = new JSDOM(html, { runScripts: 'dangerously', url: 'https://autoban.test/', pretendToBeVisual: true, beforeParse(w) {
  w.confirm = () => true; for (const k in legacy) w.localStorage.setItem(k, legacy[k]);
  w.indexedDB = { open() { const r = {}; setTimeout(() => r.onerror && r.onerror(), 0); return r; } };
  w.document.hasFocus = () => true; } });
const w = dom.window, d = w.document, errs = []; w.addEventListener('error', e => errs.push(e.message));
const sleep = ms => new Promise(r => setTimeout(r, ms));
const key = (k, shift) => d.activeElement.dispatchEvent(new w.KeyboardEvent('keydown', { key: k, shiftKey: !!shift, bubbles: true }));
const type = t => { const ta = d.activeElement; ta.value = t; ta.dispatchEvent(new w.Event('input', { bubbles: true })); };
const blur = () => d.activeElement.dispatchEvent(new w.Event('blur'));
function drag(src, target) { const st = {}; const dt = { setData: (k, v) => st[k] = v, getData: k => st[k] || '', effectAllowed: '', types: [] };
  const ds = new w.Event('dragstart', { bubbles: true }); ds.dataTransfer = dt; src.dispatchEvent(ds);
  const ev = new w.MouseEvent('drop', { bubbles: true, clientY: 0 }); Object.defineProperty(ev, 'dataTransfer', { value: dt }); target.dispatchEvent(ev); }
const pkgRows = () => [...d.querySelectorAll('#package .task')].map(r => (r.style.marginLeft || '0') + ':' + (r.querySelector('.tt') || {}).textContent);
const pass = m => console.log('PASS', m);
const pkgRow = t => [...d.querySelectorAll('#package .task')].find(r => (r.querySelector('.tt') || {}).textContent === t);
const cache = () => JSON.parse(w.localStorage.getItem('wp:cache'));
(async () => {
  await sleep(150);
  assert.deepStrictEqual(pkgRows(), ['0:Old task', '13px:Old sub', '0:Parent', '13px:Child']); pass('legacy parent/day data migrates to levels');
  pass('package lists tasks from every week, not only the current one');
  assert.ok(/of 4 tasks/.test(d.getElementById('tally').textContent)); pass('tally counts tasks from every week');
  d.getElementById('newIssue').click(); await sleep(10); type('Arcing at 30 kV');
  d.querySelectorAll('.sec-add')[2].click(); await sleep(10);
  type('Check coating'); key('Enter'); await sleep(10); type('Measure resistivity'); key('Tab'); await sleep(10); blur(); await sleep(20);
  assert.ok(pkgRows().includes('0:Arcing at 30 kV') && pkgRows().includes('26px:Measure resistivity')); pass('issue mirrored into package with nested actions');
  const parentRow = [...d.querySelectorAll('#package .task')].find(r => (r.querySelector('.tt') || {}).textContent === 'Parent');
  drag(parentRow, d.querySelector('#package .ihdr')); await sleep(10);
  assert.ok(pkgRows().indexOf('13px:Parent') > pkgRows().indexOf('0:Arcing at 30 kV')); pass('task with subtree filed onto issue header');
  const act = [...d.querySelectorAll('#issues .sec .task')].find(r => r.querySelector('.tt').textContent === 'Check coating');
  drag(act, d.querySelectorAll('.day')[3]); await sleep(10);
  assert.strictEqual(d.querySelectorAll('.day')[3].querySelectorAll('.task').length, 1); pass('action scheduled by drop on day');
  drag(d.querySelectorAll('.day')[3].querySelector('.task'), d.getElementById('package')); await sleep(10);
  assert.strictEqual(d.querySelectorAll('.day')[3].querySelectorAll('.task').length, 0); pass('day item unscheduled by drop on package');
  d.getElementById('tabMonth').click(); await sleep(10);
  assert.ok(d.getElementById('weekBoard').hidden && !d.getElementById('monthBoard').hidden); pass('month tab switches view');
  const cells = () => [...d.querySelectorAll('.cal-cell')];
  const rowOf = t => [...d.querySelectorAll('#mlist .task')].find(r => (r.querySelector('.tt') || {}).textContent === t);
  drag(rowOf('Check coating'), cells()[9]); await sleep(10);
  assert.strictEqual(cells()[9].querySelectorAll('.task').length, 1); pass('list -> calendar date schedules');
  drag(cells()[9].querySelector('.task'), cells()[10]); await sleep(10);
  assert.ok(cells()[9].querySelectorAll('.task').length === 0 && cells()[10].querySelectorAll('.task').length === 1); pass('date -> date moves');
  assert.ok(/AutoBan v1\.\d+\.\d+/.test(d.querySelector('.appver').textContent)); pass('version badge present');

  // ---- v1.1 ----
  d.getElementById('tabWeek').click(); await sleep(10);
  // grouping styles
  const pkg = d.getElementById('package');
  assert.ok(pkg.classList.contains('gs-line') && !pkg.classList.contains('gs-rail')); pass('default grouping style is the separator line');
  assert.ok(!pkgRow('Old task').classList.contains('t1sep') && d.querySelector('#package .ihdr').classList.contains('t1sep')); pass('separator above every top-level row but the first');
  assert.ok(pkgRow('Old sub').classList.contains('inrail') && pkgRow('Old sub').style.getPropertyValue('--ind') === '13px'); pass('sub-tasks marked for the group rail');
  const gb = d.getElementById('groupBtn'), styles = [];
  for (let i = 0; i < 4; i++) { gb.click(); await sleep(5); styles.push(gb.textContent + '|' + pkg.className); }
  assert.deepStrictEqual(styles, ['Groups: rail|package gs-rail', 'Groups: line + rail|package gs-line gs-rail', 'Groups: off|package', 'Groups: line|package gs-line']);
  pass('groups button cycles rail, both, off, line');
  // hide completed top-level tasks
  pkgRow('Old task').querySelector('.box').click(); await sleep(10);
  d.getElementById('hideDoneTop').click(); await sleep(10);
  assert.ok(!pkgRow('Old task') && !pkgRow('Old sub')); pass('hide done hides completed top-level tasks with their sub-tasks');
  assert.ok(/1 completed task hidden/.test(d.getElementById('hiddenDoneNote').textContent)); pass('hidden count shown');
  await sleep(300); assert.strictEqual(cache().settings.hideDoneTop, true); pass('hide done setting saved');
  d.getElementById('hideDoneTop').click(); await sleep(10);
  assert.ok(pkgRow('Old task') && pkgRow('Old sub')); pass('hide done toggles back');
  // collapse issues
  d.getElementById('newIssue').click(); await sleep(10); type('Second issue'); blur(); await sleep(10);
  const ca = d.getElementById('collapseIss');
  assert.strictEqual(ca.textContent, 'Collapse all'); ca.click(); await sleep(10);
  assert.strictEqual(d.querySelectorAll('#issues .sec').length, 0); assert.strictEqual(d.querySelectorAll('#issues .stages').length, 0);
  assert.strictEqual(d.querySelectorAll('#issues .issue.closed').length, 2); pass('collapse all leaves only issue title rows');
  assert.strictEqual(ca.textContent, 'Expand all');
  d.querySelector('#issues .issue .chev').click(); await sleep(10);
  assert.strictEqual(d.querySelectorAll('#issues .issue.closed').length, 1); pass('per-issue chevron expands one issue');
  ca.click(); await sleep(10); assert.strictEqual(d.querySelectorAll('#issues .issue.closed').length, 2);
  ca.click(); await sleep(10); assert.strictEqual(d.querySelectorAll('#issues .issue.closed').length, 0); pass('collapse all / expand all round trip');
  // auto-scroll while dragging
  let scrolled = 0; w.scrollBy = (x, y) => { scrolled += y; };
  const ds = new w.Event('dragstart', { bubbles: true }); ds.dataTransfer = { setData() {}, effectAllowed: '' }; pkgRow('Parent').dispatchEvent(ds);
  d.dispatchEvent(new w.MouseEvent('dragover', { bubbles: true, clientY: w.innerHeight - 5 })); await sleep(120);
  assert.ok(scrolled > 0, 'scrolls down near bottom edge');
  scrolled = 0; d.dispatchEvent(new w.MouseEvent('dragover', { bubbles: true, clientY: 5 })); await sleep(120);
  assert.ok(scrolled < 0, 'scrolls up near top edge');
  scrolled = 0; d.dispatchEvent(new w.MouseEvent('dragover', { bubbles: true, clientY: w.innerHeight / 2 })); await sleep(80);
  assert.strictEqual(scrolled, 0, 'no scroll mid-window');
  pkgRow('Parent').dispatchEvent(new w.Event('dragend', { bubbles: true }));
  d.dispatchEvent(new w.MouseEvent('dragover', { bubbles: true, clientY: w.innerHeight - 5 })); await sleep(80);
  assert.strictEqual(scrolled, 0, 'stops after drop'); pass('drag auto-scrolls near window edges and stops on drop');
  // paste list keeps dates outside this week and attachments
  const oldDate = shift(lastMonday, 1);
  d.getElementById('modeBtn').click(); await sleep(10);
  assert.ok(d.getElementById('outline').value.includes('Old task @' + oldDate)); pass('outline writes dates outside this week as ISO');
  d.getElementById('applyBtn').click(); await sleep(10);
  d.getElementById('modeBtn').click(); await sleep(10);
  assert.ok(d.getElementById('outline').value.includes('Old task @' + oldDate)); d.getElementById('cancelBtn').click(); await sleep(10);
  pass('replace package keeps those dates');
  // file format stays schema 5
  await sleep(300); const doc = cache();
  assert.strictEqual(doc.version, 5); assert.ok(doc.weeks && typeof doc.weeks === 'object' && doc.settings.groupStyle === 'line');
  pass('saved data is still schema 5 (readable by v1.0)');
  assert.deepStrictEqual(errs, []); pass('no page errors');
  process.exit(0);
})().catch(e => { console.error('FAIL', e.message); process.exit(1); });
