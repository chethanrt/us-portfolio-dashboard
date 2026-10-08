/**
 * Shared fetch helper for all services, backed by the Express/SQLite API
 * under /api (see server/). Replaces the old localStorage + simulateRequest
 * layer — every service's public method signatures and business logic are
 * unchanged, only the storage mechanism underneath them moved.
 */

let onUnauthenticated: (() => void) | null = null;

/**
 * Lets AuthContext find out the moment any request comes back 401 — e.g. the
 * session expired mid-use — so it can clear the signed-in account right
 * away instead of waiting for the next full page load to notice.
 */
export function setUnauthenticatedHandler(handler: (() => void) | null): void {
  onUnauthenticated = handler;
}

export async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(path, {
    ...options,
    credentials: "include", // send the session cookie with every request
    headers: { "Content-Type": "application/json", ...options.headers },
  });

  if (!response.ok) {
    if (response.status === 401) onUnauthenticated?.();
    const body = await response.json().catch(() => ({}) as { error?: string });
    throw new Error(body.error ?? `Request to ${path} failed with status ${response.status}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}
