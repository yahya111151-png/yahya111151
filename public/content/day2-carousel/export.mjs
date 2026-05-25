import puppeteer from 'puppeteer';
import { mkdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(__dirname, 'out');
mkdirSync(OUT, { recursive: true });

const SLIDES = [
  { file: 'slide-0.html', label: 'Cover — Don\'t Get Fooled Again' },
  { file: 'slide-1.html', label: '01 — They seem friendly' },
  { file: 'slide-2.html', label: '02 — Lens reads between the lines' },
  { file: 'slide-3.html', label: '03 — 8 dimensions. Zero BS.' },
  { file: 'slide-4.html', label: '04 — What others won\'t say' },
  { file: 'slide-5.html', label: '05 — CTA' },
];

console.log('📸 Day 2 Carousel — "Don\'t Get Fooled Again!"');
const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
const page = await browser.newPage();
await page.setViewport({ width: 1080, height: 1080, deviceScaleFactor: 1 });

for (const s of SLIDES) {
  const url = `file:///${resolve(__dirname, s.file).replace(/\\/g,'/')}`;
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 300));
  const out = resolve(OUT, s.file.replace('.html', '.png'));
  await page.screenshot({ path: out, clip: { x:0, y:0, width:1080, height:1080 } });
  console.log(`  ✓ ${s.label}`);
}

await browser.close();
console.log(`\n✅ 6 slides saved to ${OUT}`);
