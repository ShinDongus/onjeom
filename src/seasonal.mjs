import { CHUSEOK_CALENDAR } from "./season-calendar.mjs";
export const CHUSEOK_FLOWER = {
  id: "chuseok-aster",
  name: "한가위 구절초",
  emoji: "🌼",
  color: "#DBC9B0",
  quote: "잠시 돌아본 자리에도 다정한 마음이 남아요.",
};
/** Exact Gregorian windows with an official, year-specific source. Never derive lunar dates. */
export function chuseokAt(day, calendar = CHUSEOK_CALENDAR) {
  const entry = calendar.find((e) => e.year === Number(day.slice(0, 4)));
  if (!entry) return null;
  if (
    !Number.isInteger(entry.year) ||
    (!/^https:\/\/[^/]+\.go\.kr\//.test(entry.source) &&
      !/^https:\/\/(?:www\.)?(?:astro\.)?kasi\.re\.kr\//.test(entry.source))
  )
    throw Error("추석 일정의 공식 출처를 확인해 주세요.");
  const valid = (d) =>
    typeof d === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(d) &&
    d.startsWith(`${entry.year}-`) &&
    !Number.isNaN(Date.parse(d)) &&
    new Date(d + "T00:00:00Z").toISOString().slice(0, 10) === d;
  if (!valid(entry.start) || !valid(entry.end) || entry.start > entry.end)
    throw Error("추석 연도별 일정이 올바르지 않습니다.");
  return day >= entry.start && day <= entry.end
    ? {
        id: "chuseok",
        name: "한가위의 마음",
        flower: CHUSEOK_FLOWER,
        source: entry.source,
      }
    : null;
}
