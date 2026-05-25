import puppeteer from 'puppeteer';
import { mkdir } from 'fs/promises';

const OUT = 'G:/Claude/nosedive/public/stories/out';

const SLIDES = [
  // Stories (1080x1920)
  { file: 'slide1.html', w: 1080, h: 1920 },
  { file: 'slide2.html', w: 1080, h: 1920 },
  { file: 'slide3.html', w: 1080, h: 1920 },
  { file: 'slide4.html', w: 1080, h: 1920 },
  { file: 'slide5.html', w: 1080, h: 1920 },
  // Feed posts (1080x1080)
  { file: 'post1.html',  w: 1080, h: 1080 },
  { file: 'post2.html',  w: 1080, h: 1080 },
  { file: 'post3.html',  w: 1080, h: 1080 },
  // 8 Dimensions carousel
  { file: 'carousel-dim-0.html', w: 1080, h: 1080 },
  { file: 'carousel-dim-1.html', w: 1080, h: 1080 },
  { file: 'carousel-dim-2.html', w: 1080, h: 1080 },
  { file: 'carousel-dim-3.html', w: 1080, h: 1080 },
  { file: 'carousel-dim-4.html', w: 1080, h: 1080 },
  { file: 'carousel-dim-5.html', w: 1080, h: 1080 },
  { file: 'carousel-dim-6.html', w: 1080, h: 1080 },
  { file: 'carousel-dim-7.html', w: 1080, h: 1080 },
  { file: 'carousel-dim-8.html', w: 1080, h: 1080 },
  // How it works carousel
  { file: 'carousel-how-0.html', w: 1080, h: 1080 },
  { file: 'carousel-how-1.html', w: 1080, h: 1080 },
  { file: 'carousel-how-2.html', w: 1080, h: 1080 },
  { file: 'carousel-how-3.html', w: 1080, h: 1080 },
];

await mkdir(OUT, { recursive: true });

const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
const page = await browser.newPage();

for (const s of SLIDES) {
  await page.setViewport({ width: s.w, height: s.h, deviceScaleFactor: 1 });
  await page.goto(`http://localhost:4200/${s.file}`, { waitUntil: 'domcontentloaded', timeout: 15000 });
  await new Promise(r => setTimeout(r, 300)); // let CSS paint
  const outFile = `${OUT}/${s.file.replace('.html', '.png')}`;
  await page.screenshot({ path: outFile, clip: { x: 0, y: 0, width: s.w, height: s.h } });
  console.log(`✓ ${s.file}`);
}

await browser.close();
console.log(`\nAll ${SLIDES.length} PNGs saved to ${OUT}`);
