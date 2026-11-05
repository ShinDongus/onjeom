import http from "node:http";
import { readFile } from "node:fs/promises";
import { resolve, extname, sep } from "node:path";
const root = resolve("dist-preview");
const base = process.env.ONJEOM_WEB_BASE_PATH || "";
const types = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".webmanifest": "application/manifest+json",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".woff": "font/woff",
  ".ttf": "font/ttf",
  ".otf": "font/otf",
};
http
  .createServer(async (req, res) => {
    try {
      const pathname = decodeURIComponent(
        new URL(req.url, "http://localhost").pathname,
      );
      if (base && pathname === base) {
        res.writeHead(308, { Location: base + "/" });
        res.end();
        return;
      }
      if (base && !pathname.startsWith(base + "/"))
        throw Error("Outside app scope");
      const local = pathname.slice(base.length);
      const file = resolve(
        root,
        "." + (local.endsWith("/") ? local + "index.html" : local),
      );
      if (!file.startsWith(root + sep)) throw Error("Unknown path");
      const content = await readFile(file);
      res.writeHead(200, {
        "Content-Type": types[extname(file)] || "application/octet-stream",
        "Cache-Control": "no-cache",
      });
      res.end(content);
    } catch {
      res.writeHead(404);
      res.end("Not found");
    }
  })
  .listen(4174, "127.0.0.1", () =>
    console.log("React Native browser preview ready on port 4174"),
  );
