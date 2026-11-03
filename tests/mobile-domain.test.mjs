import { test } from "node:test";
import assert from "node:assert/strict";
import * as original from "../src/logic.mjs";
import {
  FLOWERS,
  initialState,
  addTasks,
  editTask,
  reorderTask,
  changeTask,
  completeTask,
  registerFlower,
  eventAt,
  seasonAt,
  exportBackup,
  importBackup,
  migrateState,
} from "../src/mobile-domain.mjs";
import { ruleSeparator } from "../src/separator.mjs";
import * as legacy from "../src/legacy-mobile.mjs";
import { chuseokAt } from "../src/seasonal.mjs";
const tasks = (n = 4) =>
  addTasks(
    initialState(),
    Array.from({ length: n }, (_, i) => `행동 ${i + 1}`),
  );
const finish = (
  s,
  n = 4,
  options = { day: "2026-06-01", random: () => 0.7 },
) => {
  for (let i = 0; i < n; i++)
    s = completeTask(s, original.activeTask(s).id, options);
  return s;
};
const sequence = (values) => {
  let i = 0;
  return () => values[i++ % values.length];
};
test("원본 한국어 분리기를 공유하고 검토 결과는 재해석하지 않음", async () => {
  const input = "세탁기 돌려야 하고 엄마한테 전화도 해야 하고 서류 제출해야 해";
  assert.deepEqual(
    await ruleSeparator.separate(input),
    original.splitThought(input),
  );
  const s = addTasks(initialState(), ["전화, 문자 중 하나", "10분 걷기"], {
    original: input,
  });
  assert.equal(s.tasks.length, 2);
  assert.equal(s.tasks[0].title, "전화, 문자 중 하나");
  assert.equal(s.thoughts[0].original, input);
});
test("4회의 실제 완료만 개화, 재완료 방지 및 완료 순서의 성취 기록", () => {
  let s = tasks();
  const ids = s.tasks.map((t) => t.id);
  for (const id of [ids[2], ids[0], ids[3]])
    s = completeTask(s, id, { day: "2026-06-01", random: () => 0.7 });
  assert.equal(s.flowers.length, 0);
  s = completeTask(s, ids[1], { day: "2026-06-01", random: () => 0.7 });
  assert.deepEqual(s.flowers[0].achievements, [
    "행동 3",
    "행동 1",
    "행동 4",
    "행동 2",
  ]);
  assert.equal(s.progress, 0);
  assert.equal(s.completedTotal, 4);
  assert.deepEqual(completeTask(s, ids[1]), s);
});
test("기본 12종과 창작 문구를 원본 그대로 사용", () => {
  assert.deepEqual(FLOWERS, original.FLOWERS);
  for (let i = 0; i < 12; i++) {
    const s = finish(tasks(), 4, {
      day: "2026-06-01",
      random: sequence([(i + 0.1) / 12, 0.8]),
    });
    assert.equal(s.flowers[0].speciesId, FLOWERS[i].id);
    assert.equal(s.flowers[0].quote, FLOWERS[i].quote);
  }
});
test("원본 희귀 확률 경계: 금빛 0.5%, 달빛·오로라 합계 3%, PLUS와 동일", () => {
  for (const premiumDemo of [false, true])
    for (const [roll, expected] of [
      [0.004999, "gold"],
      [0.005, "moon"],
      [0.034999, "moon"],
      [0.035, "normal"],
    ]) {
      const s = finish({ ...tasks(), premiumDemo }, 4, {
        day: "2026-06-01",
        random: sequence([0.4, roll, 0.1]),
      });
      assert.equal(s.flowers[0].variantId, expected);
    }
  const aurora = finish(tasks(), 4, {
    day: "2026-06-01",
    random: sequence([0.4, 0.02, 0.9]),
  });
  assert.equal(aurora.flowers[0].variantId, "aurora");
});
test("원본 고정일 시즌 범위와 연도 경계 유지", () => {
  for (const [day, id] of [
    ["2026-12-18", "christmas"],
    ["2026-12-26", "christmas"],
    ["2026-10-24", "halloween"],
    ["2026-11-01", "halloween"],
    ["2026-12-30", "newyear"],
    ["2027-01-03", "newyear"],
  ])
    assert.equal(eventAt(day).id, id);
  for (const day of ["2026-12-17", "2026-12-27", "2026-11-02", "2027-01-04"])
    assert.equal(eventAt(day), null);
  assert.equal(seasonAt("2026-03-01"), "봄");
});
test("시즌 꽃 확률 24% 경계와 원본 이름 보존", () => {
  for (const [roll, expected] of [
    [0.239999, "poinsettia"],
    [0.24, FLOWERS[6].id],
  ]) {
    const s = finish(tasks(), 4, {
      day: "2026-12-25",
      random: sequence([roll, 0.5, 0.8]),
    });
    assert.equal(s.flowers[0].speciesId, expected);
  }
});
test("추석: 공식 연도별 테이블 없으면 비활성, 검토된 설정만 적용", () => {
  assert.equal(chuseokAt("2026-09-25"), null);
  // Synthetic boundary fixture; not a verified production calendar.
  const calendar = [
    {
      year: 2030,
      start: "2030-09-01",
      end: "2030-09-03",
      source: "https://www.kasi.re.kr/test-fixture-not-production",
    },
  ];
  assert.equal(chuseokAt("2030-09-01", calendar).id, "chuseok");
  assert.equal(chuseokAt("2030-09-04", calendar), null);
  assert.equal(chuseokAt("2031-09-01", calendar), null);
  assert.throws(() =>
    chuseokAt("2030-09-01", [
      { ...calendar[0], source: "https://untrusted.example/calendar" },
    ]),
  );
  assert.throws(() =>
    chuseokAt("2030-09-01", [{ ...calendar[0], start: "2030-02-30" }]),
  );
  const s = finish(tasks(), 4, {
    day: "2030-09-01",
    random: sequence([0.1, 0.4, 0.8]),
    calendar,
  });
  assert.equal(s.flowers[0].seasonId, "chuseok");
});
test("나중에는 원본처럼 씨앗 보관, 복원은 활성 목록 끝으로", () => {
  let s = tasks();
  const id = s.tasks[0].id;
  s = changeTask(s, id, "later");
  assert.equal(s.tasks[0].status, "postponed");
  assert.notEqual(original.activeTask(s).id, id);
  s = changeTask(s, id, "restore");
  assert.equal(s.tasks.find((t) => t.id === id).status, "active");
  assert.equal([...s.tasks].sort((a, b) => a.order - b.order).at(-1).id, id);
  assert.equal(s.completedTotal, 0);
});
test("수정·삭제·순서 변경, 작은 단계 원래 제목 보존 및 현재 위치 교체", () => {
  let s = tasks();
  const id = s.tasks[0].id;
  s = editTask(s, id, "수정한 제목");
  assert.equal(original.activeTask(s).title, "수정한 제목");
  s = reorderTask(s, id, 1);
  assert.notEqual(original.activeTask(s).id, id);
  s = reorderTask(s, id, -1);
  assert.equal(original.activeTask(s).id, id);
  assert.throws(() => changeTask(s, id, "split", [" "]));
  s = changeTask(s, id, "split", ["열기", "한 줄 쓰기"]);
  assert.equal(original.activeTask(s).title, "열기");
  assert.equal(s.tasks[0].originalTitle, "수정한 제목");
  assert.equal(s.tasks.length, 5);
  s = changeTask(s, s.tasks[0].id, "delete");
  assert.equal(original.activeTask(s).title, "한 줄 쓰기");
  assert.equal(s.completedTotal, 0);
});
test("광고 취소·미제공 시 보관, 같은 품종+색상 중복은 무료", () => {
  let s = finish(tasks(8));
  const id = s.flowers[0].id;
  for (const reward of ["cancelled", "unavailable"]) {
    assert.deepEqual(registerFlower(s, id, { reward }), s);
    assert.equal(importBackup(exportBackup(s)).flowers.length, 1);
  }
  s = registerFlower(s, id, { reward: "earned-test" });
  s = finish(s);
  s = registerFlower(s, s.flowers[0].id);
  assert.ok(s.flowers.every((f) => f.registeredAt));
  assert.equal(original.getCatalog(s).length, 1);
});
test("새 색상은 별도 보상 필요, PLUS 데모는 무료 등록", () => {
  let s = finish(tasks(8));
  s = registerFlower(s, s.flowers[0].id, { reward: "earned-test" });
  s = finish(s, 4, { day: "2026-06-01", random: () => 0.001 });
  const id = s.flowers[0].id;
  assert.equal(registerFlower(s, id).flowers[0].registeredAt, null);
  s.premiumDemo = true;
  assert.ok(registerFlower(s, id).flowers[0].registeredAt);
});
test("원본 v1 JSON 복원: 생각 원문, 제목·작업 순서·씨앗·날짜·꽃·등록 상태 보존", () => {
  let old = original.addThought(
    original.createInitialState(),
    "하나\n둘\n셋\n넷\n보관",
  );
  for (let i = 0; i < 4; i++)
    old = original.finishTask(
      old,
      original.activeTask(old).id,
      () => 0.001,
      new Date("2026-11-03T10:00:00Z"),
    );
  old = original.postponeTask(old, original.activeTask(old).id);
  const migrated = importBackup(JSON.stringify(old));
  assert.equal(migrated.version, 3);
  assert.deepEqual(migrated.thoughts, old.thoughts);
  assert.deepEqual(migrated.tasks, old.tasks);
  assert.deepEqual(migrated.flowers, old.flowers);
  assert.equal(migrated.flowers[0].registeredAt, null);
  assert.deepEqual(importBackup(exportBackup(migrated)), migrated);
});
test("앞선 모바일 v2 백업의 색·문구·등록·성취·씨앗을 변조 없이 보존", () => {
  let old = legacy.addTasks(legacy.initialState(), [
    "a",
    "b",
    "c",
    "d",
    "seed",
  ]);
  for (let i = 0; i < 4; i++)
    old = legacy.completeTask(
      old,
      old.tasks.find((t) => t.status === "active").id,
      { day: "2026-06-01", random: () => 0.01 },
    );
  old = legacy.changeTask(
    old,
    old.tasks.find((t) => t.status === "active").id,
    "archive",
  );
  old = legacy.registerFlower(old, old.flowers[0].id, {
    reward: "earned-test",
  });
  old.settings.reduceMotion = true;
  const migrated = importBackup(legacy.exportBackup(old));
  assert.equal(migrated.completedTotal, 4);
  assert.equal(migrated.flowers[0].variantId, "legacy-violet");
  assert.equal(
    migrated.flowers[0].color,
    legacy.flowerInfo(old.flowers[0]).color.hex,
  );
  assert.deepEqual(
    migrated.flowers[0].achievements,
    old.flowers[0].achievements,
  );
  assert.ok(migrated.flowers[0].registeredAt);
  assert.ok(migrated.settings.reduceMotion);
  assert.equal(
    migrated.tasks.find((t) => t.title === "seed").status,
    "postponed",
  );
  assert.deepEqual(importBackup(exportBackup(migrated)), migrated);
});
test("손상·미래 버전·중복 ID·거짓 날짜·미지 품종 백업 거절", () => {
  const s = finish(tasks());
  assert.throws(() => importBackup("bad"));
  assert.throws(() => importBackup('{"format":"other"}'));
  for (const mutate of [
    (x) => (x.version = 99),
    (x) => (x.completedTotal = 8),
    (x) => (x.tasks[1].id = x.tasks[0].id),
    (x) => (x.flowers[0].createdAt = "2026-02-30"),
    (x) => (x.flowers[0].speciesId = "unknown"),
  ]) {
    const copy = structuredClone(s);
    mutate(copy);
    assert.throws(() => migrateState(copy));
  }
});
