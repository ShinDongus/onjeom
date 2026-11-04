/** Private, local-first diary records. No network access or health inference. */
const DAY = /^\d{4}-\d{2}-\d{2}$/;
export const MOODS = ["맑음", "보통", "복잡함", "지침"];
export function isJournalDay(day) {
  return typeof day === "string" && DAY.test(day) &&
    !Number.isNaN(Date.parse(day + "T12:00:00Z")) &&
    new Date(day + "T12:00:00Z").toISOString().slice(0, 10) === day;
}
export function validateJournals(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw Error("다이어리 데이터가 올바르지 않습니다.");
  const keys = Object.keys(value);
  if (keys.length > 20000) throw Error("다이어리 기록이 너무 많습니다.");
  for (const day of keys) {
    const entry = value[day];
    if (!isJournalDay(day) || !entry || typeof entry !== "object" ||
      typeof entry.text !== "string" || entry.text.length > 10000 ||
      !(entry.mood === null || MOODS.includes(entry.mood)) ||
      typeof entry.updatedAt !== "string" || Number.isNaN(Date.parse(entry.updatedAt)))
      throw Error("다이어리 기록이 손상되었습니다.");
  }
  return value;
}
export function saveJournal(state, day, patch, updatedAt = new Date().toISOString()) {
  if (!isJournalDay(day)) throw Error("날짜가 올바르지 않습니다.");
  if (!patch || typeof patch !== "object") throw Error("기록 내용이 올바르지 않습니다.");
  const old = (state.journals || {})[day] || { text: "", mood: null };
  const next = {
    text: patch.text === undefined ? old.text : patch.text,
    mood: patch.mood === undefined ? old.mood : patch.mood,
    updatedAt,
  };
  validateJournals({ [day]: next });
  if (next.text === old.text && next.mood === old.mood) return state;
  const journals = { ...(state.journals || {}) };
  if (!next.text.trim() && next.mood === null) delete journals[day];
  else journals[day] = next;
  return { ...state, journals };
}
const entryDay = (stamp) => typeof stamp === "string" ? stamp.slice(0, 10) : null;
export function diaryForDay(state, day) {
  if (!isJournalDay(day)) throw Error("날짜가 올바르지 않습니다.");
  return {
    day,
    journal: (state.journals || {})[day] || { text: "", mood: null },
    tasks: (state.tasks || []).filter((task) => task.status === "done" && entryDay(task.finishedAt) === day),
    flowers: (state.flowers || []).filter((flower) => entryDay(flower.createdAt) === day),
    thoughts: (state.thoughts || []).filter((t) => entryDay(t.createdAt) === day),
  };
}
export function diaryDays(state) {
  return [...new Set([
    ...Object.keys(state.journals || {}),
    ...(state.tasks || []).filter((t) => t.status === "done").map((t) => entryDay(t.finishedAt)),
    ...(state.flowers || []).map((f) => entryDay(f.createdAt))
  ].filter((d) => isJournalDay(d)))].sort().reverse();
}
