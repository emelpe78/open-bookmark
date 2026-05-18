import { existsSync, mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const extensionRoot = path.resolve(scriptDir, "..");
const repoRoot = path.resolve(extensionRoot, "..");
const sourceCandidates = [
  process.argv[2],
  path.join(repoRoot, "desktop/resources/icon.png"),
  path.join(repoRoot, "docs/favicon.png"),
  path.join(repoRoot, "open-bookmark/public/favicon.ico"),
].filter((candidate) => candidate && existsSync(candidate));

const outDir = path.join(extensionRoot, "public/icons");
const sizes = [16, 32, 48, 128];

let source;
for (const candidate of sourceCandidates) {
  try {
    await sharp(candidate).metadata();
    source = candidate;
    break;
  }
  catch {
    // e.g. favicon.ico is not supported by sharp on all platforms
  }
}

if (!source) {
  console.error(
    "No usable icon source found. Expected desktop/resources/icon.png or pass a PNG path.",
  );
  process.exit(1);
}

mkdirSync(outDir, { recursive: true });

for (const size of sizes) {
  const out = path.join(outDir, `icon${size}.png`);
  await sharp(source)
    .resize(size, size, {
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toFile(out);
  console.log(`Wrote ${out}`);
}

console.log(`Generated ${sizes.length} icons from ${source}`);
