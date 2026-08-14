import { SESSION_STORAGE_KEY } from "@/utils/session";

/**
 * Shared fetch helper for all services, backed by the Express/SQLite API
 * under /api (see server/). Replaces the old localStorage + simulateRequest
 * layer — every service's public method signatures and business logic are
 * unchanged, only the storage mechanism underneath them moved.
 */
export async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const actorId = localStorage.getItem(SESSION_STORAGE_KEY);
  const response = await fetch(path, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      // Read server-side for the audit log (see server/db/audit.ts) — never for authorization.
      ...(actorId ? { "X-Actor-Id": actorId } : {}),
      ...options.headers,
    },
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}) as { error?: string });
    throw new Error(body.error ?? `Request to ${path} failed with status ${response.status}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}
