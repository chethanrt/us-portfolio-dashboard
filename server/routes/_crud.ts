import { Router } from "express";
import type Database from "better-sqlite3";

/**
 * Generic CRUD plumbing shared by every entity. All business logic
 * (cross-service orchestration, delete guards, sync side effects) stays in
 * the frontend service classes exactly as before migration — this router
 * is deliberately a thin, dumb CRUD layer, nothing more.
 */
export function createCrudRouter(opts: {
  db: Database.Database;
  table: string;
  idColumn?: string;
  /** e.g. "rowid DESC" to replicate a service that used to prepend new records (newest-first lists). */
  listOrderBy?: string;
  fromRow: (row: any) => any;
  toRow: (payload: any) => Record<string, unknown>;
  generateId: (db: Database.Database, payload: any) => string;
}) {
  const { db, table, fromRow, toRow, generateId } = opts;
  const idColumn = opts.idColumn ?? "id";
  const router = Router();

  router.get("/", (_req, res) => {
    const rows = db.prepare(`SELECT * FROM ${table}${opts.listOrderBy ? ` ORDER BY ${opts.listOrderBy}` : ""}`).all();
    res.json(rows.map(fromRow));
  });

  router.get("/:id", (req, res) => {
    const row = db.prepare(`SELECT * FROM ${table} WHERE ${idColumn} = ?`).get(req.params.id);
    if (!row) {
      res.status(404).json({ error: "NOT_FOUND" });
      return;
    }
    res.json(fromRow(row));
  });

  router.post("/", (req, res) => {
    try {
      const id = generateId(db, req.body);
      const columns = toRow(req.body);
      const keys = Object.keys(columns);
      const columnList = [idColumn, ...keys].join(", ");
      const valueList = [`@${idColumn}`, ...keys.map((k) => `@${k}`)].join(", ");
      db.prepare(`INSERT INTO ${table} (${columnList}) VALUES (${valueList})`).run({
        [idColumn]: id,
        ...columns,
      });
      const row = db.prepare(`SELECT * FROM ${table} WHERE ${idColumn} = ?`).get(id);
      res.status(201).json(fromRow(row));
    } catch (err) {
      res.status(400).json({ error: (err as Error).message });
    }
  });

  router.put("/:id", (req, res) => {
    try {
      const columns = toRow(req.body);
      const keys = Object.keys(columns);
      if (keys.length > 0) {
        db.prepare(`UPDATE ${table} SET ${keys.map((k) => `${k} = @${k}`).join(", ")} WHERE ${idColumn} = @${idColumn}`).run({
          [idColumn]: req.params.id,
          ...columns,
        });
      }
      const row = db.prepare(`SELECT * FROM ${table} WHERE ${idColumn} = ?`).get(req.params.id);
      if (!row) {
        res.status(404).json({ error: "NOT_FOUND" });
        return;
      }
      res.json(fromRow(row));
    } catch (err) {
      res.status(400).json({ error: (err as Error).message });
    }
  });

  router.delete("/:id", (req, res) => {
    const result = db.prepare(`DELETE FROM ${table} WHERE ${idColumn} = ?`).run(req.params.id);
    if (result.changes === 0) {
      res.status(404).json({ error: "NOT_FOUND" });
      return;
    }
    res.status(204).end();
  });

  return router;
}
