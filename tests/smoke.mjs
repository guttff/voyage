import { chromium } from 'playwright';

const BASE = process.env.BASE || 'http://localhost:4173';
const errors = [];
const failedUrls = [];
// PLAYWRIGHT_EXECUTABLE lets a sandbox point at a pre-installed Chromium.
const browser = await chromium.launch(
  process.env.PLAYWRIGHT_EXECUTABLE ? { executablePath: process.env.PLAYWRIGHT_EXECUTABLE } : {},
);
const page = await browser.newPage();
page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
page.on('requestfailed', (r) => failedUrls.push(r.url() + ' — ' + r.failure()?.errorText));

const step = async (name, fn) => {
  try { await fn(); console.log('ok  ', name); }
  catch (e) { console.log('FAIL', name, '-', e.message); errors.push(name + ': ' + e.message); }
};

const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAAFUlEQVR42mP8z8BQz0AEYBxVSF+FABJADveWkH6oAAAAAElFTkSuQmCC', 'base64');

await page.goto(BASE, { waitUntil: 'networkidle' });

await step('home renders greeting + next trip', async () => {
  await page.waitForSelector('h2');
  const h2 = await page.textContent('h2');
  if (!/Good (morning|afternoon|evening), John & Sarah/.test(h2)) throw new Error('greeting: ' + h2);
  const body = await page.textContent('body');
  if (!body.includes('Costa Rica')) throw new Error('no Costa Rica hero');
  if (!body.includes('Next trip')) throw new Error('no Next trip kicker');
});

await step('travel fund ring shows a percentage', async () => {
  const t = await page.textContent('body');
  if (!/\d+%/.test(t)) throw new Error('no percentage');
});

await step('nav to Trips lists 3 trips', async () => {
  await page.click('button:has-text("Trips")');
  await page.waitForSelector('h2:has-text("My trips")');
  const cards = await page.locator('.vy-tripcard').count();
  if (cards !== 3) throw new Error('trip cards: ' + cards);
});

await step('search filters', async () => {
  await page.fill('input[placeholder="Search destinations…"]', 'ital');
  if (await page.locator('.vy-tripcard').count() !== 1) throw new Error('filter failed');
  await page.fill('input[placeholder="Search destinations…"]', '');
});

await step('open Costa Rica -> plan options', async () => {
  await page.locator('.vy-tripcard', { hasText: 'Costa Rica' }).getByRole('button', { name: 'Open' }).click();
  await page.waitForSelector('h4:has-text("Plan options")');
  const t = await page.textContent('body');
  if (!t.includes('Combined plan')) throw new Error('no Combined plan card');
  if (!t.includes('John’s plan') || !t.includes('Sarah’s plan')) throw new Error('missing option cards');
});

await step('itinerary tab shows 14 day rows for Option 1', async () => {
  await page.click('button:has-text("Itinerary")');
  await page.waitForSelector('text=Add to this day');
  await page.locator('button', { hasText: /^Option 1/ }).first().click();
  const days = await page.locator('button:has-text("+ Add to this day")').count();
  if (days !== 14) throw new Error('day rows: ' + days);
  const t = await page.textContent('body');
  if (!t.includes('Flight FLL → Liberia (LIR)')) throw new Error('missing seeded flight');
  if (!t.includes('$789.98')) throw new Error('missing item cost');
});

await step('add an item', async () => {
  await page.click('button:has-text("+ Add item")');
  await page.waitForSelector('.dialog-title');
  await page.fill('input[placeholder="Flight FLL → Liberia"]', 'Coffee farm tour');
  await page.fill('input[placeholder="0.00"]', '64.50');
  await page.click('.seg-opt:has-text("Activities")');
  await page.click('.dialog button:has-text("Add item")');
  await page.waitForSelector('text=Coffee farm tour');
  const t = await page.textContent('body');
  if (!t.includes('$64.50')) throw new Error('cost not shown');
});

await step('copy that item to Final', async () => {
  const row = page.locator('.vy-row', { hasText: 'Coffee farm tour' }).first();
  await row.hover();
  await row.getByRole('button', { name: 'Copy to…' }).click();
  await page.waitForSelector('.dialog-title:has-text("Copy")');
  await page.locator('.dialog button', { hasText: 'Final' }).first().click();
  await page.click('.dialog button:has-text("Done")');
  await page.locator('button', { hasText: /^Final/ }).first().click();
  await page.waitForSelector('text=Coffee farm tour');
  const t = await page.textContent('body');
  if (!t.includes('from Option 1')) throw new Error('provenance missing');
});

await step('compare tab marks it in Final', async () => {
  await page.click('button:has-text("Compare")');
  await page.waitForSelector('text=Options side by side');
  const t = await page.textContent('body');
  if (!t.includes('in Final')) throw new Error('no "in Final" badge');
});

