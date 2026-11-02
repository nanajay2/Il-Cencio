// Genera le icone della PWA in public/ a partire da design/icon-source.webp.
// Il soggetto viene separato dallo sfondo usando il canale rosso e ricomposto
// su un verde pieno, così spariscono le imperfezioni del sorgente.
// Uso: node scripts/generate-icons.mjs
import sharp from 'sharp';

const SOURCE = new URL('../design/icon-source.webp', import.meta.url).pathname;
const PUBLIC = new URL('../public/', import.meta.url).pathname;

const BG = [0x1d, 0x6f, 0x5f];
const FG = [0xff, 0xff, 0xff];
const LOW = 70;
const HIGH = 190;

const { data, info } = await sharp(SOURCE).removeAlpha().raw().toBuffer({ resolveWithObject: true });
const { width, height } = info;
const pixels = width * height;
const icon = Buffer.alloc(pixels * 3);
const badge = Buffer.alloc(pixels * 4);

for (let i = 0; i < pixels; i++) {
  const t = Math.min(1, Math.max(0, (data[i * 3] - LOW) / (HIGH - LOW)));
  for (let c = 0; c < 3; c++) {
    icon[i * 3 + c] = Math.round(BG[c] + (FG[c] - BG[c]) * t);
    badge[i * 4 + c] = 255;
  }
  badge[i * 4 + 3] = Math.round(t * 255);
}

const base = () => sharp(icon, { raw: { width, height, channels: 3 } });
const OUTPUTS = [
  ['icon.png', 1024],
  ['icon-512.png', 512],
  ['icon-192.png', 192],
  ['maskable-icon-512.png', 512],
  ['apple-touch-icon.png', 180],
];
for (const [name, size] of OUTPUTS) {
  await base().resize(size, size).png({ compressionLevel: 9 }).toFile(PUBLIC + name);
}

// Badge delle notifiche: Android usa solo l'alpha, quindi soggetto pieno su
// sfondo trasparente e ritagliato per restare leggibile a piccole dimensioni.
const trimmed = await sharp(badge, { raw: { width, height, channels: 4 } }).png().trim().toBuffer();
await sharp(trimmed)
  .resize(168, 168, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
  .extend({ top: 12, bottom: 12, left: 12, right: 12, background: { r: 0, g: 0, b: 0, alpha: 0 } })
  .png({ compressionLevel: 9 })
  .toFile(PUBLIC + 'badge-192.png');
