import { chromium } from 'playwright';

const BASE = process.env.BASE || 'http://localhost:4173';
const errors = [];
const failedUrls = [];
// PLAYWRIGHT_EXECUTABLE lets a sandbox point at a pre-installed Chromium.
const browser = await chromium.launch(
  process.env.PLAYWRIGHT_EXECUTABLE ? { executablePath: process.env.PLAYWRIGHT_EXECUTABLE } : {},
);
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
page.on('requestfailed', (r) => failedUrls.push(r.url() + ' — ' + r.failure()?.errorText));

const step = async (name, fn) => {
  try { await fn(); console.log('ok  ', name); }
  catch (e) { console.log('FAIL', name, '-', e.message); errors.push(name + ': ' + e.message); }
};

const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAAFUlEQVR42mP8z8BQz0AEYBxVSF+FABJADveWkH6oAAAAAElFTkSuQmCC', 'base64');

const nav = (label) => page.locator('.rail-link', { hasText: label }).first();
const openTrip = async (name) => {
  await nav('Trips').click();
  await page.locator('.trip-card', { hasText: name }).getByRole('button', { name: 'Open' }).click();
  await page.waitForSelector('.tabs');
};

await page.goto(BASE, { waitUntil: 'networkidle' });

/* ── design: the mockup tells are gone ─────────────────────────────────── */

await step('no blueprint registration marks anywhere', async () => {
  if (await page.locator('.corner, .blueprint').count()) throw new Error('blueprint markup still rendered');
});

await step('app chrome is present (rail, topbar, breadcrumb)', async () => {
  await page.waitForSelector('.rail');
  await page.waitForSelector('.topbar');
  if (!(await page.locator('.crumbs').count())) throw new Error('no breadcrumb');
  const groups = await page.locator('.rail-group-label').count();
  if (groups < 2) throw new Error('rail is not grouped: ' + groups);
});

await step('surfaces are solid, not transparent wireframes', async () => {
  const bg = await page.locator('.card').first().evaluate((el) => getComputedStyle(el).backgroundColor);
  if (bg === 'rgba(0, 0, 0, 0)' || bg === 'transparent') throw new Error('card has no surface: ' + bg);
  const r = await page.locator('.card').first().evaluate((el) => getComputedStyle(el).borderRadius);
  if (parseFloat(r) < 2) throw new Error('cards still square: ' + r);
});

/* ── overview ──────────────────────────────────────────────────────────── */

await step('photo layers have real geometry (tint must not collapse them)', async () => {
  for (const sel of ['.hero-media', '.hero .slot']) {
    const box = await page.locator(sel).first().boundingBox();
    if (!box || box.height < 40) throw new Error(`${sel} collapsed: ${JSON.stringify(box)}`);
  }
  const prompt = page.locator('.hero .slot-empty').first();
  if (!(await prompt.isVisible())) throw new Error('no "add a photo" affordance on the hero');
});

await step('overview leads with the countdown, then KPIs and next trip', async () => {
  const h1 = await page.textContent('h1');
  if (!/^Costa Rica is \d+ days away\.$/.test(h1.trim())) throw new Error('lede: ' + h1);
  if (await page.locator('h1', { hasText: 'Good ' }).count()) throw new Error('greeting is back');
  const kpis = await page.locator('.grid-kpi > .card').count();
  if (kpis !== 4) throw new Error('kpi tiles: ' + kpis);
  const t = await page.textContent('body');
  if (!t.includes('Costa Rica') || !t.includes('Next trip')) throw new Error('no next-trip hero');
  if (!(await page.locator('[role=progressbar]').count())) throw new Error('no fund meter');
});

await step('affordability table uses status badges', async () => {
  const good = await page.locator('.badge-good').count();
  const bad = await page.locator('.badge-critical').count();
  if (good + bad === 0) throw new Error('no status badges');
  // Status colour is never alone — each badge carries text.
  const txt = await page.locator('.badge').first().innerText();
  if (!txt.trim()) throw new Error('badge has no label');
});

/* ── trips ─────────────────────────────────────────────────────────────── */

