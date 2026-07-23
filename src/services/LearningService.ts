import learningData from "@/data/learning.json";
import type { LearningRecord } from "@/types";
import { simulateRequest } from "./BaseService";

const seedLearning = learningData as LearningRecord[];

const STORAGE_KEY = "ai-portfolio-dashboard.learning";

/**
 * Learning records support full CRUD. Mutations persist to Local Storage;
 * the JSON file remains the seed data.
 */
class LearningService {
  private load(): LearningRecord[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) return JSON.parse(stored) as LearningRecord[];
    } catch {
      // fall through to seed data on corrupt storage
    }
    return seedLearning;
  }

  private persist(records: LearningRecord[]): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  }

  private nextId(records: LearningRecord[]): string {
    const maxNumber = records.reduce((max, record) => {
      const number = Number(record.id.replace("LRN", ""));
      return Number.isFinite(number) && number > max ? number : max;
    }, 0);
    return `LRN${String(maxNumber + 1).padStart(3, "0")}`;
  }

  getAll(): Promise<LearningRecord[]> {
    return simulateRequest(this.load());
  }

  async getByEmployee(employeeId: string): Promise<LearningRecord[]> {
    const all = await this.getAll();
    return all.filter((record) => record.employeeId === employeeId);
  }

  async create(input: Omit<LearningRecord, "id">): Promise<LearningRecord> {
    const all = this.load();
    const created: LearningRecord = { ...input, id: this.nextId(all) };
    this.persist([created, ...all]);
    return simulateRequest(created);
  }

  async update(id: string, input: Omit<LearningRecord, "id">): Promise<LearningRecord> {
    const all = this.load();
    const index = all.findIndex((record) => record.id === id);
    if (index === -1) throw new Error(`Learning record ${id} not found`);
    const updated: LearningRecord = { ...input, id };
    all[index] = updated;
    this.persist(all);
    return simulateRequest(updated);
  }

  async delete(id: string): Promise<void> {
    this.persist(this.load().filter((record) => record.id !== id));
    await simulateRequest(undefined);
  }
}

export const learningService = new LearningService();
