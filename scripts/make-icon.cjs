const fs = require("node:fs");
const path = require("node:path");
const zlib = require("node:zlib");

const size = 256;
const center = size / 2;
const pixels = Buffer.alloc((size * 4 + 1) * size);

for (let y = 0; y < size; y += 1) {
  const row = y * (size * 4 + 1);
  pixels[row] = 0;
  for (let x = 0; x < size; x += 1) {
    const offset = row + 1 + x * 4;
    const dx = x - center;
    const dy = y - center;
    const radius = Math.hypot(dx, dy);
    let red = 0;
    let green = 0;
    let blue = 0;
    let alpha = 0;

    if (radius < 116) {
      const highlight = Math.max(0, 1 - Math.hypot(x - 92, y - 76) / 122);
      const depth = Math.min(1, radius / 116);
      red = Math.round(95 + 118 * highlight - 38 * depth);
      green = Math.round(64 + 99 * highlight - 42 * depth);
      blue = Math.round(196 + 57 * highlight - 8 * depth);
      alpha = 255;
      if (radius > 110) {
        red = 65;
        green = 39;
        blue = 151;
      }
    }

    const eyeLeft = Math.pow((x - 96) / 10, 2) + Math.pow((y - 126) / 16, 2) < 1;
    const eyeRight = Math.pow((x - 148) / 10, 2) + Math.pow((y - 126) / 16, 2) < 1;
    const smile = y > 157 && y < 172 && Math.pow((x - 122) / 30, 2) + Math.pow((y - 151) / 24, 2) < 1 && y > 162;
    const sparkle = Math.abs(x - 185) + Math.abs(y - 67) < 18 || (Math.abs(x - 185) < 4 && Math.abs(y - 67) < 28);
    if (eyeLeft || eyeRight || smile) [red, green, blue, alpha] = [33, 19, 95, 255];
    if (sparkle) [red, green, blue, alpha] = [255, 255, 255, 255];

    pixels[offset] = red;
    pixels[offset + 1] = green;
    pixels[offset + 2] = blue;
    pixels[offset + 3] = alpha;
  }
}

const crcTable = new Uint32Array(256).map((_, index) => {
  let value = index;
  for (let bit = 0; bit < 8; bit += 1) value = (value >>> 1) ^ (value & 1 ? 0xedb88320 : 0);
  return value >>> 0;
});

function crc32(data) {
  let crc = 0xffffffff;
  for (const byte of data) crc = (crc >>> 8) ^ crcTable[(crc ^ byte) & 0xff];
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const typeBuffer = Buffer.from(type);
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const checksum = Buffer.alloc(4);
  checksum.writeUInt32BE(crc32(Buffer.concat([typeBuffer, data])));
  return Buffer.concat([length, typeBuffer, data, checksum]);
}

const header = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(size, 0);
ihdr.writeUInt32BE(size, 4);
ihdr[8] = 8;
ihdr[9] = 6;
const png = Buffer.concat([header, chunk("IHDR", ihdr), chunk("IDAT", zlib.deflateSync(pixels)), chunk("IEND", Buffer.alloc(0))]);

const iconHeader = Buffer.alloc(6);
iconHeader.writeUInt16LE(0, 0);
iconHeader.writeUInt16LE(1, 2);
iconHeader.writeUInt16LE(1, 4);
const entry = Buffer.alloc(16);
entry[0] = 0;
entry[1] = 0;
entry.writeUInt16LE(1, 4);
entry.writeUInt16LE(32, 6);
entry.writeUInt32LE(png.length, 8);
entry.writeUInt32LE(22, 12);

const output = path.join(__dirname, "..", "build", "diya.ico");
fs.mkdirSync(path.dirname(output), { recursive: true });
fs.writeFileSync(output, Buffer.concat([iconHeader, entry, png]));
console.log(`Wrote ${output}`);
