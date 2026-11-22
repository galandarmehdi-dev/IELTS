import test from "node:test";
import assert from "node:assert/strict";
import { deflateRawSync } from "node:zlib";
import { readZipHtmlFiles } from "../assets/js/converter/zipReader.mjs";
import { validateImportedExam } from "../src/importedExams.mjs";

function crc32(buf) {
  let c, crc = 0xffffffff;
  for (let n = 0; n < buf.length; n += 1) {
    c = (crc ^ buf[n]) & 0xff;
    for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    crc = (crc >>> 8) ^ c;
  }
  return (crc ^ 0xffffffff) >>> 0;
}
function makeZip(files) {
  const chunks = [];
  const central = [];
  let offset = 0;
  for (const { name, data, deflate } of files) {
    const nameBuf = Buffer.from(name);
    const raw = Buffer.from(data);
    const body = deflate ? deflateRawSync(raw) : raw;
    const h = Buffer.alloc(30);
    h.writeUInt32LE(0x04034b50, 0); h.writeUInt16LE(20, 4); h.writeUInt16LE(deflate ? 8 : 0, 8);
    h.writeUInt32LE(crc32(raw), 14); h.writeUInt32LE(body.length, 18); h.writeUInt32LE(raw.length, 22); h.writeUInt16LE(nameBuf.length, 26);
    chunks.push(h, nameBuf, body);
    const c = Buffer.alloc(46);
    c.writeUInt32LE(0x02014b50, 0); c.writeUInt16LE(20, 4); c.writeUInt16LE(20, 6); c.writeUInt16LE(deflate ? 8 : 0, 10);
    c.writeUInt32LE(crc32(raw), 16); c.writeUInt32LE(body.length, 20); c.writeUInt32LE(raw.length, 24); c.writeUInt16LE(nameBuf.length, 28); c.writeUInt32LE(offset, 42);
    central.push(c, nameBuf);
    offset += 30 + nameBuf.length + body.length;
  }
  const cd = Buffer.concat(central);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0); end.writeUInt16LE(files.length, 8); end.writeUInt16LE(files.length, 10); end.writeUInt32LE(cd.length, 12); end.writeUInt32LE(offset, 16);
  const all = Buffer.concat([...chunks, cd, end]);
  return all.buffer.slice(all.byteOffset, all.byteOffset + all.length);
}

test("zip reader extracts stored and deflated HTML, skipping folders, metadata and other files", async () => {
  const zip = makeZip([
    { name: "tests/a.html", data: "<p>Alpha</p>".repeat(50), deflate: true },
    { name: "tests/b.htm", data: "<p>Beta</p>", deflate: false },
    { name: "tests/", data: "" },
    { name: "__MACOSX/tests/._a.html", data: "junk" },
    { name: "tests/readme.txt", data: "no" },
  ]);
  const files = await readZipHtmlFiles(zip);
  assert.deepEqual(files.map((f) => f.name), ["tests/a.html", "tests/b.htm"]);
  assert.equal(new TextDecoder().decode(files[0].bytes), "<p>Alpha</p>".repeat(50));
  assert.equal(new TextDecoder().decode(files[1].bytes), "<p>Beta</p>");
});

test("zip reader rejects non-zip input and over-large batches", async () => {
  await assert.rejects(() => readZipHtmlFiles(new ArrayBuffer(64)), /valid ZIP/);
  const zip = makeZip(Array.from({ length: 3 }, (_, i) => ({ name: `f${i}.html`, data: "x" })));
  await assert.rejects(() => readZipHtmlFiles(zip, { maxFiles: 2 }), /limit is 2/);
});

test("validation blocks images that have no usable URL", () => {
  const base = { skill: "reading", title: "T", answerKeys: { 1: "a" } };
  const bad = validateImportedExam({ ...base, content: { reading: { parts: [{ blocks: [{ imageSrc: "/wp-content/x.png" }] }] } } });
  assert.ok(bad.errors.some((e) => /image/i.test(e)));
  const good = validateImportedExam({ ...base, content: { reading: { parts: [{ blocks: [{ imageSrc: "https://x.test/a.png" }] }] } } });
  assert.ok(!good.errors.some((e) => /image/i.test(e)));
  const listening = validateImportedExam({ skill: "listening", title: "T", answerKeys: { 1: "a" }, content: { listening: { audioSrc: "https://x/a.mp3", html: '<img src="/wp-content/m.png">' } } });
  assert.ok(listening.errors.some((e) => /image/i.test(e)));
});
