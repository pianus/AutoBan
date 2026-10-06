// AutoBan smoke test (jsdom): migration, outline editing, issue mirroring, drag/drop, month view.
const { JSDOM } = require('jsdom');
const fs = require('fs'), path = require('path'), assert = require('assert');
const html = fs.readFileSync(path.join(__dirname, '../../src/autoban.html'), 'utf8');
const monday = (() => { const d = new Date(); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return d.toISOString().slice(0, 10); })();
const legacy = { ['tracker:week:' + monday]: JSON.stringify({ tasks: [
  { id: 'p1', title: 'Parent', parent: null, days: [0], done: false },
  { id: 'c1', title: 'Child', parent: 'p1', days: [2], done: false }] }) };
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
(async () => {
  await sleep(150);
  assert.deepStrictEqual(pkgRows(), ['0:Parent', '13px:Child']); pass('legacy parent/day data migrates to levels');
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
  assert.deepStrictEqual(errs, []); pass('no page errors');
  process.exit(0);
})().catch(e => { console.error('FAIL', e.message); process.exit(1); });
