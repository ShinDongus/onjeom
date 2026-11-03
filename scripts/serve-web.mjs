import http from "node:http";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
const root = fileURLToPath(new URL("../", import.meta.url));
const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css",
  ".mjs": "text/javascript",
  ".js": "text/javascript",
  ".json": "application/json",
  ".svg": "image/svg+xml",
};
http
  .createServer(async (req, res) => {
    try {
      let url = new URL(req.url, "http://localhost").pathname;
      if (url === "/") url = "/web/";
      if (url === "/web/") url = "/web/index.html";
      if (!/^\/(web\/|src\/(logic|separator)\.mjs$)/.test(url)) throw Error();
      const file = path.resolve(root, "." + decodeURIComponent(url));
      if (!file.startsWith(root)) throw Error();
      const data = await readFile(file);
      res.writeHead(200, {
        "Content-Type": types[path.extname(file)] || "text/plain",
        "Service-Worker-Allowed": "/",
        "Cache-Control": "no-cache",
      });
      res.end(data);
    } catch {
      res.writeHead(404);
      res.end("Not found");
    }
  })
  .listen(Number(process.env.PORT || 4173), "127.0.0.1", () =>
    console.log("Prototype server ready on port " + (process.env.PORT || 4173)),
  );
