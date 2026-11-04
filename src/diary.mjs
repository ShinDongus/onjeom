/** Optional diary extension: existing v1/v2/v3 task and flower records stay intact. */
import { todayLocal } from "./logic.mjs";
export const isDiaryDay = (value) =>
  typeof value === "string" &&
  /^\d{4}-\d{2}-\d{2}$/.test(value) &&
  !Number.isNaN(Date.parse(value)) &&
  new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10) === value;
export function validateDiary(diary) {
  if (diary === undefined) return;
  if (
    !diary ||
    typeof diary !== "object" ||
    Array.isArray(diary) ||
    Object.keys(diary).length > 20000
  )
    throw Error("다이어리 기록이 손상되었습니다.");
  for (const [day, entry] of Object.entries(diary)) {
    if (
      !isDiaryDay(day) ||
      !entry ||
      typeof entry !== "object" ||
      Array.isArray(entry) ||
      typeof entry.draft !== "string" ||
      entry.draft.length > 10000 ||
      typeof entry.note !== "string" ||
      entry.note.length > 500 ||
      typeof entry.updatedAt !== "string" ||
      !/^\d{4}-\d{2}-\d{2}T/.test(entry.updatedAt) ||
      !isDiaryDay(entry.updatedAt.slice(0, 10)) ||
      Number.isNaN(Date.parse(entry.updatedAt))
    )
      throw Error("다이어리 기록이 손상되었습니다.");
  }
}
export function setDiaryEntry(state, day, patch, date = new Date()) {
  if (!isDiaryDay(day)) throw Error("기록 날짜를 확인해 주세요.");
  const entry = {
    draft: "",
    note: "",
    ...state.diary?.[day],
    ...patch,
    updatedAt: date.toISOString(),
  };
  const diary = { ...state.diary, [day]: entry };
  validateDiary(diary);
  if (!entry.draft && !entry.note) delete diary[day];
  return { ...state, diary };
}
export function recordDay(value) {
  if (isDiaryDay(value)) return value;
  return value && !Number.isNaN(Date.parse(value))
    ? todayLocal(new Date(value))
    : null;
}
export function diaryDay(state, day) {
  if (!isDiaryDay(day)) throw Error("기록 날짜를 확인해 주세요.");
  return {
    day,
    draft: state.diary?.[day]?.draft || "",
    note: state.diary?.[day]?.note || "",
    thoughts: state.thoughts.filter((t) => recordDay(t.createdAt) === day),
    completed: state.tasks.filter(
      (t) => t.status === "done" && recordDay(t.finishedAt) === day,
    ),
    flowers: state.flowers.filter((f) => recordDay(f.createdAt) === day),
  };
}
export function calendarCells(month) {
  if (!/^\d{4}-\d{2}$/.test(month) || !isDiaryDay(`${month}-01`))
    throw Error("달력 날짜를 확인해 주세요.");
  const first = new Date(`${month}-01T12:00:00`),
    countDate = new Date(`${month}-01T12:00:00`);
  countDate.setMonth(countDate.getMonth() + 1);
  countDate.setDate(0);
  const count = countDate.getDate();
  const cells = Array.from({ length: first.getDay() }, () => null);
  for (let i = 1; i <= count; i++)
    cells.push(`${month}-${String(i).padStart(2, "0")}`);
  while (cells.length % 7) cells.push(null);
  return cells;
}
export function shiftMonth(month, direction) {
  calendarCells(month);
  const date = new Date(`${month}-15T12:00:00`);
  date.setMonth(date.getMonth() + direction);
  const result = todayLocal(date).slice(0, 7);
  if (!/^\d{4}-\d{2}$/.test(result)) return month;
  return result;
}
export function recordedDays(state) {
  return new Set(
    [
      ...Object.keys(state.diary || {}).filter(
        (day) => state.diary[day].draft || state.diary[day].note,
      ),
      ...state.thoughts.map((t) => recordDay(t.createdAt)),
      ...state.tasks
        .filter((t) => t.status === "done")
        .map((t) => recordDay(t.finishedAt)),
      ...state.flowers.map((f) => recordDay(f.createdAt)),
    ].filter(Boolean),
  );
}
