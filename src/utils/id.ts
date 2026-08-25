/**
 * crypto.randomUUID() only exists in a "secure context" (HTTPS, or
 * http://localhost/127.0.0.1) — it throws when the app is reached over plain
 * HTTP via a network IP or hostname, which is how this app is actually
 * accessed day-to-day. This generates an equivalent id everywhere.
 */
export function generateGroupId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    try {
      return crypto.randomUUID();
    } catch {
      // fall through to the manual generator below
    }
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
