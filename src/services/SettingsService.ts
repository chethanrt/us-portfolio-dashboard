import type { AppSettings } from "@/types";
import { apiRequest } from "./BaseService";

/** Master-data lists that can be managed on the Settings page. */
export type EditableSettingsKey =
  | "technicalSkills"
  | "aiSkills"
  | "skills"
  | "aiTools"
  | "projectStages"
  | "activityTypes"
  | "pocCategories"
  | "learningPlatforms"
  | "eventTypes"
  | "aiAdoptionCategories";

/**
 * Every list defaults to empty, and `statusValues` to its own all-empty
 * shape, for any key a database is missing — e.g. one seeded before that
 * key existed and never re-synced (`npm run db:sync-config` backfills it
 * server-side; this is the client-side safety net for whenever that hasn't
 * happened yet). Without this, a missing key comes back `undefined` and
 * crashes the first `.map()` over it — this happened for real with
 * `aiAdoptionCategories` on a database from before that setting existed.
 */
function withDefaults(settings: Partial<AppSettings> | null | undefined): AppSettings {
  return {
    technicalSkills: settings?.technicalSkills ?? [],
    aiSkills: settings?.aiSkills ?? [],
    skills: settings?.skills ?? [],
    projectStages: settings?.projectStages ?? [],
    aiTools: settings?.aiTools ?? [],
    learningPlatforms: settings?.learningPlatforms ?? [],
    activityTypes: settings?.activityTypes ?? [],
    pocCategories: settings?.pocCategories ?? [],
    aiAdoptionCategories: settings?.aiAdoptionCategories ?? [],
    impactLevels: settings?.impactLevels ?? [],
    eventTypes: settings?.eventTypes ?? [],
    statusValues: {
      project: settings?.statusValues?.project ?? [],
      employee: settings?.statusValues?.employee ?? [],
      learning: settings?.statusValues?.learning ?? [],
      poc: settings?.statusValues?.poc ?? [],
    },
  };
}

/**
 * Settings master data supports list editing. Backed by the `settings`
 * table (one row per top-level AppSettings key); alphabetical sorting of
 * editable lists is applied server-side on every read/write.
 */
class SettingsService {
  async getSettings(): Promise<AppSettings> {
    return withDefaults(await apiRequest<Partial<AppSettings>>("/api/settings"));
  }

  updateList(key: EditableSettingsKey, values: string[]): Promise<AppSettings> {
    return apiRequest<AppSettings>(`/api/settings/${key}`, {
      method: "PUT",
      body: JSON.stringify({ values }),
    });
  }
}

export const settingsService = new SettingsService();
