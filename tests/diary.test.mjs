import { test } from "node:test";
import assert from "node:assert/strict";
import {
  initialState,
  addTasks,
  completeTask,
  changeTask,
  migrateState,
  exportBackup,
  importBackup,
} from "../src/mobile-domain.mjs";
import {
  setDiaryEntry,
  diaryDay,
  calendarCells,
  shiftMonth,
  recordDay,
  recordedDays,
} from "../src/diary.mjs";
test("선택형 다이어리 확장: 구버전 유지, 초안/짧은 기록 백업 복원 및 손상 거절", () => {
  const original = initialState();
  assert.deepEqual(migrateState(original), original);
  const s = setDiaryEntry(original, "2026-11-04", {
    draft: "마음에 남은 말",
    note: "산책한 날",
  });
  assert.deepEqual(importBackup(exportBackup(s)), s);
  assert.equal(diaryDay(s, "2026-11-04").note, "산책한 날");
  assert.equal(diaryDay(s, "2026-11-03").draft, "");
  for (const [day, entry] of [
    ["2026-02-30", { draft: "", note: "" }],
    ["2026-11-04", { draft: 12, note: "" }],
    ["2026-11-04", { draft: "", note: "a".repeat(501) }],
  ])
    assert.throws(() => setDiaryEntry(s, day, entry));
  for (const diary of [
    null,
    [],
    { "2026-11-04": { draft: "", note: "", updatedAt: "broken" } },
  ])
    assert.throws(() => migrateState({ ...s, diary }));
  assert.equal(
    Object.keys(setDiaryEntry(s, "2026-11-04", { draft: "", note: "" }).diary)
      .length,
    0,
  );
});
test("하루 조회: 생각/완료/개화 날짜를 분리하고 미완료는 씨앗으로 복원", () => {
  let s = addTasks(initialState(), ["하나", "둘", "셋", "넷", "씨앗"]);
  const created = recordDay(s.thoughts[0].createdAt);
  for (const t of s.tasks.slice(0, 4))
    s = completeTask(s, t.id, { day: "2026-11-03", random: () => 0.8 });
  s = changeTask(s, s.tasks.find((t) => t.status === "active").id, "later");
  assert.equal(diaryDay(s, "2026-11-03").completed.length, 4);
  assert.equal(diaryDay(s, "2026-11-03").flowers.length, 1);
  assert.equal(diaryDay(s, created).thoughts.length, 1);
  assert.equal(diaryDay(s, "2026-11-02").completed.length, 0);
  assert.equal(recordedDays(s).has("2026-11-03"), true);
  const seed = s.tasks.find((t) => t.status === "postponed");
  s = changeTask(s, seed.id, "restore");
  assert.equal(s.tasks.find((t) => t.id === seed.id).status, "active");
  assert.equal(diaryDay(s, "2026-11-03").completed.length, 4);
});
test("달력: 윤년/요일/연도 경계와 현지 날짜, 없는 과거 날짜를 만들지 않음", () => {
  assert.equal(calendarCells("2024-02").filter(Boolean).length, 29);
  assert.equal(calendarCells("2025-02").filter(Boolean).length, 28);
  assert.equal(calendarCells("2026-11")[0], "2026-11-01");
  assert.equal(calendarCells("2026-11").length % 7, 0);
  assert.equal(shiftMonth("2026-12", 1), "2027-01");
  assert.equal(shiftMonth("2026-01", -1), "2025-12");
  assert.throws(() => calendarCells("2026-13"));
  assert.equal(recordDay(null), null);
  assert.equal(recordDay("2026-11-03"), "2026-11-03");
  const oldTZ = process.env.TZ;
  process.env.TZ = "Asia/Seoul";
  try {
    assert.equal(recordDay("2026-11-03T16:00:00Z"), "2026-11-04");
  } finally {
    if (oldTZ === undefined) delete process.env.TZ;
    else process.env.TZ = oldTZ;
  }
});

test("원격에 추가된 journals 일기·기분과 새 다이어리 확장을 함께 보존", async () => {
  const { saveJournal } = await import("../src/journal.mjs");
  let s = saveJournal(initialState(), "2026-11-03", {
    text: "이전에 남긴 긴 일기",
    mood: "맑음",
  });
  s = setDiaryEntry(s, "2026-11-03", { draft: "새 생각", note: "짧은 문장" });
  const restored = importBackup(exportBackup(s));
  assert.deepEqual(restored.journals, s.journals);
  assert.equal(diaryDay(restored, "2026-11-03").journal.mood, "맑음");
  assert.equal(diaryDay(restored, "2026-11-03").draft, "새 생각");
  assert.equal(recordedDays(restored).has("2026-11-03"), true);
});

test("기록 원문 편집은 생각 ID·날짜·기존 작업·개화 기록을 바꾸지 않음", async () => {
  const { editThoughtRecord } = await import("../src/diary.mjs");
  let s = addTasks(initialState(), [
    "컵 씻기",
    "물 마시기",
    "창문 열기",
    "책 읽기",
  ]);
  for (const t of s.tasks)
    s = completeTask(s, t.id, { day: "2026-11-05", random: () => 0.5 });
  const next = editThoughtRecord(
    s,
    s.thoughts[0].id,
    "조금 더 다정하게 고친 하루",
  );
  assert.deepEqual(next.tasks, s.tasks);
  assert.deepEqual(next.flowers, s.flowers);
  assert.equal(next.thoughts[0].createdAt, s.thoughts[0].createdAt);
  assert.equal(next.thoughts[0].id, s.thoughts[0].id);
  assert.throws(() =>
    editThoughtRecord(s, s.thoughts[0].id, "x".repeat(10001)),
  );
});
