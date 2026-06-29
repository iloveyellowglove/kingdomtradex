const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const sizes = [16, 32, 72, 96, 128, 144, 152, 180, 192, 384, 512];
const svgPath = path.join(__dirname, '..', 'src', 'app', 'icon.svg');
const publicDir = path.join(__dirname, '..', 'public');

const BG_COLOR = { r: 11, g: 14, b: 17, alpha: 1 };

async function generate() {
  const svgBuffer = fs.readFileSync(svgPath);

  // Generate standard PNG icons
  for (const size of sizes) {
    await sharp(svgBuffer)
      .resize(size, size)
      .png()
      .toFile(path.join(publicDir, `icon-${size}.png`));
    console.log(`Generated icon-${size}.png`);
  }

  // Generate maskable icon (with safe-zone padding on background)
  await sharp(svgBuffer)
    .resize(430, 430, { fit: 'contain', background: BG_COLOR })
    .extend({ top: 41, bottom: 41, left: 41, right: 41, background: BG_COLOR })
    .png()
    .toFile(path.join(publicDir, 'maskable-icon-512.png'));
  console.log('Generated maskable-icon-512.png');

  // Generate favicon PNGs
  await sharp(svgBuffer).resize(16, 16).png().toFile(path.join(publicDir, 'favicon-16x16.png'));
  await sharp(svgBuffer).resize(32, 32).png().toFile(path.join(publicDir, 'favicon-32x32.png'));
  console.log('Generated favicon PNGs');

  // Generate iOS splash screens (solid background + centered icon)
  const splashSizes = [
    { width: 750, height: 1334 },   // iPhone 6/7/8/SE2
    { width: 828, height: 1792 },   // iPhone XR/11
    { width: 1170, height: 2532 },  // iPhone 12/13/14 Pro
    { width: 1179, height: 2556 },  // iPhone 14/15/16 Pro
    { width: 1290, height: 2796 },  // iPhone 14/15 Pro Max
  ];

  for (const { width, height } of splashSizes) {
    const iconSize = Math.round(Math.min(width, height) * 0.2);
    const icon = await sharp(svgBuffer).resize(iconSize, iconSize).png().toBuffer();
    await sharp({
      create: { width, height, channels: 4, background: BG_COLOR }
    })
      .composite([{ input: icon, gravity: 'centre' }])
      .png()
      .toFile(path.join(publicDir, `splash-${width}x${height}.png`));
    console.log(`Generated splash-${width}x${height}.png`);
  }

  console.log('\nAll icons and splash screens generated successfully.');
}

generate().catch(err => { console.error(err); process.exit(1); });
