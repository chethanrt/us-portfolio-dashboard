import type { LearningRecord } from "@/types";
import { apiRequest } from "./BaseService";

/** Learning records support full CRUD. */
class LearningService {
  getAll(): Promise<LearningRecord[]> {
    return apiRequest<LearningRecord[]>("/api/learning");
  }

  async getByEmployee(employeeId: string): Promise<LearningRecord[]> {
    const all = await this.getAll();
    return all.filter((record) => record.employeeId === employeeId);
  }

  create(input: Omit<LearningRecord, "id">): Promise<LearningRecord> {
    return apiRequest<LearningRecord>("/api/learning", { method: "POST", body: JSON.stringify(input) });
  }

  update(id: string, input: Omit<LearningRecord, "id">): Promise<LearningRecord> {
    return apiRequest<LearningRecord>(`/api/learning/${id}`, { method: "PUT", body: JSON.stringify(input) });
  }

  delete(id: string): Promise<void> {
    return apiRequest<void>(`/api/learning/${id}`, { method: "DELETE" });
  }
}

export const learningService = new LearningService();
