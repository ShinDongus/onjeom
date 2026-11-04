import { cp, mkdir, readFile, writeFile, access } from "node:fs/promises";
const html = await readFile("docs/ui-review.html", "utf8");
const images = [
  ...html.matchAll(/<img[^>]+src="(screenshots\/[a-z0-9-]+\.png)"/g),
].map((match) => match[1]);
if (images.length < 9) throw Error("UI comparison screenshots are incomplete.");
await mkdir("dist-preview/review/screenshots", { recursive: true });
for (const path of new Set(images)) {
  await access(`docs/${path}`);
  await cp(`docs/${path}`, `dist-preview/review/${path}`);
}
await writeFile("dist-preview/review/index.html", html);
console.log(
  "Prepared a separate UI comparison gallery; excluded from app precaching.",
);