await step('export round-trips through import', async () => {
  await page.click('button:has-text("Import / Export")');
  await page.waitForSelector('.card-title:has-text("Export JSON")');
  await page.selectOption('select.input', { label: 'Option 2 · Sarah' });
  const json = await page.locator('textarea[readonly]').first().inputValue();
  const parsed = JSON.parse(json);
  if (parsed.schema !== 'voyage.option.v1' || parsed.items.length !== 5) throw new Error('bad export: ' + json.slice(0, 120));
  await page.fill('textarea[placeholder^="…or paste"]', JSON.stringify({ name: 'ChatGPT draft', author: 'ChatGPT', items: [
    { day: 1, category: 'Lodging', title: 'Boutique hotel', cost: '$1,200' },
    { day: 99, category: 'zzz', title: 'Out of range thing', price: 40 },
  ]}));
  await page.waitForSelector('text=2 items');
  const msg = await page.textContent('body');
  if (!msg.includes('$1,240.00')) throw new Error('total not parsed');
  if (!msg.includes('1 moved into trip dates')) throw new Error('clamp note missing');
  if (!msg.includes('1 unknown categories')) throw new Error('unknown-cat note missing');
  await page.click('button:has-text("Import 2 items")');
  await page.waitForSelector('text=Boutique hotel');
  const t = await page.textContent('body');
  if (!t.includes('ChatGPT draft')) throw new Error('new option not named from JSON');
});

await step('budget page projects 12 months and reacts to contributions', async () => {
  await page.click('button.vy-nav:has-text("Budget")');
  await page.waitForSelector('h2:has-text("Budget & contributions")');
  const labels = await page.locator('div[style*="repeat(12"] > div').count();
  if (labels < 24) throw new Error('projection columns: ' + labels);
  const before = await page.textContent('body');
  if (!before.includes('Costa Rica')) throw new Error('trip callout missing from chart');
  await page.locator('button[aria-label="Raise John’s contribution"]').click();
  await page.waitForTimeout(100);
  const after = await page.textContent('body');
  if (before === after) throw new Error('chart did not react');
  if (!after.includes('$950')) throw new Error('couple total did not update');
});

await step('future rule adds a row', async () => {
  await page.fill('input[type="date"]', '2027-01-01');
  await page.click('button:has-text("Add rule")');
  await page.waitForSelector('td:has-text("Jan 1, 2027")');
});

await step('settings renames a traveler everywhere', async () => {
  await page.click('button.vy-nav:has-text("Settings")');
  await page.waitForSelector('h2:has-text("Settings")');
  const name = page.locator('.card', { hasText: 'Traveler 1' }).locator('input.input').first();
  await name.fill('Johnny');
  await page.waitForTimeout(100);
  await page.click('button.vy-nav:has-text("Trips")');
  await page.locator('.vy-tripcard', { hasText: 'Costa Rica' }).getByRole('button', { name: 'Open' }).click();
  await page.waitForSelector('h4:has-text("Plan options")');
  const t = await page.textContent('body');
  if (!t.includes('Johnny’s plan')) throw new Error('rename did not reach plan cards');
});

await step('state survives a reload', async () => {
  await page.reload({ waitUntil: 'networkidle' });
  const t = await page.textContent('body');
  if (!t.includes('Johnny')) throw new Error('did not persist');
});


await page.goto(BASE, { waitUntil: 'networkidle' });
await page.evaluate(() => localStorage.clear());
await page.reload({ waitUntil: 'networkidle' });

await step('create a new trip', async () => {
  await page.click('button:has-text("+ New trip")');
  await page.fill('input[placeholder="Costa Rica"]', 'Lisbon');
  const dates = page.locator('.dialog input[type="date"]');
  await dates.nth(0).fill('2027-09-10');
  await dates.nth(1).fill('2027-09-14');
  await page.click('.dialog button:has-text("Create trip")');
  await page.waitForSelector('h4:has-text("Plan options")');
  const t = await page.textContent('body');
  if (!t.includes('Lisbon')) throw new Error('trip not opened');
  if (!t.includes('Nothing planned')) throw new Error('empty-plan verdict missing');
});

await step('new option appears and is deletable', async () => {
  await page.click('button:has-text("Create new option")');
  await page.waitForSelector('button:has-text("+ Add item")');
  await page.click('button:has-text("Plan options")');
  const t = await page.textContent('body');
  if (!t.includes('Option 3')) throw new Error('Option 3 missing');
  await page.locator('.card', { hasText: 'Option 3' }).getByRole('button', { name: 'Delete' }).click();
  await page.click('.dialog button:has-text("Delete option")');
  await page.waitForTimeout(150);
  // The card is gone; the activity feed still mentions it by name, so match exactly.
  if (await page.getByText('Option 3', { exact: true }).count()) throw new Error('card not deleted');
  if (!(await page.textContent('body')).includes('deleted Option 3 in Lisbon')) throw new Error('not logged');
});

