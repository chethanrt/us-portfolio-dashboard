import type { SkillRecord } from "@/types";
import { apiRequest } from "./BaseService";

/** Read-only — no create/update/delete exists anywhere in the app today. */
class SkillService {
  getAll(): Promise<SkillRecord[]> {
    return apiRequest<SkillRecord[]>("/api/skills");
  }

  async getByEmployee(employeeId: string): Promise<SkillRecord | undefined> {
    const all = await this.getAll();
    return all.find((record) => record.employeeId === employeeId);
  }
}

export const skillService = new SkillService();
