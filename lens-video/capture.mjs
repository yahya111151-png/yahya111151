import puppeteer from 'puppeteer';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegStatic from 'ffmpeg-static';
import { mkdirSync, readdirSync, rmSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const FRAMES_DIR = resolve(__dirname, 'frames');
const OUT_FILE = resolve(__dirname, 'lens-hook-reel.mp4');
const HTML_FILE = `file:///${resolve(__dirname, 'video.html').replace(/\\/g,'/')}`;

const FPS = 30;
const DURATION = 15; // seconds
const TOTAL_FRAMES = FPS * DURATION; // 450 frames
const W = 1080;
const H = 1920;

// Clean frames dir
try { rmSync(FRAMES_DIR, { recursive: true }); } catch(e){}
mkdirSync(FRAMES_DIR, { recursive: true });

console.log(`🎬 Launching browser...`);
const browser = await puppeteer.launch({
  headless: 'new',
  args: ['--no-sandbox', '--disable-setuid-sandbox', `--window-size=${W},${H}`]
});

const page = await browser.newPage();
await page.setViewport({ width: W, height: H, deviceScaleFactor: 1 });

console.log(`📄 Loading video template...`);
await page.goto(HTML_FILE, { waitUntil: 'domcontentloaded' });

// Wait for fonts / initial paint
await new Promise(r => setTimeout(r, 500));

console.log(`🖼  Capturing ${TOTAL_FRAMES} frames at ${FPS}fps...`);
const start = Date.now();

for (let i = 0; i < TOTAL_FRAMES; i++) {
  const t = i / (TOTAL_FRAMES - 1); // 0 to 1

  // Set scene state
  await page.evaluate((t) => { window.renderFrame(t); }, t);

  // Small settle time for CSS transitions on first few frames
  if (i < 5) await new Promise(r => setTimeout(r, 50));

  const framePath = resolve(FRAMES_DIR, `frame${String(i).padStart(5,'0')}.png`);
  await page.screenshot({ path: framePath, clip: { x:0, y:0, width:W, height:H } });

  if (i % 30 === 0) {
    const elapsed = ((Date.now()-start)/1000).toFixed(1);
    const pct = ((i/TOTAL_FRAMES)*100).toFixed(0);
    console.log(`  ${pct}% — frame ${i}/${TOTAL_FRAMES} (${elapsed}s elapsed)`);
  }
}

await browser.close();
console.log(`✅ Frames captured in ${((Date.now()-start)/1000).toFixed(1)}s`);

// ── Encode to MP4 ──
console.log(`\n🎞  Encoding MP4 with ffmpeg...`);
ffmpeg.setFfmpegPath(ffmpegStatic);

await new Promise((resolve, reject) => {
  ffmpeg()
    .input(resolve(__dirname, 'frames/frame%05d.png'))
    .inputOptions([`-framerate ${FPS}`])
    .videoCodec('libx264')
    .outputOptions([
      '-pix_fmt yuv420p',
      '-crf 18',
      '-preset slow',
      '-movflags +faststart',
      `-vf scale=${W}:${H}`,
    ])
    .output(OUT_FILE)
    .on('progress', (p) => {
      if (p.percent) process.stdout.write(`\r  Encoding: ${p.percent.toFixed(0)}%   `);
    })
    .on('end', resolve)
    .on('error', reject)
    .run();
});

console.log(`\n\n✅ Done! Video saved to:\n   ${OUT_FILE}`);
console.log(`   Size: ${(require('fs').statSync(OUT_FILE).size/1024/1024).toFixed(1)} MB`);

// Clean up frames
rmSync(FRAMES_DIR, { recursive: true });
console.log(`🧹 Frames cleaned up.`);