await step('trips lists 3 and search filters', async () => {
  await nav('Trips').click();
  await page.waitForSelector('.trip-card');
  if ((await page.locator('.trip-card').count()) !== 3) throw new Error('trip cards');
  await page.fill('input[placeholder="Search destinations…"]', 'ital');
  if ((await page.locator('.trip-card').count()) !== 1) throw new Error('filter failed');
  await page.fill('input[placeholder="Search destinations…"]', '');
});

await step('breadcrumb tracks the open trip', async () => {
  await openTrip('Costa Rica');
  const c = await page.locator('.crumbs').innerText();
  if (!c.includes('Trips') || !c.includes('Costa Rica')) throw new Error('breadcrumb: ' + c);
});

await step('plan options show Final plus both travelers', async () => {
  const t = await page.textContent('body');
  if (!t.includes('Final plan')) throw new Error('no Final card');
  if (!t.includes('John’s plan') || !t.includes('Sarah’s plan')) throw new Error('missing option cards');
});

/* ── itinerary ─────────────────────────────────────────────────────────── */

await step('itinerary shows 14 days for Option 1', async () => {
  await page.click('.tab:has-text("Itinerary")');
  await page.locator('button', { hasText: /^Option 1/ }).first().click();
  await page.waitForSelector('.day');
  if ((await page.locator('.day').count()) !== 14) throw new Error('day rows: ' + (await page.locator('.day').count()));
  const t = await page.textContent('body');
  if (!t.includes('Flight FLL → Liberia (LIR)') || !t.includes('$789.98')) throw new Error('seed item missing');
});

await step('add an item, with a toast', async () => {
  await page.click('button:has-text("Add item")');
  await page.waitForSelector('.dialog');
  await page.fill('#it-title', 'Coffee farm tour');
  await page.fill('#it-cost', '64.50');
  await page.click('.seg-opt:has-text("Activities")');
  await page.click('.dialog-ft button:has-text("Add item")');
  await page.waitForSelector('.toast');
  await page.waitForSelector('text=Coffee farm tour');
  if (!(await page.textContent('body')).includes('$64.50')) throw new Error('cost not shown');
});

/* ── drag to reorder ───────────────────────────────────────────────────── */

const dayText = async (n) => (await page.locator('.day').nth(n - 1).innerText());

const dayOf = async (title) => {
  const n = await page.locator('.day').count();
  for (let i = 0; i < n; i++) if ((await dayText(i + 1)).includes(title)) return i + 1;
  return 0;
};

/**
 * `aim` returns the drop point, measured after the target has been scrolled
 * into view. The coordinate must stay inside the viewport: near an edge the app
 * auto-scrolls, which is correct for a person watching the page move but makes
 * a fixed test coordinate point at whatever ends up there.
 */
const dragItem = async (title, aim) => {
  // aim() scrolls the destination into view and returns the drop point; both
  // measurements have to happen after that scroll settles.
  const to = await aim();
  const g = await page.locator('.item', { hasText: title }).first().locator('.grip').boundingBox();
  if (!g) throw new Error(`"${title}" is off-screen after scrolling to the target`);
  if (to < 100 || to > 900) throw new Error(`drop point ${to.toFixed(0)} is in the auto-scroll zone`);
  await page.mouse.move(g.x + g.width / 2, g.y + g.height / 2);
  await page.mouse.down();
  await page.mouse.move(g.x + g.width / 2, g.y + g.height / 2 + 8, { steps: 3 });
  await page.waitForSelector('.drag-ghost');
  await page.mouse.move(g.x + g.width / 2, to, { steps: 12 });
  await page.mouse.up();
  await page.waitForTimeout(150);
};

await step('dragging an item moves it to another day', async () => {
  const from = await dayOf('Surf lesson');
  if (from !== 2) throw new Error('unexpected starting day: ' + from);
  await dragItem('Surf lesson', async () => {
    await page.locator('.day').nth(3).scrollIntoViewIfNeeded();
    await page.waitForTimeout(150);
    const d4 = await page.locator('.day').nth(3).boundingBox();
    return d4.y + d4.height - 12;
  });
  const to = await dayOf('Surf lesson');
  if (to === 2) throw new Error('still on day 2');
  if (to !== 4) throw new Error('landed on day ' + to + ', expected 4');
});

