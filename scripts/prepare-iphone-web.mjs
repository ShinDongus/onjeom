import { readFile, writeFile, readdir } from "node:fs/promises";
import { resolve, join } from "node:path";
import { createHash } from "node:crypto";
const root = resolve("dist-preview");
let html = await readFile(join(root, "index.html"), "utf8");
html = html.replace(
  /<meta name="viewport"[^>]*>/,
  '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover"/>',
);
html = html
  .replace('<html lang="en">', '<html lang="ko">')
  .replace(
    "</head>",
    `<link rel="manifest" href="./manifest.webmanifest"/><link rel="apple-touch-icon" href="./apple-touch-icon.png"/><meta name="apple-mobile-web-app-capable" content="yes"/><meta name="apple-mobile-web-app-title" content="온점."/><meta name="apple-mobile-web-app-status-bar-style" content="default"/><meta name="theme-color" content="#fbf8ef"/></head>`,
  )
  .replace("</body>", '<script src="./install.js" defer></script></body>');
await writeFile(join(root, "index.html"), html);
async function files(dir, prefix = "") {
  let result = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const name = prefix + entry.name;
    if (name === "review") continue; // Review screenshots are not part of the offline app shell.
    if (entry.isDirectory())
      result.push(...(await files(join(dir, entry.name), name + "/")));
    else if (!["sw.js", "_headers"].includes(name)) result.push(name);
  }
  return result.sort();
}
const names = await files(root),
  hash = createHash("sha256");
for (const name of names) {
  hash.update(name);
  hash.update(await readFile(join(root, name)));
}
const version = hash.digest("hex").slice(0, 16);
const worker = `const CACHE='onjeom-mobile-${version}';const FILES=${JSON.stringify(names.map((n) => "./" + n))};
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(FILES))));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith('onjeom-mobile-')&&key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{const url=new URL(event.request.url);const allowed=FILES.some(path=>new URL(path,self.registration.scope).pathname===url.pathname)||url.pathname===new URL('./',self.registration.scope).pathname;if(event.request.method!=='GET'||url.origin!==self.location.origin||!allowed)return;event.respondWith(caches.open(CACHE).then(async cache=>{const match=await cache.match(event.request,{ignoreSearch:true});if(match)return match;if(event.request.mode==='navigate')return cache.match('./index.html');return fetch(event.request);}));});
`;
await writeFile(join(root, "sw.js"), worker);
console.log(
  "Prepared iPhone home-screen manifest, icons and offline shell. Public HTTPS hosting is still required.",
);

await writeFile(join(root, ".nojekyll"), "");
