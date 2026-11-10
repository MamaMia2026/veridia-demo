const { test, expect } = require('@playwright/test');
const path = require('path');
const { pathToFileURL } = require('url');

const URL_INDEX = pathToFileURL(path.join(__dirname, '..', 'index.html')).href;

let pageErrors;
let consoleErrors;

test.beforeEach(async ({ page }) => {
  pageErrors = [];
  consoleErrors = [];
  page.on('pageerror', (e) => pageErrors.push(e.message));
  page.on('console', (m) => {
    if (m.type() === 'error') consoleErrors.push(m.text());
  });
  await page.goto(URL_INDEX);
  await page.waitForLoadState('load');
});

test('0 erori JS și 0 console.error', async ({ page }) => {
  // parcurge toată pagina, ca să ruleze și codul declanșat la scroll / reveal
  await page.evaluate(async () => {
    for (let y = 0; y < document.documentElement.scrollHeight; y += 600) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 60));
    }
  });
  await page.waitForTimeout(3000); // prinde și setInterval-urile (2s / 2,5s)
  expect(pageErrors, 'erori JS').toEqual([]);
  expect(consoleErrors, 'console.error').toEqual([]);
});

test('fără scroll orizontal (scrollWidth ≤ lățimea ecranului)', async ({ page }) => {
  const width = page.viewportSize().width;
  const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
  expect(scrollWidth).toBeLessThanOrEqual(width);
});

test('hamburgerul #hb: vizibil la 390px, invizibil la 1440px', async ({ page }) => {
  const hb = page.locator('#hb');
  if (page.viewportSize().width <= 390) await expect(hb).toBeVisible();
  else await expect(hb).toBeHidden();
});

test('harta orașului (svg#city) are cel puțin 50 de clădiri .bld', async ({ page }) => {
  const count = await page.locator('svg#city .bld').count();
  expect(count).toBeGreaterThanOrEqual(50);
});

test('buget participativ: click pe primul proiect activează #vS', async ({ page }) => {
  const vS = page.locator('#vS');
  await expect(vS).toBeDisabled();
  await page.locator('#pj .pc').first().locator('button').click();
  await expect(vS).toBeEnabled();
});

test('chat: sugestia despre certificatul de urbanism primește răspuns cu „15 zile”', async ({ page }) => {
  await page
    .locator('#sug button', { hasText: 'Cât costă certificatul de urbanism?' })
    .click();
  await expect(page.locator('#msgs .mg.b').last()).toContainText('15 zile');
});

test('bonul (#rcp) arată „1.240,00 lei” la valoarea 1240 în #ta', async ({ page }) => {
  const ta = page.locator('#ta');
  await ta.fill('1240');
  await expect(ta).toHaveValue('1240');
  await expect(page.locator('#rcp')).toContainText('1.240,00 lei');
});
