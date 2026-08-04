/**
 * Shared helper for all JSON services.
 *
 * Data is served asynchronously (with a small simulated latency) so that
 * components are written against a Promise-based API today and the JSON
 * source can be swapped for a REST API later without touching components.
 */
const SIMULATED_LATENCY_MS = 300;

export function simulateRequest<T>(data: T): Promise<T> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(structuredClone(data)), SIMULATED_LATENCY_MS);
  });
}
