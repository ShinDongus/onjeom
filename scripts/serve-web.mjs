import http from "node:http";
import { readFile } from "node:fs/promises";
const routes = new Map([
  ["/", "web/index.html"],
  ["/index.html", "web/index.html"],
  ["/styles.css", "prototype/styles.css"],
  ["/patch.css", "web/patch.css"],
  ["/manifest.webmanifest", "prototype/manifest.webmanifest"],
  ["/assets/icon.svg", "prototype/assets/icon.svg"],
  ["/sw.js", "web/sw.js"],
  ["/src/app.mjs", "web/app.mjs"],
  ["/src/logic.mjs", "prototype/src/logic.mjs"],
  ...["mobile-domain", "legacy-mobile", "seasonal", "season-calendar"].map(
    (n) => [`/src/${n}.mjs`, `src/${n}.mjs`],
  ),
  ["/transfer/", "web/transfer.html"],
  ["/transfer.mjs", "web/transfer.mjs"],
]);
const types = {
  html: "text/html; charset=utf-8",
  css: "text/css",
  mjs: "text/javascript",
  js: "text/javascript",
  svg: "image/svg+xml",
  webmanifest: "application/manifest+json",
};
http
  .createServer(async (req, res) => {
    try {
      const pathname = new URL(req.url, "http://localhost").pathname;
      if (pathname === "/web/") {
        res.writeHead(302, { Location: "/" });
        res.end();
        return;
      }
      const relative = routes.get(pathname);
      if (!relative) throw Error("Unknown route");
      const data = await readFile(new URL("../" + relative, import.meta.url));
      res.writeHead(200, {
        "Content-Type": types[relative.split(".").at(-1)] || "text/plain",
        "Cache-Control": "no-cache",
        "Service-Worker-Allowed": "/",
      });
      res.end(data);
    } catch {
      res.writeHead(404);
      res.end("Not found");
    }
  })
  .listen(Number(process.env.PORT || 4173), "127.0.0.1", () =>
    console.log("Onjeom prototype ready on port " + (process.env.PORT || 4173)),
  );