await step('the move survives a reload', async () => {
  await page.reload({ waitUntil: 'networkidle' });
  await openTrip('Costa Rica');
  await page.click('.tab:has-text("Itinerary")');
  await page.locator('button', { hasText: /^Option 1/ }).first().click();
  await page.waitForSelector('.day');
  if (!(await dayText(4)).includes('Surf lesson')) throw new Error('move not persisted');
});

await step('dragging reorders within a day', async () => {
  const before = await dayText(1);
  if (before.indexOf('Flight FLL') > before.indexOf('Hotel Capitán')) throw new Error('unexpected starting order');
  // Aim above the midpoint of the first row, which is the insertion gap at the
  // very top of the day.
  await dragItem('Hotel Capitán', async () => {
    const f = await page.locator('.item', { hasText: 'Flight FLL' }).first().boundingBox();
    return f.y + 4;
  });
  const after = await dayText(1);
  if (after.indexOf('Hotel Capitán') > after.indexOf('Flight FLL')) throw new Error('hotel did not move to the top');
});

await step('the grip moves an item with the keyboard', async () => {
  const before = await dayText(1);
  await page.locator('.item', { hasText: 'Hotel Capitán' }).first().locator('.grip').focus();
  await page.keyboard.press('ArrowDown');
  await page.waitForTimeout(150);
  const after = await dayText(1);
  if (before === after) throw new Error('ArrowDown did nothing');
});

await step('time rail shows 12-hour time, and duration only when set', async () => {
  // Seed items are timed, so the rail is reserved for the whole plan.
  if (!(await page.locator('.day-items.has-rail').count())) throw new Error('rail not reserved');
  const flight = page.locator('.item', { hasText: 'Flight FLL' }).first();
  if ((await flight.locator('.item-when .at').innerText()) !== '7:15 AM')
    throw new Error('time not 12-hour: ' + (await flight.locator('.item-when .at').innerText()));
  // No duration on the seed data — nothing should be rendered for it.
  if (await flight.locator('.item-when .for').count()) throw new Error('empty duration rendered');
  // The rail is its own column, left of the category icon.
  const when = await flight.locator('.item-when').boundingBox();
  const icon = await flight.locator('.item-cat').boundingBox();
  if (when.x + when.width > icon.x + 1) throw new Error('rail is not left of the icon');
  // Untimed rows keep the column so the icons stay aligned.
  const uber = page.locator('.item', { hasText: 'Uber Liberia' }).first();
  const uberIcon = await uber.locator('.item-cat').boundingBox();
  if (Math.abs(uberIcon.x - icon.x) > 1) throw new Error('icons not aligned across rows');
});

await step('a duration set in the editor shows on the rail', async () => {
  const row = page.locator('.item', { hasText: 'Flight FLL' }).first();
  await row.hover();
  await row.locator('button[title="Edit"]').click();
  await page.waitForSelector('.dialog');
  await page.selectOption('#it-dur', '90');
  await page.click('.dialog-ft button:has-text("Save changes")');
  await page.waitForTimeout(200);
  const txt = await page.locator('.item', { hasText: 'Flight FLL' }).first().locator('.item-when').innerText();
  if (!txt.includes('1 hr 30 min')) throw new Error('duration not shown: ' + txt);
  // …and clearing it removes the line entirely.
  await row.hover();
  await row.locator('button[title="Edit"]').click();
  await page.waitForSelector('.dialog');
  await page.selectOption('#it-dur', '');
  await page.click('.dialog-ft button:has-text("Save changes")');
  await page.waitForTimeout(200);
  if (await page.locator('.item', { hasText: 'Flight FLL' }).first().locator('.item-when .for').count())
    throw new Error('cleared duration still rendered');
});

await step('copy it into Final and keep provenance', async () => {
  const row = page.locator('.item', { hasText: 'Coffee farm tour' }).first();
  await row.hover();
  await row.locator('button[title="Copy to another plan"]').click();
  await page.waitForSelector('.dialog');
  await page.locator('.dialog-bd button', { hasText: 'Final' }).first().click();
  await page.click('.dialog-ft button:has-text("Done")');
  await page.locator('button', { hasText: /^Final/ }).first().click();
  await page.waitForSelector('text=Coffee farm tour');
  if (!(await page.textContent('body')).includes('from Option 1')) throw new Error('provenance missing');
});

