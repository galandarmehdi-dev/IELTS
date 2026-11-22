// Minimal ZIP reader (stored + deflate) built on DecompressionStream. No dependencies.
const u16 = (v, o) => v.getUint16(o, true);
const u32 = (v, o) => v.getUint32(o, true);

async function inflateRaw(bytes) {
  const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream("deflate-raw"));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

export function listZipEntries(buffer) {
  const bytes = new Uint8Array(buffer);
  const view = new DataView(buffer);
  let eocd = -1;
  for (let i = bytes.length - 22; i >= Math.max(0, bytes.length - 65557); i -= 1) {
    if (u32(view, i) === 0x06054b50) {
      eocd = i;
      break;
    }
  }
  if (eocd < 0) throw new Error("Not a valid ZIP file.");
  const count = u16(view, eocd + 10);
  let p = u32(view, eocd + 16);
  const entries = [];
  const decoder = new TextDecoder();
  for (let n = 0; n < count; n += 1) {
    if (u32(view, p) !== 0x02014b50) throw new Error("ZIP central directory is damaged.");
    const flags = u16(view, p + 8);
    const method = u16(view, p + 10);
    const compressedSize = u32(view, p + 20);
    const size = u32(view, p + 24);
    const nameLen = u16(view, p + 28);
    const extraLen = u16(view, p + 30);
    const commentLen = u16(view, p + 32);
    const offset = u32(view, p + 42);
    const name = decoder.decode(bytes.subarray(p + 46, p + 46 + nameLen));
    entries.push({ name, method, compressedSize, size, offset, encrypted: (flags & 1) === 1 });
    p += 46 + nameLen + extraLen + commentLen;
  }
  return entries;
}

export async function readZipEntry(buffer, entry) {
  if (entry.encrypted) throw new Error(`${entry.name} is password protected.`);
  const view = new DataView(buffer);
  const bytes = new Uint8Array(buffer);
  if (u32(view, entry.offset) !== 0x04034b50) throw new Error(`${entry.name}: bad local header.`);
  const start = entry.offset + 30 + u16(view, entry.offset + 26) + u16(view, entry.offset + 28);
  const raw = bytes.subarray(start, start + entry.compressedSize);
  if (entry.method === 0) return raw;
  if (entry.method === 8) return inflateRaw(raw);
  throw new Error(`${entry.name}: unsupported compression method ${entry.method}.`);
}

// Returns [{ name, bytes }] for HTML files only, skipping folders, hidden/macOS metadata and oversized files.
export async function readZipHtmlFiles(buffer, { maxFileBytes = 5 * 1024 * 1024, maxFiles = 1000 } = {}) {
  const entries = listZipEntries(buffer).filter((e) => /\.html?$/i.test(e.name) && !/(^|\/)(__MACOSX|\.)/.test(e.name) && !e.name.endsWith("/"));
  if (entries.length > maxFiles) throw new Error(`ZIP has ${entries.length} HTML files; the limit is ${maxFiles} per batch.`);
  const files = [];
  for (const entry of entries) {
    if (entry.size > maxFileBytes) {
      files.push({ name: entry.name, error: "File is larger than 5 MB." });
      continue;
    }
    try {
      files.push({ name: entry.name, bytes: await readZipEntry(buffer, entry) });
    } catch (e) {
      files.push({ name: entry.name, error: e.message });
    }
  }
  return files;
}
