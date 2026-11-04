import test from "node:test";
import assert from "node:assert/strict";
import {
  diaryDays,
  diaryForDay,
  saveJournal,
  validateJournals,
} from "../src/journal.mjs";
import { initialState, migrateState } from "../src/mobile-domain.mjs";
test("old v3 data migrates to empty diary without deleting flowers or tasks", () => {
  const original = initialState();
  delete original.journals;
  const migrated = migrateState(original);
  assert.deepEqual(migrated.journals, {});
  assert.deepEqual(migrated.flowers, original.flowers);
});
test("journal edits keep original tasks unchanged", () => {
  const s = initialState(),
    day = "2026-11-04";
  const next = saveJournal(s, day, { text: "오늘은 조금씩", mood: "맑음" });
  assert.equal(s.journals?.[day], undefined);
  assert.equal(diaryForDay(next, day).journal.text, "오늘은 조금씩");
  assert.deepEqual(next.tasks, s.tasks);
  assert.deepEqual(migrateState(next).journals, next.journals);
});
test("journal updates preserve mood, and clearing deletes empty entry", () => {
  const s = saveJournal(initialState(), "2026-11-04", { mood: "복잡함" });
  const n = saveJournal(s, "2026-11-04", { text: "오늘의 생각" });
  assert.equal(n.journals["2026-11-04"].mood, "복잡함");
  const x = saveJournal(n, "2026-11-04", { text: "", mood: null });
  assert.equal(x.journals["2026-11-04"], undefined);
});
test("journal validation rejects malformed days and invalid contents", () => {
  assert.throws(() => saveJournal(initialState(), "2026-02-31", { text: "x" }));
  assert.throws(() =>
    saveJournal(initialState(), "2026-11-04", { text: "x", mood: "진단" }),
  );
  assert.throws(() =>
    validateJournals({
      "2026-11-04": {
        text: "a".repeat(10001),
        mood: null,
        updatedAt: new Date().toISOString(),
      },
    }),
  );
});
test("diary calendar includes journal and completed action days", () => {
  let s = saveJournal(initialState(), "2026-11-01", { text: "메모" });
  s = {
    ...s,
    tasks: [
      {
        id: "a",
        status: "done",
        title: "메일 보내기",
        finishedAt: "2026-11-04T09:00:00.000Z",
      },
    ],
  };
  assert.deepEqual(diaryDays(s), ["2026-11-04", "2026-11-01"]);
  assert.equal(diaryForDay(s, "2026-11-04").tasks.length, 1);
});