await step('drop a photo on the trip cover, and it persists', async () => {
  await page
    .locator('.vy-slot[aria-label="Drop a photo of Lisbon"] input[type=file]')
    .setInputFiles({ name: 'lisbon.png', mimeType: 'image/png', buffer: PNG });
  // The label flips to "Replace photo: …" once the slot is filled.
  const cover = page.locator('.vy-slot[aria-label="Replace photo: Drop a photo of Lisbon"]');
  await cover.locator('img').waitFor({ timeout: 5000 });
  const src = await cover.locator('img').getAttribute('src');
  if (!src?.startsWith('data:image/')) throw new Error('no image src: ' + src);
  // A reload lands back on Home, so navigate to where that cover is drawn.
  await page.reload({ waitUntil: 'networkidle' });
  await page.click('button.vy-nav:has-text("Trips")');
  const card = page.locator('.vy-tripcard', { hasText: 'Lisbon' });
  await card.locator('img').waitFor({ timeout: 5000 });
  if ((await card.locator('img').getAttribute('src')) !== src) throw new Error('different image after reload');
  await card.getByRole('button', { name: 'Open' }).click();
  await page.waitForSelector('h4:has-text("Plan options")');
});

await step('avatar photo shows in the sidebar', async () => {
  await page.click('button.vy-nav:has-text("Settings")');
  await page.waitForSelector('h2:has-text("Settings")');
  const av = page.locator('.card', { hasText: 'Traveler 1' }).locator('.vy-slot input[type=file]');
  await av.setInputFiles({ name: 'john.png', mimeType: 'image/png', buffer: PNG });
  await page.waitForTimeout(300);
  const shown = await page.locator('.vy-sidebar .vy-av .vy-slot[data-filled] img').count();
  if (shown !== 1) throw new Error('sidebar avatar not filled: ' + shown);
});

await step('backup includes photos and restores them', async () => {
  const dl = page.waitForEvent('download');
  await page.click('button:has-text("Download backup")');
  const stream = await (await dl).createReadStream();
  const chunks = [];
  for await (const c of stream) chunks.push(c);
  const j = JSON.parse(Buffer.concat(chunks).toString());
  if (j.schema !== 'voyage.backup.v1') throw new Error('bad schema');
  const keys = Object.keys(j.images || {});
  if (keys.length !== 2) throw new Error('images in backup: ' + keys.join(','));
  if (!keys.some((k) => k.startsWith('cover-')) || !keys.includes('avatar-p1')) throw new Error('wrong keys: ' + keys);
});

await step('duotone toggle switches the tint class', async () => {
  await page.click('button.vy-nav:has-text("Trips")');
  const before = await page.locator('.duotone').count();
  if (!before) throw new Error('tint not on by default');
  await page.click('button.vy-nav:has-text("Settings")');
  await page.click('label.radio:has-text("Tint trip photos")');
  await page.click('button.vy-nav:has-text("Trips")');
  if (await page.locator('.duotone').count()) throw new Error('tint not removed');
  await page.click('button.vy-nav:has-text("Settings")');
  await page.click('label.radio:has-text("Tint trip photos")');
});

await step('delete a trip drops it from the list', async () => {
  await page.click('button.vy-nav:has-text("Trips")');
  await page.locator('.vy-tripcard', { hasText: 'Lisbon' }).getByRole('button', { name: 'Open' }).click();
  await page.click('button:has-text("Delete")');
  await page.click('.dialog button:has-text("Delete trip")');
  await page.waitForTimeout(200);
  await page.click('button.vy-nav:has-text("Trips")');
  if ((await page.textContent('body')).includes('Lisbon')) throw new Error('still listed');
});

await step('reset restores the sample set', async () => {
  await page.click('button.vy-nav:has-text("Settings")');
  await page.click('button:has-text("Reset to sample data")');
  await page.click('.dialog button:has-text("Reset")');
  await page.waitForSelector('h2');
  await page.click('button.vy-nav:has-text("Trips")');
  if ((await page.locator('.vy-tripcard').count()) !== 3) throw new Error('sample trips not back');
});

await step('escape closes a dialog', async () => {
  await page.click('button:has-text("+ New trip")');
  await page.waitForSelector('.dialog');
  await page.keyboard.press('Escape');
  await page.waitForTimeout(100);
  if (await page.locator('.dialog').count()) throw new Error('dialog still open');
});

await browser.close();
console.log('\nfailed requests:\n' + (failedUrls.join('\n') || '(none)'));
console.log(errors.length ? '\nERRORS:\n' + errors.join('\n') : '\nNo JS errors.');
process.exit(errors.some((e) => !e.startsWith('console: Failed to load resource')) ? 1 : 0);
