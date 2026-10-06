/** Lightweight MP4 metadata from a partial file buffer (ftyp + moov). */

export type Mp4ProbeResult = {
  durationSec?: number;
  width?: number;
  height?: number;
  aspectRatio?: number;
  errors: string[];
  warnings: string[];
};

function readU32(buf: Buffer, offset: number): number {
  if (offset + 4 > buf.length) return 0;
  return buf.readUInt32BE(offset);
}

function readU64(buf: Buffer, offset: number): bigint {
  if (offset + 8 > buf.length) return BigInt(0);
  return buf.readBigUInt64BE(offset);
}

function boxEnd(buf: Buffer, offset: number): number {
  let size = readU32(buf, offset);
  let header = 8;
  if (size === 1 && offset + 16 <= buf.length) {
    size = Number(readU64(buf, offset + 8));
    header = 16;
  }
  if (size < header) return offset + header;
  return offset + size;
}

function findBox(buf: Buffer, type: string, start = 0, end = buf.length): number {
  let offset = start;
  while (offset + 8 <= end && offset + 8 <= buf.length) {
    const boxType = buf.toString("ascii", offset + 4, offset + 8);
    const next = boxEnd(buf, offset);
    if (boxType === type) return offset;
    if (next <= offset) break;
    offset = next;
  }
  return -1;
}

function forEachBox(
  buf: Buffer,
  start: number,
  end: number,
  visit: (type: string, offset: number) => void,
): void {
  let offset = start;
  while (offset + 8 <= end && offset + 8 <= buf.length) {
    const boxType = buf.toString("ascii", offset + 4, offset + 8);
    const next = boxEnd(buf, offset);
    visit(boxType, offset);
    if (next <= offset) break;
    offset = next;
  }
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

function hdlrIsVideoTrack(buf: Buffer, trakOffset: number, trakEnd: number): boolean {
  const mdia = findBox(buf, "mdia", trakOffset + 8, trakEnd);
  if (mdia < 0) return false;
  const mdiaEnd = boxEnd(buf, mdia);
  const hdlr = findBox(buf, "hdlr", mdia + 8, mdiaEnd);
  if (hdlr < 0) return false;
  const handlerType = buf.toString("ascii", hdlr + 16, hdlr + 20);
  return handlerType === "vide";
}

function tkhdDisplayDimensions(
  buf: Buffer,
  tkhdOffset: number,
): { width: number; height: number } | null {
  const version = buf[tkhdOffset + 8];
  // ISO/IEC 14496-12 tkhd: matrix begins after layer/alt/volume (v0 @48, v1 @60); width/height fixed-point @84/@96.
  const matrixStart = version === 0 ? tkhdOffset + 48 : tkhdOffset + 60;
  const dimStart = version === 0 ? tkhdOffset + 84 : tkhdOffset + 96;
  if (dimStart + 8 > buf.length || matrixStart + 36 > buf.length) return null;

  let width = readU32(buf, dimStart) / 65536;
  let height = readU32(buf, dimStart + 4) / 65536;
  if (width <= 0 || height <= 0) return null;

  // 3×3 display matrix stored as 9 signed 16.16 values: a,b,u,c,d,v,x,y,w (skip u,v,w for rotation).
  const readFixed = (off: number) => buf.readInt32BE(off) / 65536;
  const a = readFixed(matrixStart);
  const b = readFixed(matrixStart + 4);
  const c = readFixed(matrixStart + 12);
  const d = readFixed(matrixStart + 16);

  const rotated90or270 =
    Math.abs(a) < 0.01 && Math.abs(d) < 0.01 && Math.abs(b) > 0.5 && Math.abs(c) > 0.5;

  if (rotated90or270) {
    [width, height] = [height, width];
  }

  return { width, height };
}

function findVideoTkhd(buf: Buffer, moovOffset: number, moovEnd: number): number {
  let found = -1;
  forEachBox(buf, moovOffset + 8, moovEnd, (type, offset) => {
    if (type !== "trak" || found >= 0) return;
    const trakEnd = boxEnd(buf, offset);
    if (!hdlrIsVideoTrack(buf, offset, trakEnd)) return;
    const tkhd = findBox(buf, "tkhd", offset + 8, trakEnd);
    if (tkhd >= 0) found = tkhd;
  });
  return found;
}

export function probeMp4Buffer(buf: Buffer): Mp4ProbeResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const ftyp = findBox(buf, "ftyp");
  if (ftyp < 0) {
    errors.push("Not a valid MP4 (missing ftyp).");
    return { errors, warnings };
  }

  const moov = findBox(buf, "moov");
  if (moov < 0) {
    errors.push(
      "Could not read MP4 metadata (moov atom not in fetched range). Re-encode with ffmpeg -movflags +faststart.",
    );
    return { errors, warnings };
  }

  const moovEnd = boxEnd(buf, moov);
  const mvhd = findBox(buf, "mvhd", moov + 8, moovEnd);
  const durationSec = mvhd >= 0 ? mvhdDurationSec(buf, mvhd) : undefined;

  let width: number | undefined;
  let height: number | undefined;
  const tkhd = findVideoTkhd(buf, moov, moovEnd);
  if (tkhd >= 0) {
    const dims = tkhdDisplayDimensions(buf, tkhd);
    if (dims) {
      width = Math.round(dims.width);
      height = Math.round(dims.height);
    }
  }

  if (durationSec == null) {
    errors.push("Could not read MP4 duration from metadata.");
  }
  if (width == null || height == null) {
    errors.push("Could not read MP4 video track dimensions (ensure a video track is present).");
  }

  const aspectRatio =
    width != null && height != null
      ? Math.round((width / height) * 1000) / 1000
      : undefined;

  return { durationSec, width, height, aspectRatio, errors, warnings };
}