await step('empty plan shows a designed empty state', async () => {
  await openTrip('Italy');
  await page.click('.tab:has-text("Itinerary")');
  await page.waitForSelector('.empty');
  if (!(await page.textContent('.empty')).includes('Nothing planned yet')) throw new Error('wrong empty state');
  if (!(await page.locator('.empty-icon').count())) throw new Error('no empty-state icon');
});

/* ── compare ───────────────────────────────────────────────────────────── */

await step('compare marks what is already in Final', async () => {
  await openTrip('Costa Rica');
  await page.click('.tab:has-text("Compare")');
  await page.waitForSelector('.cmp');
  if (!(await page.locator('.badge-good', { hasText: 'Final' }).count())) throw new Error('no "Final" badge');
  // The header must sit flush on the table, not be pushed down over row 1 by a
  // sticky offset measured against the horizontal scroll container.
  const head = await page.locator('.cmp thead th').first().boundingBox();
  const tbl = await page.locator('.cmp').boundingBox();
  if (head.y - tbl.y > 2) throw new Error(`sticky header offset by ${(head.y - tbl.y).toFixed(0)}px`);
  const firstRow = await page.locator('.cmp tbody tr').first().boundingBox();
  if (firstRow.y < head.y + head.height - 2) throw new Error('first row is under the header');
});

/* ── import / export ───────────────────────────────────────────────────── */

await step('export round-trips through import', async () => {
  await page.click('.tab:has-text("Import / Export")');
  await page.waitForSelector('textarea[readonly]');
  await page.selectOption('select.input', { label: 'Option 2 · Sarah' });
  const parsed = JSON.parse(await page.locator('textarea[readonly]').first().inputValue());
  if (parsed.schema !== 'voyage.option.v1' || parsed.items.length !== 5) throw new Error('bad export');

  await page.fill('#imp-json', JSON.stringify({ name: 'ChatGPT draft', author: 'ChatGPT', items: [
    { day: 1, category: 'Lodging', title: 'Boutique hotel', cost: '$1,200', time: '5:00 AM', duration: '2 hrs' },
    { day: 99, category: 'zzz', title: 'Out of range thing', price: 40 },
  ]}));
  await page.waitForSelector('text=2 items');
  const msg = await page.textContent('body');
  if (!msg.includes('$1,240.00')) throw new Error('total not parsed');
  if (!msg.includes('1 moved into trip dates')) throw new Error('clamp note missing');
  if (!msg.includes('1 unknown categories')) throw new Error('unknown-cat note missing');
  await page.click('button:has-text("Import 2 items")');
  await page.waitForSelector('text=Boutique hotel');
  if (!(await page.textContent('body')).includes('ChatGPT draft')) throw new Error('option not named from JSON');
  // "5:00 AM" and "2 hrs" are normalised on the way in.
  const rail = await page.locator('.item', { hasText: 'Boutique hotel' }).first().locator('.item-when').innerText();
  if (!rail.includes('5:00 AM')) throw new Error('12-hour time not parsed: ' + rail);
  if (!rail.includes('2 hrs')) throw new Error('duration not parsed: ' + rail);
});

await step('bad JSON reports an error, import stays disabled', async () => {
  await page.click('.tab:has-text("Import / Export")');
  await page.fill('#imp-json', '{ not json');
  await page.waitForSelector('text=Not valid JSON');
  const disabled = await page.locator('button:has-text("Import")').last().isDisabled();
  if (!disabled) throw new Error('import button enabled on bad JSON');
  await page.fill('#imp-json', '');
});

/* ── fund ──────────────────────────────────────────────────────────────── */

await step('projection renders as a chart with axes and a zero baseline', async () => {
  await nav('Travel fund').click();
  await page.waitForSelector('.chart-wrap svg');
  const paths = await page.locator('.chart-wrap svg path').count();
  if (paths < 2) throw new Error('no line/area paths: ' + paths);
  const labels = await page.locator('.chart-wrap svg text').count();
  if (labels < 12) throw new Error('missing axis labels: ' + labels);
  if (!(await page.textContent('body')).includes('Costa Rica')) throw new Error('no trip annotation');
});

