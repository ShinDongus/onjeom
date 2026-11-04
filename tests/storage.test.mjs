import { test } from "node:test";
import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { saveJournal } from "../src/journal.mjs";
import { setDiaryEntry } from "../src/diary.mjs";
import { createStore } from "../src/storage.mjs";
import {
  initialState,
  addTasks,
  completeTask,
  changeTask,
  exportBackup,
} from "../src/mobile-domain.mjs";
function adapter(path) {
  const db = new DatabaseSync(path);
  return {
    execAsync: async (sql) => db.exec(sql),
    getFirstAsync: async (sql, ...args) => db.prepare(sql).get(...args),
    runAsync: async (sql, ...args) => db.prepare(sql).run(...args),
    async withExclusiveTransactionAsync(fn) {
      db.exec("BEGIN EXCLUSIVE");
      try {
        await fn(this);
        db.exec("COMMIT");
      } catch (e) {
        db.exec("ROLLBACK");
        throw e;
      }
    },
    close: () => db.close(),
  };
}
test("실제 SQLite: 마이그레이션, 재실행 복원, 광고 취소 꽃 보관, 백업 복구, 삭제", async () => {
  const dir = await mkdtemp(join(tmpdir(), "onjeom-"));
  const path = join(dir, "test.db");
  let db = adapter(path);
  try {
    let store = await createStore(db);
    let s = addTasks(initialState(), ["a", "b", "c", "d", "씨앗"]);
    for (const t of s.tasks.slice(0, 4))
      s = completeTask(s, t.id, { day: "2026-06-01", random: () => 0.01 });
    s = changeTask(s, s.tasks.find((t) => t.status === "active").id, "archive");
    s = setDiaryEntry(s, "2026-06-01", {
      draft: "정리할 생각",
      note: "오래 기억할 하루",
    });
    s = saveJournal(s, "2026-06-01", { text: "이어온 일기", mood: "맑음" });
    await store.save(s);
    db.close();
    db = adapter(path);
    store = await createStore(db);
    assert.deepEqual(await store.load(), s);
    assert.equal((await store.load()).flowers[0].registeredAt, null);
    const backup = await store.backup();
    await store.clear();
    assert.deepEqual(await store.load(), initialState());
    await store.restore(backup);
    assert.deepEqual(await store.load(), s);
    await assert.rejects(() => store.restore("corrupt"));
    assert.deepEqual(await store.load(), s);
    const corrupt = JSON.parse(backup);
    corrupt.data.version = 999;
    await assert.rejects(() => store.restore(JSON.stringify(corrupt)));
    assert.deepEqual(await store.load(), s);
    db.close();
    db = adapter(path);
    store = await createStore(db);
    assert.deepEqual(await store.load(), s);
  } finally {
    db.close();
    await rm(dir, { recursive: true, force: true });
  }
});
test("원본 v1 SQLite 및 payload를 v4로 원자적 마이그레이션", async () => {
  const db = adapter(":memory:");
  try {
    await db.execAsync(
      "CREATE TABLE app_state (id INTEGER PRIMARY KEY,payload TEXT NOT NULL); PRAGMA user_version = 1;",
    );
    const old = { ...initialState(), version: 1 };
    delete old.settings;
    await db.runAsync("INSERT INTO app_state VALUES(1,?)", JSON.stringify(old));
    const store = await createStore(db);
    assert.deepEqual(await store.load(), initialState());
    assert.equal(
      (await db.getFirstAsync("PRAGMA user_version")).user_version,
      4,
    );
    assert.equal(
      JSON.parse(
        (await db.getFirstAsync("SELECT payload FROM app_state")).payload,
      ).version,
      4,
    );
  } finally {
    db.close();
  }
});
test("마이그레이션 실패 롤백 및 미래 DB 버전 보호", async () => {
  const db = adapter(":memory:");
  try {
    await db.execAsync(
      "CREATE TABLE app_state (id INTEGER PRIMARY KEY,payload TEXT NOT NULL); PRAGMA user_version = 1;",
    );
    await db.runAsync("INSERT INTO app_state VALUES(1,?)", "broken");
    await assert.rejects(() => createStore(db));
    assert.equal(
      (await db.getFirstAsync("PRAGMA user_version")).user_version,
      1,
    );
    await db.execAsync("PRAGMA user_version = 99;");
    await assert.rejects(() => createStore(db));
    assert.equal(
      (await db.getFirstAsync("PRAGMA user_version")).user_version,
      99,
    );
  } finally {
    db.close();
  }
});

test("기존 모바일 DB v2 → v4 및 재오픈, 실패 백업 복원은 기존 데이터 보존", async () => {
  const {
    initialState: oldInitial,
    addTasks: oldAdd,
    completeTask: oldFinish,
  } = await import("../src/legacy-mobile.mjs");
  const db = adapter(":memory:");
  try {
    await db.execAsync(
      "CREATE TABLE app_state (id INTEGER PRIMARY KEY,payload TEXT NOT NULL); PRAGMA user_version = 2;",
    );
    let old = oldAdd(oldInitial(), ["a", "b", "c", "d"]);
    for (const t of old.tasks)
      old = oldFinish(old, t.id, { day: "2026-06-01", random: () => 0.2 });
    await db.runAsync("INSERT INTO app_state VALUES(1,?)", JSON.stringify(old));
    const store = await createStore(db);
    const s = await store.load();
    assert.equal(s.version, 4);
    assert.equal(s.completedTotal, 4);
    assert.equal(s.flowers.length, 1);
    assert.equal(
      (await db.getFirstAsync("PRAGMA user_version")).user_version,
      4,
    );
    await assert.rejects(() => store.restore("corrupt"));
    assert.deepEqual(await store.load(), s);
  } finally {
    db.close();
  }
});

test("손상된 이전 DB도 검증된 백업으로만 명시적 복구, 미래 DB는 보호", async () => {
  const { recoverStore } = await import("../src/storage.mjs");
  const db = adapter(":memory:");
  try {
    await db.execAsync(
      "CREATE TABLE app_state (id INTEGER PRIMARY KEY,payload TEXT NOT NULL); PRAGMA user_version = 2;",
    );
    await db.runAsync("INSERT INTO app_state VALUES(1,?)", "broken original");
    await assert.rejects(() => createStore(db));
    await assert.rejects(() => recoverStore(db, "broken backup"));
    assert.equal(
      (await db.getFirstAsync("SELECT payload FROM app_state")).payload,
      "broken original",
    );
    const expected = addTasks(initialState(), ["복원한 씨앗"]);
    const store = await recoverStore(db, exportBackup(expected));
    assert.deepEqual(await store.load(), expected);
    assert.equal(
      (await db.getFirstAsync("PRAGMA user_version")).user_version,
      4,
    );
    await db.execAsync("PRAGMA user_version = 99;");
    await assert.rejects(() => recoverStore(db, exportBackup(initialState())));
    assert.deepEqual(await store.load(), expected);
  } finally {
    db.close();
  }
});
