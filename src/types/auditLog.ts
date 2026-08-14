/** audit_log — append-only trail of logins/logouts and every create/update/delete. */
export interface AuditLogEntry {
  id: string;
  /** ISO timestamp, server-stamped. */
  timestamp: string;
  actorUserId: string;
  actorUsername: string;
  eventType: "login" | "logout" | "create" | "update" | "delete";
  /** Human-readable module label, e.g. "People", "Projects", "Auth". */
  module: string;
  recordId: string;
  summary: string;
}