await step('chart hover shows a tooltip', async () => {
  const box = await page.locator('.chart-wrap svg').boundingBox();
  await page.mouse.move(box.x + box.width * 0.5, box.y + box.height * 0.5);
  await page.waitForSelector('.chart-tip', { timeout: 3000 });
  const tip = await page.textContent('.chart-tip');
  if (!/\$/.test(tip)) throw new Error('tooltip has no value: ' + tip);
});

await step('chart has a table view', async () => {
  await page.click('button:has-text("Table")');
  await page.waitForSelector('th:has-text("Balance at month end")');
  await page.click('button:has-text("Chart")');
  await page.waitForSelector('.chart-wrap svg');
});

await step('the fund page leads with the chart, controls behind Budget', async () => {
  const chart = await page.locator('.chart-wrap svg').boundingBox();
  const btn = await page.locator('.content button:has-text("Budget")').first().boundingBox();
  if (btn.y > chart.y) throw new Error('Budget button is not above the chart');
  // Nothing but the button and the chart card on the page itself.
  if (await page.locator('.content input[type=number]').count()) throw new Error('controls still inline');
  await page.locator('.content button:has-text("Budget")').first().click();
  await page.waitForSelector('.dialog');
  const t = await page.textContent('.dialog');
  for (const bit of ['Saved so far', 'every 2 weeks', 'Contribution rules', 'Schedule a change'])
    if (!t.includes(bit)) throw new Error('modal missing: ' + bit);
});

await step('raising a contribution moves the projection', async () => {
  // Assert on the plotted geometry: the axis ticks round to clean numbers and
  // there is deliberately no value label per point, so the text can be
  // unchanged while the line has moved.
  const line = page.locator('.chart-wrap svg path').nth(1);
  const before = await line.getAttribute('d');
  await page.locator('button[aria-label="Raise John’s contribution by 50"]').click();
  await page.waitForTimeout(150);
  // The chart is still mounted behind the modal, so it re-renders live.
  if ((await line.getAttribute('d')) === before) throw new Error('chart did not react');
  if (!(await page.textContent('.dialog')).includes('$950')) throw new Error('couple total did not update');
});

await step('a future rule is flagged as scheduled', async () => {
  await page.fill('#r-from', '2027-01-01');
  await page.click('.dialog button:has-text("Add rule")');
  await page.waitForSelector('td:has-text("Jan 1, 2027")');
  if (!(await page.locator('.badge', { hasText: 'scheduled' }).count())) throw new Error('no scheduled badge');
  await page.click('.dialog-ft button:has-text("Done")');
  await page.waitForTimeout(150);
  if (await page.locator('.dialog').count()) throw new Error('modal did not close');
});

await step('item categories each carry their own colour', async () => {
  await openTrip('Costa Rica');
  await page.click('.tab:has-text("Itinerary")');
  await page.locator('button', { hasText: /^Option 1/ }).first().click();
  await page.waitForSelector('.item-cat');
  const colours = await page.locator('.item-cat').evaluateAll((els) =>
    [...new Set(els.map((e) => getComputedStyle(e).color))]);
  if (colours.length < 3) throw new Error('icons share a colour: ' + colours.join(' | '));
  const cls = await page.locator('.item-cat').first().getAttribute('class');
  if (!/cat-(flight|hotel|transport|food|activity)/.test(cls)) throw new Error('no category class: ' + cls);
});

/* ── settings ──────────────────────────────────────────────────────────── */

await step('renaming a traveler reaches the plan cards', async () => {
  await nav('Settings').click();
  await page.locator('.card', { hasText: 'Traveler 1' }).locator('input.input').first().fill('Johnny');
  await page.waitForTimeout(120);
  await openTrip('Costa Rica');
  if (!(await page.textContent('body')).includes('Johnny’s plan')) throw new Error('rename did not propagate');
});

await step('state survives a reload', async () => {
  await page.reload({ waitUntil: 'networkidle' });
  if (!(await page.textContent('body')).includes('Johnny')) throw new Error('did not persist');
});

/* ── photos & data ─────────────────────────────────────────────────────── */

await step('create a trip', async () => {
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'networkidle' });
  await page.click('.topbar button:has-text("New trip")');
  await page.fill('#nv-name', 'Lisbon');
  await page.fill('#nv-start', '2027-09-10');
  await page.fill('#nv-end', '2027-09-14');
  await page.click('.dialog-ft button:has-text("Create trip")');
  await page.waitForSelector('h2:has-text("Plan options")');
  if (!(await page.textContent('body')).includes('Lisbon')) throw new Error('trip not opened');
});

