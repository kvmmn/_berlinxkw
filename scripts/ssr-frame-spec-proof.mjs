#!/usr/bin/env node
/**
 * SSR frame-spec proof for Sunset 3 artwork (EXIF rotate-90).
 * Fetches the same JPEG bytes the server probes via public origin.
 */
import { writeFile } from "node:fs/promises";
import { orientationFromDimensions, frameSizeLabel } from "../src/lib/tablo-frame-spec.ts";
import { jpegDimensionsFromBuffer } from "../src/lib/instagram/jpeg-dimensions.ts";

const SUNSET_ARTWORK =
  "https://berlinxkw.vercel.app/api/shop/media?pathname=berlinxkw/tablos/tablo-8c0b8c6f-5bff-44a0-9dff-44a74afe9acd/03-berlin-sunset.jpg";

async function main() {
  const res = await fetch(SUNSET_ARTWORK, { headers: { Range: "bytes=0-65535" } });
  const buf = Buffer.from(await res.arrayBuffer());
  const dims = jpegDimensionsFromBuffer(buf);
  const orientation = orientationFromDimensions(dims.width, dims.height);
  const label = frameSizeLabel(orientation);
  const line = `${label} · ${orientation}`;
  const out = [
    `artwork bytes: ${dims.width}×${dims.height}`,
    `frame spec: ${line}`,
    orientation === "portrait" && label.includes("50×70") ? "PASS" : "FAIL",
  ].join("\n");
  console.log(out);
  const dest = process.argv[2];
  if (dest) await writeFile(dest, out);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
