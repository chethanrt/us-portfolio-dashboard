/**
 * One-time data transformation: replaces every plaintext password in the
 * `users` table with a bcrypt hash. Not a schema migration (no structure
 * changes, so it doesn't belong in server/db/migrations/) — run manually,
 * once, against a database still holding plaintext passwords from before
 * real authentication existed.
 *
 * Safe to run more than once: a value that's already a bcrypt hash (starts
 * with "$2") is left untouched instead of being re-hashed.
 *
 * Usage: npx tsx server/db/hashExistingPasswords.ts
 */
import bcrypt from "bcryptjs";
import { getDb } from "./client.ts";

function main(): void {
  const db = getDb();
  const users = db.prepare("SELECT id, password FROM users").all() as { id: string; password: string }[];

  let hashed = 0;
  let skipped = 0;
  const update = db.prepare("UPDATE users SET password = ? WHERE id = ?");

  for (const user of users) {
    if (user.password.startsWith("$2")) {
      skipped += 1;
      continue;
    }
    update.run(bcrypt.hashSync(user.password, 10), user.id);
    hashed += 1;
  }

  console.log(`Hashed ${hashed} password(s); skipped ${skipped} already-hashed row(s).`);
}

main();
