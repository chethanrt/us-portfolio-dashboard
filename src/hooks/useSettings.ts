import { useCallback, useEffect, useState } from "react";
import { settingsService } from "@/services";
import type { EditableSettingsKey } from "@/services/SettingsService";
import type { AppSettings } from "@/types";

/** Loads app settings and exposes list mutations for the Settings page. */
export function useSettings() {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    settingsService
      .getSettings()
      .then((loaded) => {
        if (!cancelled) setSettings(loaded);
      })
      .catch(() => {
        if (!cancelled) setError("Unable to load settings.");
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const updateList = useCallback(async (key: EditableSettingsKey, values: string[]) => {
    const updated = await settingsService.updateList(key, values);
    setSettings(updated);
  }, []);

  return { settings, isLoading, error, updateList };
}
