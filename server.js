import http from "http";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 3000;
const DIST_DIR = path.join(__dirname, "dist");

const MIME_TYPES = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
};

const server = http.createServer((req, res) => {
  let filePath = req.url.split("?")[0];

  if (filePath === "/" || !path.extname(filePath)) {
    filePath = "/index.html";
  }

  const fullPath = path.join(DIST_DIR, filePath);
  const extname = path.extname(fullPath);
  const contentType = MIME_TYPES[extname] || "application/octet-stream";

  fs.readFile(fullPath, (error, content) => {
    if (error) {
      if (error.code === "ENOENT") {
        fs.readFile(path.join(DIST_DIR, "index.html"), (err, indexContent) => {
          if (err) {
            res.writeHead(404);
            res.end("File not found");
          } else {
            res.writeHead(200, { "Content-Type": "text/html" });
            res.end(indexContent, "utf-8");
          }
        });
      } else {
        res.writeHead(500);
        res.end(`Server Error: ${error.code}`);
      }
    } else {
      res.writeHead(200, { "Content-Type": contentType });
      res.end(content, "utf-8");
    }
  });
});

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}/`);
  console.log("Press Ctrl+C to stop");
});
