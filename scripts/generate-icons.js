import fs from "fs";
import path from "path";
import sharp from "sharp";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const outputDir = path.join(__dirname, "..", "public");

// Ensure output directory exists
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Generate a simple gradient SVG with "JR" text
const generateIconSVG = (size) => `
<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#3b82f6;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#6366f1;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" fill="url(#grad)" rx="${size * 0.15}" />
  <text
    x="50%"
    y="50%"
    text-anchor="middle"
    dominant-baseline="central"
    font-family="Arial, sans-serif"
    font-size="${size * 0.45}"
    font-weight="bold"
    fill="white"
  >JR</text>
</svg>
`;

const generateIcons = async () => {
  try {
    console.log("Generating application icons...");

    // Generate PNG icon (512x512) for Linux
    const svgBuffer512 = Buffer.from(generateIconSVG(512));
    await sharp(svgBuffer512)
      .resize(512, 512)
      .png()
      .toFile(path.join(outputDir, "icon.png"));
    console.log("✓ Generated icon.png (512x512)");

    // Generate ICO icon for Windows (256x256)
    const svgBuffer256 = Buffer.from(generateIconSVG(256));
    await sharp(svgBuffer256)
      .resize(256, 256)
      .png()
      .toFile(path.join(outputDir, "icon-256.png"));
    console.log("✓ Generated icon-256.png (for Windows .ico)");

    // Note: electron-forge will automatically convert PNG to ICO for Windows
    // and will handle ICNS generation for macOS if needed

    console.log("\n✅ All icons generated successfully!");
    console.log("   Location:", outputDir);
  } catch (error) {
    console.error("❌ Error generating icons:", error);
    process.exit(1);
  }
};

generateIcons();
