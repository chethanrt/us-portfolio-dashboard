import pocsData from "@/data/pocs.json";
import type { POC } from "@/types";
import { simulateRequest } from "./BaseService";

const seedPocs = pocsData as POC[];

const STORAGE_KEY = "ai-portfolio-dashboard.pocs";

/**
 * POCs support full CRUD. Mutations persist to Local Storage;
 * the JSON file remains the seed data.
 */
class POCService {
  private load(): POC[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) return JSON.parse(stored) as POC[];
    } catch {
      // fall through to seed data on corrupt storage
    }
    return seedPocs;
  }

  private persist(pocs: POC[]): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(pocs));
  }

  private nextId(pocs: POC[]): string {
    const maxNumber = pocs.reduce((max, poc) => {
      const number = Number(poc.id.replace("POC", ""));
      return Number.isFinite(number) && number > max ? number : max;
    }, 0);
    return `POC${String(maxNumber + 1).padStart(3, "0")}`;
  }

  getAll(): Promise<POC[]> {
    return simulateRequest(this.load());
  }

  async getById(id: string): Promise<POC | undefined> {
    const all = await this.getAll();
    return all.find((poc) => poc.id === id);
  }

  async getByOwner(ownerId: string): Promise<POC[]> {
    const all = await this.getAll();
    return all.filter((poc) => poc.ownerId === ownerId);
  }

  async create(input: Omit<POC, "id">): Promise<POC> {
    const all = this.load();
    const created: POC = { ...input, id: this.nextId(all) };
    this.persist([created, ...all]);
    return simulateRequest(created);
  }

  async update(id: string, input: Omit<POC, "id">): Promise<POC> {
    const all = this.load();
    const index = all.findIndex((poc) => poc.id === id);
    if (index === -1) throw new Error(`POC ${id} not found`);
    const updated: POC = { ...input, id };
    all[index] = updated;
    this.persist(all);
    return simulateRequest(updated);
  }

  async delete(id: string): Promise<void> {
    this.persist(this.load().filter((poc) => poc.id !== id));
    await simulateRequest(undefined);
  }
}

export const pocService = new POCService();
