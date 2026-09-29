/** EXIF orientation tag (0x0112). Values 5–8 imply 90°/270° rotation vs stored SOF dimensions. */
export function jpegExifOrientationFromBuffer(buf: Buffer): number | null {
  if (buf.length < 4 || buf[0] !== 0xff || buf[1] !== 0xd8) return null;

  let i = 2;
  while (i + 4 < buf.length) {
    if (buf[i] !== 0xff) {
      i += 1;
      continue;
    }
    const marker = buf[i + 1];
    if (marker === 0xd9 || marker === 0xda) break;

    const len = buf.readUInt16BE(i + 2);
    if (len < 2 || i + 2 + len > buf.length) break;

    // APP1 Exif
    if (marker === 0xe1 && len >= 8) {
      const start = i + 4;
      const header = buf.toString("ascii", start, start + 6);
      if (header === "Exif\0\0") {
        const tiff = start + 6;
        if (tiff + 8 > buf.length) break;
        const le = buf[tiff] === 0x49 && buf[tiff + 1] === 0x49;
        const be = buf[tiff] === 0x4d && buf[tiff + 1] === 0x4d;
        if (!le && !be) {
          i += 2 + len;
          continue;
        }
        const u16 = (off: number) => (le ? buf.readUInt16LE(off) : buf.readUInt16BE(off));
        const u32 = (off: number) => (le ? buf.readUInt32LE(off) : buf.readUInt32BE(off));
        const ifd0 = tiff + u32(tiff + 4);
        if (ifd0 + 2 > buf.length) break;
        const entries = u16(ifd0);
        const ifdEnd = ifd0 + 2 + entries * 12;
        if (ifdEnd > buf.length) break;
        for (let e = 0; e < entries; e++) {
          const ent = ifd0 + 2 + e * 12;
          const tag = u16(ent);
          if (tag === 0x0112) {
            const value = u16(ent + 8);
            if (value >= 1 && value <= 8) return value;
            return null;
          }
        }
      }
    }

    i += 2 + len;
  }
  return null;
}

function applyExifOrientation(
  width: number,
  height: number,
  orientation: number | null,
): { width: number; height: number } {
  if (orientation !== null && orientation >= 5 && orientation <= 8) {
    return { width: height, height: width };
  }
  return { width, height };
}

/** Parse width/height from JPEG SOF0/SOF2 marker (no external deps). */
export function jpegDimensionsFromBuffer(buf: Buffer): { width: number; height: number } | null {
  if (buf.length < 4 || buf[0] !== 0xff || buf[1] !== 0xd8) return null;

  let i = 2;
  while (i + 3 < buf.length) {
    if (buf[i] !== 0xff) {
      i += 1;
      continue;
    }
    const marker = buf[i + 1];
    if (marker === 0xd9 || marker === 0xda) break;

    const len = buf.readUInt16BE(i + 2);
    if (len < 2 || i + 2 + len > buf.length) break;

    // SOF0, SOF1, SOF2, SOF3, SOF5, SOF6, SOF7, SOF9, SOF10, SOF11, SOF13, SOF15
    if (
      marker === 0xc0 ||
      marker === 0xc1 ||
      marker === 0xc2 ||
      marker === 0xc3 ||
      marker === 0xc5 ||
      marker === 0xc6 ||
      marker === 0xc7 ||
      marker === 0xc9 ||
      marker === 0xca ||
      marker === 0xcb ||
      marker === 0xcd ||
      marker === 0xce ||
      marker === 0xcf
    ) {
      if (i + 7 + 4 <= buf.length) {
        const height = buf.readUInt16BE(i + 5);
        const width = buf.readUInt16BE(i + 7);
        if (width > 0 && height > 0) {
          const orientation = jpegExifOrientationFromBuffer(buf);
          return applyExifOrientation(width, height, orientation);
        }
      }
      return null;
    }

    i += 2 + len;
  }
  return null;
}
