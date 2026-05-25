import ffmpeg from 'fluent-ffmpeg';
import ffmpegStatic from 'ffmpeg-static';
import { statSync, rmSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const FRAMES_PATTERN = resolve(__dirname, 'frames/frame%05d.png').replace(/\\/g,'/');
const OUT_FILE = resolve(__dirname, 'lens-hook-reel.mp4').replace(/\\/g,'/');
const FPS = 30;
const W = 1080;
const H = 1920;

console.log(`🎞  Encoding MP4...`);
console.log(`   Input:  ${FRAMES_PATTERN}`);
console.log(`   Output: ${OUT_FILE}`);

ffmpeg.setFfmpegPath(ffmpegStatic);

await new Promise((res, rej) => {
  ffmpeg()
    .input(FRAMES_PATTERN)
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
      if (p.percent) process.stdout.write(`\r  Encoding: ${Math.round(p.percent)}%   `);
    })
    .on('end', res)
    .on('error', rej)
    .run();
});

const size = (statSync(OUT_FILE).size / 1024 / 1024).toFixed(1);
console.log(`\n\n✅ Done! ${size} MB`);
console.log(`   ${OUT_FILE}`);

rmSync(resolve(__dirname, 'frames'), { recursive: true });
console.log(`🧹 Frames cleaned up.`);
