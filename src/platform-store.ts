import * as SQLite from "expo-sqlite";
import { createStore, recoverStore } from "./storage.mjs";
let database: SQLite.SQLiteDatabase | null = null;
async function openDatabase() {
  if (!database) database = await SQLite.openDatabaseAsync("onjeom.db");
  return database;
}
export async function openPlatformStore() {
  return createStore(await openDatabase());
}
export async function recoverPlatformStore(text: string) {
  return recoverStore(await openDatabase(), text);
}
