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
