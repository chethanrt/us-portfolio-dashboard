import { useCallback, useEffect, useState } from "react";

function isKnownKey<T extends string>(allKeys: readonly T[], value: string): value is T {
  return (allKeys as readonly string[]).includes(value);
}

function load<T extends string>(storageKey: string, allKeys: readonly T[], defaultVisible: readonly T[]): T[] {
  try {
    const stored = localStorage.getItem(storageKey);
    if (stored !== null) {
      return (JSON.parse(stored) as string[]).filter((key): key is T => isKnownKey(allKeys, key));
    }
  } catch {
    // fall through to defaults on corrupt storage
  }
  return [...defaultVisible];
}

/**
 * Generic personal, per-browser preference for which optional UI controls are
 * shown. Persisted to Local Storage under `storageKey` so each user can hide
 * controls they never use without affecting anyone else. An intentional
 * "hide everything" choice (an empty array) is preserved, not treated as
 * missing data.
 */
export function useVisibilityPreference<T extends string>(
  storageKey: string,
  allKeys: readonly T[],
  defaultVisible: readonly T[]
) {
  const [visible, setVisible] = useState<T[]>(() => load(storageKey, allKeys, defaultVisible));

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(visible));
  }, [storageKey, visible]);

  const isVisible = useCallback((key: T) => visible.includes(key), [visible]);

  const toggle = useCallback((key: T) => {
    setVisible((current) => (current.includes(key) ? current.filter((k) => k !== key) : [...current, key]));
  }, []);

  return { isVisible, toggle };
}
