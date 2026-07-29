import { chromium } from 'playwright';
import { AxeBuilder } from '@axe-core/playwright';

const baseUrl = process.env.FRONTEND_URL || 'https://sinpapel.vercel.app';
const pages = ['/', '/cadastro', '/candidato', '/empresa', '/admin', '/termos-lgpd'];
const viewports = [
  { name: 'mobile-320', width: 320, height: 720 },
  { name: 'desktop', width: 1440, height: 900 },
];

const browser = await chromium.launch({ headless: true });
const results = [];

for (const viewport of viewports) {
  const context = await browser.newContext({ viewport });
  const page = await context.newPage();

  for (const path of pages) {
    await page.goto(`${baseUrl}${path}`, { waitUntil: 'networkidle' });
    const scan = await new AxeBuilder({ page }).analyze();
    const overflow = await page.evaluate(() => (
      Math.max(document.documentElement.scrollWidth, document.body.scrollWidth) >
      document.documentElement.clientWidth + 1
    ));
    results.push({
      viewport: viewport.name,
      path,
      violations: scan.violations.map((violation) => ({
        id: violation.id,
        impact: violation.impact,
        description: violation.description,
        nodes: violation.nodes.length,
      })),
      horizontalOverflow: overflow,
    });
  }

  await context.close();
}

await browser.close();

const failures = results.filter((result) => result.violations.length > 0 || result.horizontalOverflow);
console.log(JSON.stringify({ checkedAt: new Date().toISOString(), baseUrl, results }, null, 2));

if (failures.length > 0) {
  process.exitCode = 1;
}
