/**
 * Shared fetch helper for all services, backed by the Express/SQLite API
 * under /api (see server/). Replaces the old localStorage + simulateRequest
 * layer — every service's public method signatures and business logic are
 * unchanged, only the storage mechanism underneath them moved.
 */
export async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(path, {
    ...options,
    credentials: "include", // send the session cookie with every request
    headers: { "Content-Type": "application/json", ...options.headers },
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
