import { test } from "node:test";
import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createStore } from "../src/storage.mjs";
import {
  initialState,
  addTasks,
  completeTask,
  changeTask,
  exportBackup,
} from "../src/logic.mjs";
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
    s = changeTask(s, s.tasks[4].id, "archive");
    await store.save(s);
    db.close();
    db = adapter(path);
    store = await createStore(db);
    assert.deepEqual(await store.load(), s);
    assert.equal((await store.load()).flowers[0].registered, false);
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
test("v1 SQLite 및 payload를 v2로 원자적 마이그레이션", async () => {
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
      2,
    );
    assert.equal(
      JSON.parse(
        (await db.getFirstAsync("SELECT payload FROM app_state")).payload,
      ).version,
      2,
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
