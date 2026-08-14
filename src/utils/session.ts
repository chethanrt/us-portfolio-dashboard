/**
 * Shared between AuthContext (owns the session) and BaseService (reads it
 * to stamp every request with X-Actor-Id, for the audit log). Kept in its
 * own file to avoid a cycle: BaseService sits underneath every service,
 * and AuthContext imports services — importing AuthContext directly from
 * BaseService would be circular.
 */
export const SESSION_STORAGE_KEY = "ai-portfolio-dashboard.session";
