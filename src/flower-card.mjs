import { flowerSvg } from "./flower-art.mjs";
const escape = (value) =>
  String(value)
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "")
    .replace(
      /[&<>"']/g,
      (c) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&apos;",
        })[c],
    );
const lines = (text, limit) => {
  const result = [];
  let line = "";
  for (const char of text) {
    if (char === "\n" || Array.from(line).length >= limit) {
      result.push(line);
      line = "";
    }
    if (char !== "\n") line += char;
  }
  if (line) result.push(line);
  return result;
};
/** Free, portable vector card. User text is escaped and no external resources are used. */
export function flowerCardSvg(flower, day) {
  const quote = lines(`“${flower.quote}”`, 24);
  const title = lines(`${flower.name} · ${flower.variantName}`, 22);
  const achievements = lines(
    (flower.achievements?.length
      ? flower.achievements
      : [flower.originTask]
    ).join(" · "),
    30,
  );
  const quoteY = 360 + title.length * 30;
  const footerY = quoteY + quote.length * 34 + 82;
  const height = footerY + achievements.length * 24 + 100;
  const art = flowerSvg({
    species: flower.speciesId,
    color: flower.color,
  }).replace(
    "<svg xmlns",
    '<svg x="170" y="65" width="180" height="242" xmlns',
  );
  const text = (content, y, size, color) =>
    `<text x="260" y="${y}" text-anchor="middle" font-size="${size}" fill="${color}">${escape(content)}</text>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="520" height="${height}" viewBox="0 0 520 ${height}" role="img" aria-label="온점. 꽃말 카드"><rect width="520" height="${height}" rx="32" fill="#fbf8ef"/><rect x="20" y="20" width="480" height="${height - 40}" rx="24" fill="none" stroke="#d8dfd0"/><g font-family="system-ui, sans-serif">${text("작은 행동 끝에 피어난 마음", 54, 13, "#65776b")}${art}${title.map((line, i) => text(line, 340 + i * 30, 24, "#283e34")).join("")}${quote.map((line, i) => text(line, quoteY + i * 34, 20, "#4f6b55")).join("")}${text("온점. 창작 문구 · 전통 꽃말을 뜻하지 않아요", footerY - 37, 12, "#65776b")}${text(`${day} 개화`, footerY, 13, "#65776b")}${achievements.map((line, i) => text(line, footerY + 30 + i * 24, 13, "#65776b")).join("")}${text("온점.", height - 40, 22, "#283e34")}</g></svg>`;
}
