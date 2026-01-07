import http from "http";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { exec } from "child_process";
import { platform } from "os";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;
const DIST_DIR = path.join(__dirname, "dist");

function openBrowser(url) {
  const osPlatform = platform();

  let command;
  switch (osPlatform) {
    case "darwin": // macOS
      command = `open "${url}"`;
      break;
    case "win32": // Windows
      command = `start "${url}"`;
      break;
    default: // Linux и другие
      command = `xdg-open "${url}"`;
      break;
  }

  exec(command, (error) => {
    if (error) {
      console.log(`Не удалось открыть браузер: ${error.message}`);
      console.log(`Откройте вручную: ${url}`);
    }
  });
}

const server = http.createServer((req, res) => {
  const filePath = req.url === "/" ? "index.html" : req.url.slice(1);
  const fullPath = path.join(DIST_DIR, filePath);

  fs.readFile(fullPath, (err, data) => {
    if (err) {
      // Если файл не найден, отдаем index.html для SPA
      fs.readFile(path.join(DIST_DIR, "index.html"), (err2, indexData) => {
        if (err2) {
          res.writeHead(404, { "Content-Type": "text/plain" });
          res.end("404 - Page Not Found");
        } else {
          res.writeHead(200, { "Content-Type": "text/html" });
          res.end(indexData);
        }
      });
    } else {
      const ext = path.extname(fullPath);
      const mimeTypes = {
        ".html": "text/html",
        ".js": "text/javascript",
        ".css": "text/css",
        ".json": "application/json",
        ".png": "image/png",
        ".jpg": "image/jpeg",
        ".svg": "image/svg+xml",
      };

      const contentType = mimeTypes[ext] || "application/octet-stream";
      res.writeHead(200, { "Content-Type": contentType });
      res.end(data);
    }
  });
});

server.listen(PORT, () => {
  const url = `http://localhost:${PORT}`;

  if (process.env.NODE_ENV !== "production") {
    openBrowser(url);
  }
});
