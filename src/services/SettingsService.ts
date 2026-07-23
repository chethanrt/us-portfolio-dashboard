import settingsData from "@/data/settings.json";
import type { AppSettings } from "@/types";
import { simulateRequest } from "./BaseService";

const seedSettings = settingsData as AppSettings;

const STORAGE_KEY = "ai-portfolio-dashboard.settings";

/** Master-data lists that can be managed on the Settings page. */
export type EditableSettingsKey =
  | "roles"
  | "technicalSkills"
  | "aiSkills"
  | "aiTools"
  | "projectStages"
  | "activityTypes"
  | "pocCategories"
  | "learningPlatforms";

/**
 * Settings master data supports list editing. Mutations persist to
 * Local Storage; the JSON file remains the seed data.
 */
class SettingsService {
  private load(): AppSettings {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) return JSON.parse(stored) as AppSettings;
    } catch {
      // fall through to seed data on corrupt storage
    }
    return seedSettings;
  }

  private persist(settings: AppSettings): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }

  getSettings(): Promise<AppSettings> {
    return simulateRequest(this.load());
  }

  async updateList(key: EditableSettingsKey, values: string[]): Promise<AppSettings> {
    const settings = this.load();
    const updated = { ...settings, [key]: values } as AppSettings;
    this.persist(updated);
    return simulateRequest(updated);
  }
}

export const settingsService = new SettingsService();
