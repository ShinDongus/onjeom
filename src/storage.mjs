import {
  initialState,
  migrateState,
  importBackup,
  exportBackup,
} from "./mobile-domain.mjs";
/** expo-sqlite async API; injectable adapter allows real SQLite integration tests. */
export async function createStore(db, { recovered = null } = {}) {
  if (recovered) recovered = migrateState(recovered);
  await db.execAsync("PRAGMA journal_mode = WAL; PRAGMA synchronous = FULL;");
  await db.withExclusiveTransactionAsync(async (tx) => {
    const row = await tx.getFirstAsync("PRAGMA user_version");
    const version = row.user_version;
    if (version > 4)
      throw Error("새 버전 앱에서 만든 데이터입니다. 앱을 업데이트해 주세요.");
    if (version === 0)
      await tx.execAsync(
        "CREATE TABLE IF NOT EXISTS app_state (id INTEGER PRIMARY KEY CHECK (id = 1), payload TEXT NOT NULL); PRAGMA user_version = 1;",
      );
    if (version <= 1) {
      await tx.execAsync(
        "CREATE TABLE IF NOT EXISTS metadata (key TEXT PRIMARY KEY, value TEXT NOT NULL); PRAGMA user_version = 2;",
      );
    }
    if (version <= 2) {
      const existing = await tx.getFirstAsync(
        "SELECT payload FROM app_state WHERE id = 1",
      );
      if (existing && !recovered)
        await tx.runAsync(
          "UPDATE app_state SET payload = ? WHERE id = 1",
          JSON.stringify(migrateState(JSON.parse(existing.payload))),
        );
      await tx.execAsync("PRAGMA user_version = 3;");
    }
    if (version <= 3) {
      const existing = await tx.getFirstAsync(
        "SELECT payload FROM app_state WHERE id = 1",
      );
      if (existing && !recovered)
        await tx.runAsync(
          "UPDATE app_state SET payload = ? WHERE id = 1",
          JSON.stringify(migrateState(JSON.parse(existing.payload))),
        );
      await tx.execAsync("PRAGMA user_version = 4;");
    }
    if (recovered)
      await tx.runAsync(
        "INSERT INTO app_state (id,payload) VALUES (1,?) ON CONFLICT(id) DO UPDATE SET payload=excluded.payload",
        JSON.stringify(recovered),
      );
  });
  const save = async (state) => {
    const payload = JSON.stringify(migrateState(state));
    await db.withExclusiveTransactionAsync(async (tx) => {
      await tx.runAsync(
        "INSERT INTO app_state (id,payload) VALUES (1,?) ON CONFLICT(id) DO UPDATE SET payload=excluded.payload",
        payload,
      );
    });
  };
  return {
    async load() {
      const row = await db.getFirstAsync(
        "SELECT payload FROM app_state WHERE id = 1",
      );
      return row ? migrateState(JSON.parse(row.payload)) : initialState();
    },
    save,
    async restore(text) {
      const state = importBackup(text);
      await save(state);
      return state;
    },
    async backup() {
      return exportBackup(await this.load());
    },
    async clear() {
      const state = initialState();
      await save(state);
      await db.execAsync("PRAGMA wal_checkpoint(TRUNCATE); VACUUM;");
      return state;
    },
  };
}

/** Explicit user-confirmed recovery only; invalid backups and future DB versions never overwrite. */
export async function recoverStore(db, text) {
  return createStore(db, { recovered: importBackup(text) });
}
