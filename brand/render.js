// Renderiza los SVG de .raster a PNG con Chromium (Playwright).
// Uso: NODE_PATH=<global node_modules> node render.js <kit_dir>
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const kit = process.argv[2];
const ras = path.join(kit, '.raster');
const pub = path.join(kit, 'apps/web/public');

const jobs = [
  ['icon-16.svg', 'icon-16.png', 16, true],
  ['icon.svg', 'icon-32.png', 32, true],
  ['icon.svg', 'icon-48.png', 48, true],
  ['icon-touch.svg', 'icon-180.png', 180, false],
  ['icon.svg', 'icon-192.png', 192, true],
  ['icon.svg', 'icon-512.png', 512, true],
  ['icon-maskable.svg', 'icon-maskable-512.png', 512, false],
  ['og-image.svg', 'og-image.png', [1200, 630], false],
];

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ deviceScaleFactor: 1 });
  for (const [src, out, size, transparent] of jobs) {
    const [w, h] = Array.isArray(size) ? size : [size, size];
    const svg = fs.readFileSync(path.join(ras, src), 'utf8')
      .replace(/width="[^"]+" height="[^"]+"/, `width="${w}" height="${h}"`);
    await page.setViewportSize({ width: w, height: h });
    await page.setContent(`<!doctype html><html><head><style>html,body{margin:0;background:transparent}svg{display:block}</style></head><body>${svg}</body></html>`);
    await page.screenshot({ path: path.join(pub, out), omitBackground: transparent, clip: { x: 0, y: 0, width: w, height: h } });
    console.log('ok', out);
  }
  await browser.close();
})();
