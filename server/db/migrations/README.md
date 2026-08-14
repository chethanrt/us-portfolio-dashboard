# Schema Migrations

Incremental schema changes go here as plain `.sql` files — one file per
change, run automatically (in filename order) the next time the server
starts, on every environment, exactly once each.

## When to add one

Any time you change the shape of an existing table — add a column, add an
index, rename something — **after** that table already exists in
`schema.sql`. New tables don't need a migration: just add them directly to
`schema.sql` (its `CREATE TABLE IF NOT EXISTS` statements already handle
"create on first run, do nothing after that" correctly on their own).

## Naming convention

`NNNN_short_description.sql` — a zero-padded, incrementing 4-digit number,
so filenames sort in the order they should run. Example:

```
0001_add_project_country.sql
0002_add_task_priority_index.sql
```

## Writing one

Plain SQL, applied inside a transaction. For adding a column:

```sql
ALTER TABLE projects ADD COLUMN country TEXT NOT NULL DEFAULT '';
```

Give new columns a sensible default (as above) so existing rows on every
other environment stay valid the moment the migration runs — nobody has to
backfill anything by hand.

## What NOT to put in a migration

Test data, sample rows, or anything from `src/data/*.json` — that's
`server/db/migrate.ts`'s job (the one-time seed), not this folder's.
Migrations here should only ever change **structure**, never insert real
content. That separation is exactly what keeps local test data from ever
travelling to another environment when you push a schema change.

## How it actually runs

`server/db/migrations.ts` tracks which files have already applied (in a
`schema_migrations` table, one row per filename) and only runs the ones it
hasn't seen yet, every time `getDb()` is called — i.e. automatically on
every server start. Re-running is always safe: with nothing new, it's a
no-op.
