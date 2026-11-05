/** Hand-drawn vector motifs; decorative, never a botanical identification guide. */
const node = (tag, props) => ({ tag, props });
const path = (d, fill, extra = {}) => node("path", { d, fill, ...extra });
const ellipse = (cx, cy, rx, ry, fill, extra = {}) =>
  node("ellipse", { cx, cy, rx, ry, fill, ...extra });
const circle = (cx, cy, r, fill, extra = {}) =>
  node("circle", { cx, cy, r, fill, ...extra });
const ring = (
  count,
  rx,
  ry,
  color,
  { cx = 80, cy = 72, offset = 20, rotation = 0, opacity = 0.92 } = {},
) =>
  Array.from({ length: count }, (_, i) =>
    ellipse(cx, cy - offset, rx, ry, color, {
      transform: `rotate(${rotation + (i * 360) / count} ${cx} ${cy})`,
      opacity,
    }),
  );
export const FLOWER_MOTIFS = [
  "daisy",
  "tulip",
  "rose",
  "cosmos",
  "hydrangea",
  "camellia",
  "lavender",
  "sunflower",
  "narcissus",
  "babybreath",
  "plum",
  "peony",
];
export function flowerScene({
  species = "daisy",
  color = "#EBDDB6",
  stage = 4,
  potted = true,
} = {}) {
  if (!/^#[0-9a-fA-F]{6}$/.test(color)) color = "#EBDDB6";
  const result = [ellipse(80, 193, 43, 7, "#6d8063", { opacity: 0.12 })];
  const stem =
    stage === 0
      ? "M80 175 Q80 169 80 166"
      : stage === 1
        ? "M80 180 Q76 158 80 145"
        : stage === 2
          ? "M80 180 Q76 137 80 115"
          : "M80 180 Q76 137 80 73";
  result.push(
    path(stem, "none", {
      stroke: "#69876b",
      strokeWidth: 3.5,
      strokeLinecap: "round",
    }),
  );
  if (stage >= 1)
    result.push(path("M79 150 Q43 152 39 123 Q67 121 79 150", "#a5b99a"));
  if (stage >= 2)
    result.push(path("M80 163 Q111 165 121 139 Q95 134 80 163", "#bdcdb0"));
  if (stage >= 3)
    result.push(path("M79 117 Q54 115 52 95 Q73 94 79 117", "#8ba780"));
  if (stage === 0)
    result.push(
      ellipse(80, 171, 8, 5, "#a18b6c", { transform: "rotate(-20 80 171)" }),
    );
  if (stage === 3)
    result.push(
      path("M80 92 C50 72 63 49 80 43 C97 49 110 72 80 92", color),
      path("M65 83 Q81 91 95 81 Q89 99 80 99 Q71 97 65 83", "#7b996e"),
    );
  if (stage >= 4) {
    const kind =
      species === "poinsettia"
        ? "poinsettia"
        : species === "moonrose"
          ? "rose"
          : species === "firstlight"
            ? "narcissus"
            : species === "chuseok-aster"
              ? "daisy"
              : FLOWER_MOTIFS.includes(species)
                ? species
                : "daisy";
    switch (kind) {
      case "tulip":
        result.push(
          path(
            "M50 54 Q61 62 69 42 Q81 57 92 43 Q101 62 111 51 C111 90 94 103 80 103 C62 99 48 83 50 54",
            color,
          ),
          path("M69 55 Q65 84 80 100 M92 55 Q98 82 80 100", "none", {
            stroke: "#fff7eb",
            strokeWidth: 1.8,
            opacity: 0.55,
          }),
        );
        break;
      case "rose":
        result.push(
          ...ring(6, 23, 26, color, { offset: 17 }),
          ...ring(5, 15, 20, color, { offset: 10, rotation: 32 }),
          path(
            "M65 72 C60 48 93 47 98 67 C104 90 70 96 65 75 C63 60 85 58 88 71 C92 83 74 84 75 74",
            "none",
            { stroke: "#fff6e7", strokeWidth: 2, opacity: 0.65 },
          ),
        );
        break;
      case "cosmos":
        result.push(
          ...Array.from({ length: 8 }, (_, i) =>
            path(
              "M80 77 C66 65 57 48 64 37 L72 40 L78 32 L84 39 L93 35 C101 52 91 67 80 77",
              color,
              { transform: `rotate(${i * 45} 80 72)`, opacity: 0.88 },
            ),
          ),
          circle(80, 72, 9, "#d5b46e"),
        );
        break;
      case "hydrangea":
        for (const [cx, cy] of [
          [61, 51],
          [84, 44],
          [104, 55],
          [49, 73],
          [74, 68],
          [97, 76],
          [62, 93],
          [85, 97],
          [109, 92],
        ])
          result.push(
            ...ring(4, 7, 10, color, { cx, cy, offset: 6, rotation: 45 }),
            circle(cx, cy, 2, "#f4efdf"),
          );
        break;
      case "camellia":
        result.push(
          ...ring(7, 20, 25, color, { offset: 19 }),
          ...ring(7, 14, 19, color, { offset: 10, rotation: 25 }),
          circle(80, 72, 8, "#edcf7d"),
          ...ring(7, 1.2, 6, "#f4de9c", { offset: 4 }),
        );
        break;
      case "lavender":
        result.push(
          path("M80 115 Q76 80 80 25", "none", {
            stroke: "#69876b",
            strokeWidth: 2,
          }),
        );
        for (let i = 0; i < 7; i++)
          result.push(
            ellipse(73 - i * 0.4, 36 + i * 10, 7 + i * 0.6, 4.5, color, {
              transform: `rotate(30 73 ${36 + i * 10})`,
            }),
            ellipse(85 + i * 0.4, 31 + i * 10, 7 + i * 0.6, 4.5, color, {
              transform: `rotate(-30 85 ${31 + i * 10})`,
            }),
          );
        result.push(ellipse(80, 22, 4, 8, color));
        break;
      case "sunflower":
        result.push(
          ...ring(18, 6, 24, color, { offset: 29 }),
          circle(80, 72, 21, "#8e7153"),
        );
        for (const [x, y] of [
          [72, 63],
          [83, 61],
          [91, 70],
          [78, 74],
          [68, 76],
          [83, 84],
          [72, 86],
        ])
          result.push(circle(x, y, 1.5, "#c7a16b"));
        break;
      case "narcissus":
        result.push(
          ...Array.from({ length: 6 }, (_, i) =>
            path("M80 77 Q51 61 65 34 Q84 37 80 77", color, {
              transform: `rotate(${i * 60} 80 72)`,
            }),
          ),
          path("M67 60 L70 82 Q80 92 90 82 L93 60 Q80 68 67 60", "#d5b260"),
          ellipse(80, 60, 13, 6, "#ead08b"),
          ellipse(80, 61, 8, 3, "#ba984a"),
        );
        break;
      case "babybreath":
        result.push(
          path(
            "M80 130 L53 76 M80 115 L106 62 M80 90 L75 46 M80 126 L119 98",
            "none",
            { stroke: "#8ca183", strokeWidth: 1.5 },
          ),
        );
        for (const [cx, cy] of [
          [51, 70],
          [43, 57],
          [64, 56],
          [75, 39],
          [94, 40],
          [108, 56],
          [117, 81],
          [122, 97],
          [68, 86],
        ])
          result.push(
            ...ring(5, 4, 6, color, { cx, cy, offset: 4 }),
            circle(cx, cy, 2, "#cdbb83"),
          );
        break;
      case "plum":
        result.push(
          ...ring(5, 19, 21, color, { offset: 18, rotation: 18 }),
          circle(80, 72, 8, "#f0d6b4"),
          ...ring(9, 1, 9, "#c39b56", { offset: 6 }),
        );
        break;
      case "peony":
        result.push(
          ...ring(9, 21, 24, color, { offset: 23, opacity: 0.6 }),
          ...ring(8, 17, 23, color, {
            offset: 17,
            rotation: 20,
            opacity: 0.83,
          }),
          ...ring(7, 11, 17, color, { offset: 8, rotation: 45 }),
          circle(80, 72, 6, "#e8c9a1"),
        );
        break;
      case "poinsettia":
        result.push(
          ...Array.from({ length: 7 }, (_, i) =>
            path("M80 80 Q48 66 67 25 Q95 46 80 80", color, {
              transform: `rotate(${(i * 360) / 7} 80 72)`,
              opacity: 0.86,
            }),
          ),
          ...ring(5, 3, 4, "#dbbd6b", { offset: 3 }),
        );
        break;
      default:
        result.push(
          ...ring(12, 7, 24, color, { offset: 24 }),
          circle(80, 72, 12, "#d2af64"),
          circle(77, 69, 3, "#ebd291"),
        );
    }
  }
  if (potted)
    result.push(
      path("M56 178 L104 178 L98 202 L62 202 Z", "#c6a38a"),
      path("M55 178 L105 178", "none", {
        stroke: "#b78f76",
        strokeWidth: 4,
        strokeLinecap: "round",
      }),
    );
  return result;
}
export function flowerSvg(options = {}) {
  const shapes = flowerScene(options)
    .map(
      ({ tag, props }) =>
        `<${tag} ${Object.entries(props)
          .map(
            ([k, v]) =>
              `${k.replace(/[A-Z]/g, (m) => "-" + m.toLowerCase())}="${v}"`,
          )
          .join(" ")}/>`,
    )
    .join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 215" role="img" aria-label="온점. 식물 일러스트">${shapes}</svg>`;
}
