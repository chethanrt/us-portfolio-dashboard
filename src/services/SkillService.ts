import skillsData from "@/data/skills.json";
import type { SkillRecord } from "@/types";
import { simulateRequest } from "./BaseService";

const skills = skillsData as SkillRecord[];

class SkillService {
  getAll(): Promise<SkillRecord[]> {
    return simulateRequest(skills);
  }

  async getByEmployee(employeeId: string): Promise<SkillRecord | undefined> {
    const all = await this.getAll();
    return all.find((record) => record.employeeId === employeeId);
  }
}

export const skillService = new SkillService();
