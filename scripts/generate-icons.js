/**
 * Generate PWA icons for Posthumous using sharp
 * Creates 192x192 and 512x512 PNG icons with the brand color
 */
const sharp = require("sharp");
const path = require("path");
const fs = require("fs");

const publicDir = path.join(__dirname, "..", "public");
const PRIMARY = "#4a6fa5";

// SVG template for the icon
function buildSvg(size) {
  const padding = Math.round(size * 0.15);
  const innerSize = size - padding * 2;
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2;

  // Letter "P" in a circle with dove silhouette
  const fontSize = Math.round(size * 0.42);
  const doveSize = Math.round(size * 0.28);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#5a7fb5"/>
      <stop offset="100%" stop-color="#3a5f95"/>
    </linearGradient>
  </defs>
  <!-- Background circle -->
  <circle cx="${cx}" cy="${cy}" r="${r}" fill="url(#bg)"/>
  <!-- White P letter -->
  <text
    x="${cx}"
    y="${Math.round(cy + fontSize * 0.36)}"
    font-family="Arial, Helvetica, sans-serif"
    font-size="${fontSize}"
    font-weight="700"
    text-anchor="middle"
    fill="white"
    opacity="0.95"
  >P</text>
  <!-- Subtle dove icon above letter -->
  <text
    x="${cx}"
    y="${Math.round(cy - fontSize * 0.18)}"
    font-family="Arial, Helvetica, sans-serif"
    font-size="${doveSize}"
    text-anchor="middle"
    fill="white"
    opacity="0.4"
  >🕊</text>
</svg>`;
}

async function generateIcon(size, filename) {
  const svgBuffer = Buffer.from(buildSvg(size));
  const outPath = path.join(publicDir, filename);
  await sharp(svgBuffer).png().resize(size, size).toFile(outPath);
  console.log(`Generated: ${filename} (${size}x${size})`);
}

async function main() {
  await generateIcon(192, "icon-192x192.png");
  await generateIcon(512, "icon-512x512.png");
  // Also generate apple-touch-icon
  await generateIcon(180, "apple-touch-icon.png");
  console.log("All icons generated successfully!");
}

main().catch(console.error);
