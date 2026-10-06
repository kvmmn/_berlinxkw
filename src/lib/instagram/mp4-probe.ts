/** Lightweight MP4 metadata from a partial file buffer (ftyp + moov). */

export type Mp4ProbeResult = {
  durationSec?: number;
  width?: number;
  height?: number;
  aspectRatio?: number;
  errors: string[];
};

function readU32(buf: Buffer, offset: number): number {
  if (offset + 4 > buf.length) return 0;
  return buf.readUInt32BE(offset);
}

function readU64(buf: Buffer, offset: number): bigint {
  if (offset + 8 > buf.length) return BigInt(0);
  return buf.readBigUInt64BE(offset);
}

function findBox(buf: Buffer, type: string, start = 0, end = buf.length): number {
  let offset = start;
  while (offset + 8 <= end && offset + 8 <= buf.length) {
    let size = readU32(buf, offset);
    const boxType = buf.toString("ascii", offset + 4, offset + 8);
    let header = 8;
    if (size === 1 && offset + 16 <= buf.length) {
      size = Number(readU64(buf, offset + 8));
      header = 16;
    }
    if (size < header) break;
    if (boxType === type) return offset;
    offset += size;
  }
  return -1;
}

function mvhdDurationSec(buf: Buffer, mvhdOffset: number): number | undefined {
  const version = buf[mvhdOffset + 8];
  if (version === 0) {
    const timescale = readU32(buf, mvhdOffset + 20);
    const duration = readU32(buf, mvhdOffset + 24);
    if (!timescale) return undefined;
    return duration / timescale;
  }
  if (version === 1) {
    const timescale = readU32(buf, mvhdOffset + 28);
    const duration = Number(readU64(buf, mvhdOffset + 32));
    if (!timescale) return undefined;
    return duration / timescale;
  }
  return undefined;
}

function tkhdDimensions(buf: Buffer, tkhdOffset: number): { width: number; height: number } | null {
  const version = buf[tkhdOffset + 8];
  const base = version === 0 ? tkhdOffset + 8 + 4 + 4 + 4 + 4 + 4 + 4 + 4 + 4 + 2 + 2 + 2 + 2 + 36 : tkhdOffset + 8 + 8 + 8 + 8 + 8 + 4 + 4 + 4 + 4 + 2 + 2 + 2 + 2 + 36;
  if (base + 8 > buf.length) return null;
  const width = readU32(buf, base) / 65536;
  const height = readU32(buf, base + 4) / 65536;
  if (width <= 0 || height <= 0) return null;
  return { width, height };
}

export function probeMp4Buffer(buf: Buffer): Mp4ProbeResult {
  const errors: string[] = [];
  const ftyp = findBox(buf, "ftyp");
  if (ftyp < 0) {
    errors.push("Not a valid MP4 (missing ftyp).");
    return { errors };
  }

  const moov = findBox(buf, "moov");
  if (moov < 0) {
    errors.push("Could not read MP4 metadata (moov atom not in fetched range).");
    return { errors };
  }

  const mvhd = findBox(buf, "mvhd", moov + 8, moov + readU32(buf, moov));
  const durationSec = mvhd >= 0 ? mvhdDurationSec(buf, mvhd) : undefined;

  let width: number | undefined;
  let height: number | undefined;
  const trak = findBox(buf, "trak", moov + 8, moov + readU32(buf, moov));
  if (trak >= 0) {
    const mdia = findBox(buf, "mdia", trak + 8, trak + readU32(buf, trak));
    if (mdia >= 0) {
      const minf = findBox(buf, "minf", mdia + 8, mdia + readU32(buf, mdia));
      if (minf >= 0) {
        const stbl = findBox(buf, "stbl", minf + 8, minf + readU32(buf, minf));
        if (stbl >= 0) {
          const tkhd = findBox(buf, "tkhd", trak + 8, trak + readU32(buf, trak));
          if (tkhd >= 0) {
            const dims = tkhdDimensions(buf, tkhd);
            if (dims) {
              width = Math.round(dims.width);
              height = Math.round(dims.height);
            }
          }
        }
      }
    }
  }

  const aspectRatio =
    width != null && height != null
      ? Math.round((width / height) * 1000) / 1000
      : undefined;

  return { durationSec, width, height, aspectRatio, errors };
}
