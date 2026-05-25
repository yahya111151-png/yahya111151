import puppeteer from 'puppeteer';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegStatic from 'ffmpeg-static';
import { mkdirSync, rmSync, statSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const FRAMES_DIR = resolve(__dirname, 'frames');
const HTML_FILE  = `file:///${resolve(__dirname, 'video.html').replace(/\\/g,'/')}`;
const FPS = 30; const DURATION = 15; const TOTAL = FPS * DURATION;
const W = 1080; const H = 1920;

try { rmSync(FRAMES_DIR, { recursive: true }); } catch(e) {}
mkdirSync(FRAMES_DIR, { recursive: true });

console.log('🎬 Day 7 Reel — "Join Lens Today" (CTA)');
const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', `--window-size=${W},${H}`] });
const page = await browser.newPage();
await page.setViewport({ width: W, height: H, deviceScaleFactor: 1 });
await page.goto(HTML_FILE, { waitUntil: 'domcontentloaded' });
await new Promise(r => setTimeout(r, 500));

console.log(`🖼  Capturing ${TOTAL} frames...`);
const start = Date.now();
for (let i = 0; i < TOTAL; i++) {
  const t = i / (TOTAL - 1);
  await page.evaluate((t) => window.renderFrame(t), t);
  if (i < 5) await new Promise(r => setTimeout(r, 50));
  await page.screenshot({ path: resolve(FRAMES_DIR, `frame${String(i).padStart(5,'0')}.png`), clip: { x:0,y:0,width:W,height:H } });
  if (i % 30 === 0) { const p=((i/TOTAL)*100).toFixed(0); const e=((Date.now()-start)/1000).toFixed(1); console.log(`  ${p}% — frame ${i}/${TOTAL} (${e}s)`); }
}
await browser.close();
console.log(`✅ Frames done in ${((Date.now()-start)/1000).toFixed(1)}s`);

const FRAMES_PATTERN = resolve(__dirname, 'frames/frame%05d.png').replace(/\\/g,'/');
const OUT = resolve(__dirname, 'day7-reel.mp4').replace(/\\/g,'/');
console.log('\n🎞  Encoding MP4...');
ffmpeg.setFfmpegPath(ffmpegStatic);
await new Promise((res, rej) => {
  ffmpeg()
    .input(FRAMES_PATTERN).inputOptions([`-framerate ${FPS}`])
    .videoCodec('libx264')
    .outputOptions(['-pix_fmt yuv420p','-crf 18','-preset slow','-movflags +faststart',`-vf scale=${W}:${H}`])
    .output(OUT)
    .on('progress', p => { if(p.percent) process.stdout.write(`\r  Encoding: ${Math.round(p.percent)}%   `); })
    .on('end', res).on('error', rej).run();
});
const mb = (statSync(OUT).size/1024/1024).toFixed(1);
console.log(`\n\n✅ Done! ${mb} MB → ${OUT}`);
rmSync(FRAMES_DIR, { recursive: true });
console.log('🧹 Frames cleaned up.');
