import type { AppSettings } from "@/types";
import { apiRequest } from "./BaseService";

/** Master-data lists that can be managed on the Settings page. */
export type EditableSettingsKey =
  | "roles"
  | "technicalSkills"
  | "aiSkills"
  | "skills"
  | "aiTools"
  | "projectStages"
  | "activityTypes"
  | "pocCategories"
  | "learningPlatforms"
  | "eventTypes";

/**
 * Settings master data supports list editing. Backed by the `settings`
 * table (one row per top-level AppSettings key); alphabetical sorting of
 * editable lists is applied server-side on every read/write.
 */
class SettingsService {
  getSettings(): Promise<AppSettings> {
    return apiRequest<AppSettings>("/api/settings");
  }

  updateList(key: EditableSettingsKey, values: string[]): Promise<AppSettings> {
    return apiRequest<AppSettings>(`/api/settings/${key}`, {
      method: "PUT",
      body: JSON.stringify({ values }),
    });
  }
}

export const settingsService = new SettingsService();
