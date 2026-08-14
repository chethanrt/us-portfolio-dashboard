import type Database from "better-sqlite3";
import { createCrudRouter } from "./_crud.ts";
import { buildRowMapper, boolField } from "./_fields.ts";
import { nextRoleId } from "../db/ids.ts";

const { fromRow, toRow } = buildRowMapper([
  { js: "name", db: "name" },
  { js: "description", db: "description" },
  { js: "isSystem", db: "is_system", ...boolField },
]);

export function createRolesRouter(db: Database.Database) {
  return createCrudRouter({
    db,
    table: "roles",
    module: "Roles",
    fromRow,
    toRow,
    generateId: (database, payload) => nextRoleId(database, payload.name),
  });
}
