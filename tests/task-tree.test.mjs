import test from "node:test";
import assert from "node:assert/strict";
import {
  initialState,
  addTasks,
  changeTask,
  completeTask,
  actionableTasks,
  taskProgress,
  migrateState,
  exportBackup,
  importBackup,
} from "../src/mobile-domain.mjs";
import { addPlan, rulePlan } from "../src/planner.mjs";
import { saveJournal } from "../src/journal.mjs";
import { diaryDay } from "../src/diary.mjs";
const done = (s, id) =>
  completeTask(s, id, { day: "2026-11-04", random: () => 0.7 });
test("nested goals complete bottom-up; only real leaves grow flowers and enter achievement history", () => {
  let s = addPlan(
    initialState(),
    [
      "발표 준비",
      "  자료 준비",
      "    파일 열기",
      "    자료 읽기",
      "  초안 쓰기",
      "  제출하기",
    ],
    { original: "발표 준비해야 해" },
  );
  const root = s.tasks[0].id,
    stage = s.tasks[1].id;
  assert.deepEqual(done(s, root), s);
  assert.equal(actionableTasks(s)[0].title, "파일 열기");
  s = done(s, actionableTasks(s)[0].id);
  assert.deepEqual(taskProgress(s, root), { done: 1, total: 4 });
  s = done(s, actionableTasks(s)[0].id);
  assert.equal(s.tasks.find((t) => t.id === stage).status, "done");
  assert.equal(s.completedTotal, 2);
  s = done(s, actionableTasks(s)[0].id);
  s = done(s, actionableTasks(s)[0].id);
  assert.equal(s.tasks.find((t) => t.id === root).status, "done");
  assert.equal(s.completedTotal, 4);
  assert.equal(s.flowers.length, 1);
  assert.deepEqual(s.flowers[0].achievements, [
    "파일 열기",
    "자료 읽기",
    "초안 쓰기",
    "제출하기",
  ]);
  assert.equal(diaryDay(s, "2026-11-04").completed.length, 4);
  assert.deepEqual(importBackup(exportBackup(s)), s);
  assert.deepEqual(done(s, s.tasks.at(-1).id), s);
});
test("split preserves parent and recursively splits a leaf; postponed ancestors can be resumed", () => {
  let s = addTasks(initialState(), ["큰 목표"]);
  const root = s.tasks[0].id;
  s = changeTask(s, root, "split", ["준비", "실행"]);
  const child = actionableTasks(s)[0].id;
  s = changeTask(s, child, "split", ["문 열기", "도구 꺼내기"]);
  assert.equal(s.tasks.length, 5);
  s = changeTask(s, root, "later");
  assert.equal(actionableTasks(s).length, 0);
  s = changeTask(s, actionableLeaf(s), "restore");
  assert.ok(actionableTasks(s).length);
  assert.equal(s.completedTotal, 0);
  assert.doesNotThrow(() => migrateState(s));
  function actionableLeaf(s) {
    return s.tasks.find((t) => t.title === "문 열기").id;
  }
});
test("v3 migration is lossless and idempotent; invalid tree backups never validate", () => {
  const old = { ...addTasks(initialState(), ["이전 행동"]), version: 3 };
  const migrated = migrateState(old);
  assert.equal(migrated.version, 4);
  assert.deepEqual(migrated.tasks, old.tasks);
  assert.deepEqual(migrateState(migrated), migrated);
  const s = addPlan(initialState(), ["목표", "  행동"]);
  for (const bad of [
    { ...s, tasks: s.tasks.map((t) => ({ ...t, parentId: "missing" })) },
    { ...s, tasks: s.tasks.map((t) => ({ ...t, parentId: t.id })) },
    {
      ...s,
      tasks: s.tasks.map((t, i) =>
        i === 0 ? { ...t, status: "done", finishedAt: "2026-11-04" } : t,
      ),
    },
  ])
    assert.throws(() => migrateState(bad));
});
test("offline suggestions require explicit review; invalid indentation is rejected; reflection never grants growth", () => {
  const lines = rulePlan("서류 제출해야 해");
  assert.ok(lines.some((l) => l.startsWith("  ")));
  const empty = initialState();
  assert.equal(empty.tasks.length, 0);
  assert.throws(() => addPlan(empty, ["  상위 없음"]));
  const s = saveJournal(empty, "2026-11-04", {
    text: "돌아온 날",
    mood: "지침",
  });
  assert.equal(s.completedTotal, 0);
  assert.equal(s.flowers.length, 0);
  assert.equal(s.journals["2026-11-04"].mood, "지침");
});
import {
  removePlanBranch,
  movePlanBranch,
  shiftPlanBranch,
} from "../src/planner.mjs";
test("branch review moves and removes whole branches; outdent does not steal siblings", () => {
  const lines = ["목표", "  준비", "    열기", "  실행", "다음 목표"];
  assert.deepEqual(removePlanBranch(lines, 1), ["목표", "  실행", "다음 목표"]);
  assert.deepEqual(movePlanBranch(lines, 1, 1), [
    "목표",
    "  실행",
    "  준비",
    "    열기",
    "다음 목표",
  ]);
  assert.deepEqual(shiftPlanBranch(lines, 1, -1), [
    "목표",
    "  실행",
    "준비",
    "  열기",
    "다음 목표",
  ]);
});
test("deleting an unfinished goal preserves already completed real action history", () => {
  let s = addPlan(initialState(), ["목표", "  완료할 행동", "  남길 행동"]);
  s = done(s, actionableTasks(s)[0].id);
  const finished = s.tasks.find((t) => t.status === "done");
  s = changeTask(s, s.tasks[0].id, "delete");
  assert.equal(s.completedTotal, 1);
  assert.ok(s.tasks.find((t) => t.id === finished.id));
  assert.equal(s.tasks.find((t) => t.id === finished.id).parentId, undefined);
  assert.doesNotThrow(() => migrateState(s));
});
