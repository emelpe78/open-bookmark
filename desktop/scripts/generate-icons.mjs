import { execSync } from "node:child_process";
import { existsSync, mkdirSync, rmSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const desktopRoot = path.resolve(scriptDir, "..");
const repoRoot = path.resolve(desktopRoot, "..");
const source = process.argv[2] ?? path.join(repoRoot, "docs/favicon.png");
const resources = path.join(desktopRoot, "resources");
const masterPng = path.join(resources, "icon.png");
const iconset = path.join(resources, "icon.iconset");
const icnsOut = path.join(resources, "icon.icns");

if (!existsSync(source)) {
  console.error(`Icon source not found: ${source}`);
  process.exit(1);
}

mkdirSync(resources, { recursive: true });

/**
 * Build 1024×1024 master from docs/favicon.png.
 * Black background → alpha so the dock squircle mask shows rounded corners.
 */
async function buildMasterPng() {
  const resized = await sharp(source)
    .ensureAlpha()
    .resize(1024, 1024, {
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .raw()
    .toBuffer({ resolveWithObject: true });

  const pixels = Buffer.from(resized.data);
  for (let i = 0; i < pixels.length; i += 4) {
    const r = pixels[i];
    const g = pixels[i + 1];
    const b = pixels[i + 2];
    if (r < 48 && g < 48 && b < 48) {
      pixels[i + 3] = 0;
    }
  }

  await sharp(pixels, {
    raw: {
      width: resized.info.width,
      height: resized.info.height,
      channels: 4,
    },
  })
    .png()
    .toFile(masterPng);
}

function buildIconset() {
  rmSync(iconset, { recursive: true, force: true });
  mkdirSync(iconset, { recursive: true });

  const sizes = [
    [16, "icon_16x16.png"],
    [32, "icon_16x16@2x.png"],
    [32, "icon_32x32.png"],
    [64, "icon_32x32@2x.png"],
    [128, "icon_128x128.png"],
    [256, "icon_128x128@2x.png"],
    [256, "icon_256x256.png"],
    [512, "icon_256x256@2x.png"],
    [512, "icon_512x512.png"],
    [1024, "icon_512x512@2x.png"],
  ];

  for (const [size, name] of sizes) {
    const out = path.join(iconset, name);
    execSync(
      `sips -z ${size} ${size} "${masterPng}" --out "${out}"`,
      { stdio: "ignore" },
    );
  }

  execSync(`iconutil -c icns "${iconset}" -o "${icnsOut}"`, { stdio: "inherit" });
  rmSync(iconset, { recursive: true, force: true });
}

await buildMasterPng();
buildIconset();
console.log(`Generated ${masterPng} and ${icnsOut} from ${source}`);
