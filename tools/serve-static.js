#!/usr/bin/env node
const http = require("http");
const fs = require("fs");
const path = require("path");

const host = process.env.HOST || "127.0.0.1";
const port = Number(process.env.PORT || 8001);
const rootDir = path.resolve(__dirname, "..");

const mimeTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".mjs": "application/javascript; charset=utf-8",
  ".mp3": "audio/mpeg",
  ".png": "image/png",
  ".svg": "image/svg+xml; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".webp": "image/webp",
};

function send(res, status, headers, body) {
  res.writeHead(status, headers);
  res.end(body);
}

function resolvePath(urlPath) {
  const normalized = path.normalize(decodeURIComponent(urlPath)).replace(/^(\.\.[/\\])+/, "");
  const requested = normalized === "/" ? "/index.html" : normalized;
  const fullPath = path.join(rootDir, requested);
  if (!fullPath.startsWith(rootDir)) return null;
  return fullPath;
}

const server = http.createServer((req, res) => {
  const requestUrl = new URL(req.url || "/", `http://${host}:${port}`);
  const fullPath = resolvePath(requestUrl.pathname);
  if (!fullPath) {
    send(res, 403, { "Content-Type": "text/plain; charset=utf-8" }, "Forbidden");
    return;
  }

  let finalPath = fullPath;
  try {
    const stats = fs.existsSync(finalPath) ? fs.statSync(finalPath) : null;
    if (stats && stats.isDirectory()) {
      finalPath = path.join(finalPath, "index.html");
    }
  } catch (e) {}

  fs.readFile(finalPath, (err, buffer) => {
    if (err) {
      send(res, 404, { "Content-Type": "text/plain; charset=utf-8" }, "Not found");
      return;
    }

    const ext = path.extname(finalPath).toLowerCase();
    send(res, 200, { "Content-Type": mimeTypes[ext] || "application/octet-stream" }, buffer);
  });
});

server.listen(port, host, () => {
  console.log(`Static test server running at http://${host}:${port}`);
});
