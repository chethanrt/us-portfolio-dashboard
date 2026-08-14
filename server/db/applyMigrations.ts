/**
 * Applies any pending schema migrations without starting the API server —
 * useful as an explicit deploy step. `getDb()` already does this
 * automatically on every server start, so this is a convenience for CI/CD
 * pipelines that want the schema updated as its own visible step.
 *
 * Usage: npm run db:migrate-schema
 */
import { getDb } from "./client.ts";

getDb();
console.log("Schema is up to date.");
