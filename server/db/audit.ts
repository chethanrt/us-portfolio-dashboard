import type Database from "better-sqlite3";

export interface AuditEventInput {
  /** Empty when the actor can't be resolved (e.g. no session header sent). */
  actorUserId: string;
  eventType: "login" | "logout" | "create" | "update" | "delete";
  /** Human-readable module label for display, e.g. "People", "Projects", "Auth". */
  module: string;
  recordId?: string;
  summary?: string;
}

function resolveActorUsername(db: Database.Database, actorUserId: string): string {
  if (!actorUserId) return "Unknown";
  const row = db.prepare("SELECT username FROM users WHERE id = ?").get(actorUserId) as
    | { username: string }
    | undefined;
  return row?.username ?? "Unknown";
}

/** Inserts one row into audit_log. Never throws — a logging failure must never break the request it's logging. */
export function recordAuditEvent(db: Database.Database, input: AuditEventInput): void {
  try {
    const actorUsername = resolveActorUsername(db, input.actorUserId);
    db.prepare(
      `INSERT INTO audit_log (id, timestamp, actor_user_id, actor_username, event_type, module, record_id, summary)
       VALUES (@id, @timestamp, @actorUserId, @actorUsername, @eventType, @module, @recordId, @summary)`
    ).run({
      id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      timestamp: new Date().toISOString(),
      actorUserId: input.actorUserId || "",
      actorUsername,
      eventType: input.eventType,
      module: input.module,
      recordId: input.recordId ?? "",
      summary: input.summary ?? "",
    });
  } catch (err) {
    console.error("Failed to record audit event", err);
  }
}
