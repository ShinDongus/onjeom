import { test } from "node:test";
import assert from "node:assert/strict";
import {
  FLOWERS,
  initialState,
  addTasks,
  changeTask,
  completeTask,
  registerFlower,
  eventAt,
  seasonAt,
  splitThoughts,
  exportBackup,
  importBackup,
  migrateState,
  localDate,
} from "../src/logic.mjs";
const tasks = (n = 4) =>
  addTasks(
    initialState(),
    Array.from({ length: n }, (_, i) => `행동 ${i + 1}`),
  );
const finish = (
  s,
  n = 4,
  options = { day: "2026-06-01", random: () => 0.2 },
) => {
  for (let i = 0; i < n; i++)
    s = completeTask(s, s.tasks.find((t) => t.status === "active").id, options);
  return s;
};
test("검토 가능한 규칙 분리, 빈 항목 제거", () =>
  assert.deepEqual(splitThoughts("빨래하기, 메일 보내기\n그리고 산책하기."), [
    "빨래하기",
    "메일 보내기",
    "산책하기",
  ]));
test("4개의 실제 완료만 개화, 중복 완료 및 대기 시간은 성장하지 않음", () => {
  let s = tasks();
  s = finish(s, 3);
  assert.equal(s.flowers.length, 0);
  const id = s.tasks.find((t) => t.status === "active").id;
  s = completeTask(s, id, { day: "2026-06-01", random: () => 0.2 });
  assert.equal(s.flowers.length, 1);
  assert.equal(s.flowers[0].achievements.length, 4);
  assert.deepEqual(completeTask(s, id), s);
  assert.equal(s.completed, 4);
});
test("기본 꽃 12종 모두 출현할 수 있음", () => {
  for (let i = 0; i < 12; i++) {
    let count = 0;
    const s = finish(tasks(), 4, {
      day: "2026-06-01",
      random: () => (count++ % 2 === 0 ? (i + 0.1) / 12 : 0.4),
    });
    assert.equal(s.flowers[0].species, FLOWERS[i].id);
  }
});
test("희귀 색상 경계 5%, PLUS는 확률에 영향 없음", () => {
  for (const plus of [true, false])
    for (const roll of [0.049999, 0.05]) {
      let s = tasks();
      s.settings.plusTest = plus;
      let i = 0;
      s = finish(s, 4, {
        day: "2026-06-01",
        random: () => (i++ % 2 === 0 ? 0.2 : roll),
      });
      assert.equal(s.flowers[0].color, roll < 0.05 ? "violet" : "cream");
    }
});
test("시즌 날짜와 한국 날짜 경계", () => {
  assert.equal(eventAt("2026-12-20").id, "christmas");
  assert.equal(eventAt("2026-12-27"), null);
  assert.equal(eventAt("2026-10-31").id, "halloween");
  assert.equal(eventAt("2026-11-01"), null);
  assert.equal(eventAt("2027-01-01").id, "newyear");
  assert.equal(eventAt("2027-01-08"), null);
  assert.equal(eventAt("2026-09-25").id, "chuseok");
  assert.equal(eventAt("2026-09-28"), null);
  assert.equal(localDate(new Date("2026-12-31T15:00:00Z")), "2027-01-01");
  assert.equal(seasonAt("2026-03-01"), "봄");
});
test("미완료 씨앗 보관 및 복원, 나중에 하기는 순서만 변경", () => {
  let s = tasks();
  const id = s.tasks[0].id;
  s = changeTask(s, id, "archive");
  assert.equal(s.tasks[0].status, "seed");
  s = changeTask(s, id, "restore");
  assert.equal(s.tasks[0].status, "active");
  s = changeTask(s, id, "later");
  assert.equal(s.tasks.at(-1).id, id);
  assert.equal(s.completed, 0);
});
test("작은 단계 분리 및 빈 분리 거절", () => {
  const s = tasks(1),
    id = s.tasks[0].id;
  assert.throws(() => changeTask(s, id, "split", [" "]));
  const next = changeTask(s, id, "split", ["문서 열기", "한 줄 적기"]);
  assert.equal(next.tasks.length, 2);
  assert.equal(next.completed, 0);
});
test("광고 취소/미제공 후 꽃 보존, 새 조합 보상 및 중복 무료 등록", () => {
  let s = finish(tasks(8));
  const first = s.flowers[0].id;
  for (const reward of ["cancelled", "unavailable"]) {
    assert.deepEqual(registerFlower(s, first, { reward }), s);
    assert.equal(importBackup(exportBackup(s)).flowers.length, 1);
  }
  s = registerFlower(s, first, { reward: "earned-test" });
  assert.equal(s.flowers[0].registered, true);
  s = finish(s);
  s = registerFlower(s, s.flowers[1].id);
  assert.equal(s.flowers[1].registered, true);
  assert.equal(
    new Set(s.flowers.map((f) => `${f.species}:${f.color}`)).size,
    1,
  );
});
test("새 색상에는 별도 등록 필요, PLUS 테스트는 광고 없이 등록", () => {
  let s = finish(tasks(8));
  s = registerFlower(s, s.flowers[0].id, { reward: "earned-test" });
  s = finish(s, 4, { day: "2026-06-01", random: () => 0.01 });
  const id = s.flowers[1].id;
  assert.equal(registerFlower(s, id).flowers[1].registered, false);
  s.settings.plusTest = true;
  assert.equal(registerFlower(s, id).flowers[1].registered, true);
});
test("백업 왕복 및 손상/미래 버전/중복 ID/일치하지 않는 기록 거절", () => {
  const s = finish(tasks());
  assert.deepEqual(importBackup(exportBackup(s)), s);
  assert.throws(() => importBackup("bad"));
  assert.throws(() => importBackup('{"format":"other"}'));
  for (const mutate of [
    (x) => (x.version = 99),
    (x) => (x.completed = 8),
    (x) => (x.tasks[1].id = x.tasks[0].id),
    (x) => (x.flowers[0].bloomedAt = "2026-02-30"),
    (x) => (x.flowers[0].species = "unknown"),
  ]) {
    const copy = structuredClone(s);
    mutate(copy);
    assert.throws(() => migrateState(copy));
  }
});
test("v1 상태 마이그레이션, 원본 보존", () => {
  const old = { ...initialState(), version: 1 };
  delete old.settings;
  assert.deepEqual(migrateState(old), initialState());
  assert.equal(old.version, 1);
});

test("순서 변경 후에도 꽃에는 실제 완료 순서의 네 행동을 기록", () => {
  let s = tasks();
  const ids = s.tasks.map((t) => t.id);
  for (const id of [ids[2], ids[0], ids[3], ids[1]])
    s = completeTask(s, id, { day: "2026-06-01", random: () => 0.2 });
  assert.deepEqual(s.flowers[0].achievements, [
    "행동 3",
    "행동 1",
    "행동 4",
    "행동 2",
  ]);
});

test("숫자로 시작하는 생각을 보존하고 과도한 분리는 명시적으로 거절", () => {
  assert.deepEqual(splitThoughts("10분 걷기, 2026년 계획"), [
    "10분 걷기",
    "2026년 계획",
  ]);
  assert.throws(() => splitThoughts(Array(101).fill("할 일").join(",")));
});
