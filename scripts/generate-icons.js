// One-off: regenerates PWA icons + favicon from the real logo.
// Usage: node scripts/generate-icons.js <path-to-logo.png>
const sharp = require('sharp');
const pngToIco = require('png-to-ico').default;
const fs = require('fs');
const path = require('path');

const logoPath = process.argv[2];
if (!logoPath) {
  console.error('Usage: node scripts/generate-icons.js <path-to-logo.png>');
  process.exit(1);
}

const BG = '#222222';
const ICON_SIZES = [72, 96, 128, 144, 152, 192, 384, 512];
const FAVICON_SIZES = [16, 32, 48];
const ICONS_DIR = path.resolve(__dirname, '..', 'public', 'icons');

// Logo occupies ~70% of the square width, centered, to stay inside the
// "safe zone" maskable icons need (the OS may crop to circle/squircle/etc).
async function squareIcon(size) {
  const logoWidth = Math.round(size * 0.7);
  const logoBuffer = await sharp(logoPath).resize({ width: logoWidth }).toBuffer();
  const logoMeta = await sharp(logoBuffer).metadata();
  const logoHeight = logoMeta.height ?? Math.round(logoWidth / 2);

  return sharp({ create: { width: size, height: size, channels: 4, background: BG } })
    .composite([
      {
        input: logoBuffer,
        top: Math.round((size - logoHeight) / 2),
        left: Math.round((size - logoWidth) / 2),
      },
    ])
    .png()
    .toBuffer();
}

async function main() {
  for (const size of ICON_SIZES) {
    const buffer = await squareIcon(size);
    const outPath = path.join(ICONS_DIR, `icon-${size}x${size}.png`);
    fs.writeFileSync(outPath, buffer);
    console.log(`Wrote ${outPath}`);
  }

  const faviconBuffers = await Promise.all(FAVICON_SIZES.map((size) => squareIcon(size)));
  const icoBuffer = await pngToIco(faviconBuffers);
  const faviconPath = path.resolve(__dirname, '..', 'public', 'favicon.ico');
  fs.writeFileSync(faviconPath, icoBuffer);
  console.log(`Wrote ${faviconPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