await step('a cover photo uploads and persists', async () => {
  const empty = page.locator('.slot[aria-label="Add a photo of Lisbon"]');
  await empty.locator('input[type=file]').setInputFiles({ name: 'l.png', mimeType: 'image/png', buffer: PNG });
  const filled = page.locator('.slot[aria-label="Replace photo: Add a photo of Lisbon"]');
  await filled.locator('img').waitFor({ timeout: 5000 });
  const src = await filled.locator('img').getAttribute('src');
  if (!src?.startsWith('data:image/')) throw new Error('no image src');
  await page.reload({ waitUntil: 'networkidle' });
  await nav('Trips').click();
  const card = page.locator('.trip-card', { hasText: 'Lisbon' });
  await card.locator('img').waitFor({ timeout: 5000 });
  if ((await card.locator('img').getAttribute('src')) !== src) throw new Error('different image after reload');
});

await step('avatar photo reaches the rail', async () => {
  await nav('Settings').click();
  await page.locator('.card', { hasText: 'Traveler 1' }).locator('.slot input[type=file]')
    .setInputFiles({ name: 'j.png', mimeType: 'image/png', buffer: PNG });
  await page.waitForTimeout(300);
  if ((await page.locator('.rail .av-photo .slot[data-filled] img').count()) !== 1) throw new Error('rail avatar empty');
});

await step('backup carries the photos', async () => {
  const dl = page.waitForEvent('download');
  await page.click('button:has-text("Download backup")');
  const chunks = [];
  for await (const c of await (await dl).createReadStream()) chunks.push(c);
  const j = JSON.parse(Buffer.concat(chunks).toString());
  const keys = Object.keys(j.images || {});
  if (keys.length !== 2) throw new Error('images in backup: ' + keys.join(','));
  if (!keys.some((k) => k.startsWith('cover-')) || !keys.includes('avatar-p1')) throw new Error('wrong keys');
});

await step('photo tint toggles', async () => {
  await nav('Trips').click();
  if (!(await page.locator('.tint').count())) throw new Error('tint not on by default');
  await nav('Settings').click();
  await page.click('label.choice:has-text("Tint trip photography")');
  await nav('Trips').click();
  if (await page.locator('.tint').count()) throw new Error('tint not removed');
});

await step('delete a trip', async () => {
  await openTrip('Lisbon');
  await page.locator('.hero button:has-text("Delete")').click();
  await page.click('.dialog-ft button:has-text("Delete trip")');
  await page.waitForTimeout(200);
  await nav('Trips').click();
  // Scope to the cards: the confirmation toast still names the trip.
  if (await page.locator('.trip-card', { hasText: 'Lisbon' }).count()) throw new Error('still listed');
});

await step('reset restores the sample set', async () => {
  await nav('Settings').click();
  await page.click('button:has-text("Reset to sample data")');
  await page.click('.dialog-ft button:has-text("Reset")');
  await page.waitForTimeout(200);
  await nav('Trips').click();
  if ((await page.locator('.trip-card').count()) !== 3) throw new Error('sample trips not back');
});

await step('escape closes a dialog', async () => {
  await page.click('.topbar button:has-text("New trip")');
  await page.waitForSelector('.dialog');
  await page.keyboard.press('Escape');
  await page.waitForTimeout(120);
  if (await page.locator('.dialog').count()) throw new Error('dialog still open');
});

await step('layout does not overflow horizontally at 1440 or 420', async () => {
  for (const w of [1440, 420]) {
    await page.setViewportSize({ width: w, height: 900 });
    await nav('Travel fund').click();
    await page.waitForTimeout(150);
    const over = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    if (over > 1) throw new Error(`horizontal overflow at ${w}px: ${over}px`);
  }
  await page.setViewportSize({ width: 1440, height: 1000 });
});

await browser.close();
console.log('\nfailed requests:\n' + (failedUrls.join('\n') || '(none)'));
console.log(errors.length ? '\nERRORS:\n' + errors.join('\n') : '\nNo JS errors.');
process.exit(errors.some((e) => !e.startsWith('console: Failed to load resource')) ? 1 : 0);
