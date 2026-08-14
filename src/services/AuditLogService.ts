import type { AuditLogEntry } from "@/types";
import { apiRequest } from "./BaseService";

/**
 * Data access for the audit trail. Every create/update/delete and login
 * are stamped server-side (see server/db/audit.ts); `logEvent` exists only
 * for events with no corresponding CRUD record — today, just logout.
 */
class AuditLogService {
  getRecent(limit = 200): Promise<AuditLogEntry[]> {
    return apiRequest<AuditLogEntry[]>(`/api/audit-log?limit=${limit}`);
  }

  async logEvent(eventType: AuditLogEntry["eventType"], module: string, summary: string): Promise<void> {
    await apiRequest<void>("/api/audit-log", {
      method: "POST",
      body: JSON.stringify({ eventType, module, summary }),
    });
  }
}

export const auditLogService = new AuditLogService();
