import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import Database from "better-sqlite3";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const DB_PATH = path.join(__dirname, "portfolio.sqlite3");
const SCHEMA_PATH = path.join(__dirname, "schema.sql");

let db: Database.Database | undefined;

/** Opens (or creates) the SQLite database and ensures the schema exists. */
export function getDb(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma("journal_mode = WAL");
    db.exec(fs.readFileSync(SCHEMA_PATH, "utf-8"));
  }
  return db;
}
