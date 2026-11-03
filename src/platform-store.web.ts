import {
  initialState,
  migrateState,
  exportBackup,
  importBackup,
} from "./mobile-domain.mjs";
// Browser preview only. iOS/Android resolve platform-store.ts and always use SQLite.
let connection: Promise<IDBDatabase> | null = null;
function database() {
  if (!connection)
    connection = new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open("onjeom-expo-preview", 1);
      request.onupgradeneeded = () =>
        request.result.createObjectStore("app_state");
      request.onsuccess = () => {
        request.result.onversionchange = () => {
          request.result.close();
          connection = null;
        };
        resolve(request.result);
      };
      request.onerror = () => {
        connection = null;
        reject(Error("브라우저 저장소를 열지 못했습니다."));
      };
      request.onblocked = () => {
        connection = null;
        reject(Error("다른 창을 닫은 뒤 다시 시도해 주세요."));
      };
    });
  return connection;
}
async function read() {
  const db = await database();
  return new Promise<any>((resolve, reject) => {
    const tx = db.transaction("app_state", "readonly");
    const req = tx.objectStore("app_state").get(1);
    tx.oncomplete = () => resolve(req.result);
    tx.onerror = () => reject(Error("저장 기록을 불러오지 못했습니다."));
    tx.onabort = () => reject(Error("저장소 읽기가 중단되었습니다."));
  });
}
async function write(state: any) {
  const valid = migrateState(state);
  const db = await database();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction("app_state", "readwrite");
    tx.objectStore("app_state").put(valid, 1);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(Error("브라우저 저장 공간을 확인해 주세요."));
    tx.onabort = () => reject(Error("저장을 완료하지 못했습니다."));
  });
}
export async function openPlatformStore() {
  await database();
  return {
    async load() {
      const raw = await read();
      return raw ? migrateState(raw) : initialState();
    },
    save: write,
    async restore(text: string) {
      const state = importBackup(text);
      await write(state);
      return state;
    },
    async backup() {
      return exportBackup(await this.load());
    },
    async clear() {
      const state = initialState();
      await write(state);
      return state;
    },
  };
}
export async function recoverPlatformStore(text: string) {
  const state = importBackup(text);
  const store = await openPlatformStore();
  await store.save(state);
  return store;
}
