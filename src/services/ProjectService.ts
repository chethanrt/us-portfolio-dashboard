import type { Project } from "@/types";
import { apiRequest } from "./BaseService";
import { activityService } from "./ActivityService";
import { calendarService } from "./CalendarService";
import { employeeService } from "./EmployeeService";
import { pocService } from "./POCService";
import { taskService } from "./TaskService";

const PROJECT_EVENT_TYPE = "Calendar Block for Task";

/**
 * Blocks one team member's calendar for a project's full start->end date
 * range. Reuses the existing "Calendar Block for Task" mirroring in
 * CalendarService as-is (it already turns this into a linked To Do task) —
 * the only extra step is correcting the auto-created task's type/project
 * link, since the generic mirror always produces a Standalone/unlinked task.
 * Skipped when the project has no end date yet — there's no "entire
 * duration" to block without one.
 */
async function createAssignmentBlock(project: Project, employeeId: string, actingEmployeeId: string): Promise<void> {
  if (!project.endDate) return;

  const event = await calendarService.create({
    employeeId,
    title: `Project: ${project.name}`,
    description: project.client ? `Assigned to ${project.name} (${project.client})` : `Assigned to ${project.name}`,
    eventType: PROJECT_EVENT_TYPE,
    start: `${project.startDate}T09:00:00`,
    end: `${project.endDate}T17:00:00`,
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    organizer: project.manager || project.projectManager || project.techLead || "",
    attendees: [],
    location: "",
    outlookEventId: null,
    createdBy: actingEmployeeId,
    linkedPocId: null,
    linkedProjectId: project.id,
    blockGroupId: null,
  });

  if (event.linkedTaskId) {
    await taskService.update(
      event.linkedTaskId,
      { type: "Project", projectId: project.id, category: "General" },
      actingEmployeeId
    );
  }
}

/** Removes one member's project-assignment calendar block (and its linked task, via CalendarService.delete's existing cascade). */
async function removeAssignmentBlock(projectId: string, employeeId: string): Promise<void> {
  const events = await calendarService.getByEmployee(employeeId);
  const matches = events.filter((event) => event.linkedProjectId === projectId);
  await Promise.all(matches.map((event) => calendarService.delete(event.id)));
}

/**
 * Projects support full CRUD. Deletion is blocked while the project is
 * referenced by activities or POCs to keep the data relations valid.
 *
 * Team assignment is mirrored onto the Team Calendar + Task Board: adding a
 * member blocks their calendar for the project's dates and creates a linked
 * To Do task; removing a member removes both. Modeled on POCService's
 * calendar mirroring, but the calendar block IS the source of the task here
 * (via the existing "Calendar Block for Task" mechanism) rather than a
 * separate direct link.
 */
class ProjectService {
  getAll(): Promise<Project[]> {
    return apiRequest<Project[]>("/api/projects");
  }

  async getById(id: string): Promise<Project | undefined> {
    const all = await this.getAll();
    return all.find((project) => project.id === id);
  }

  async getByMember(employeeId: string): Promise<Project[]> {
    const all = await this.getAll();
    return all.filter((project) => project.members.includes(employeeId));
  }

  async create(input: Omit<Project, "id">, actingEmployeeId: string): Promise<Project> {
    const created = await apiRequest<Project>("/api/projects", {
      method: "POST",
      body: JSON.stringify(input),
    });
    await employeeService.syncProjectMembership(created.name, created.members);
    await Promise.all(created.members.map((memberId) => createAssignmentBlock(created, memberId, actingEmployeeId)));
    return created;
  }

  /**
   * Keeps each member's People profile in sync with the team, cleans up the
   * old name on rename, and re-syncs calendar/task assignment blocks:
   * newly-added members get one, dropped members lose theirs, and if the
   * date range changed, everyone who stayed gets their block refreshed to
   * the new dates.
   */
  async update(id: string, input: Omit<Project, "id">, actingEmployeeId: string): Promise<Project> {
    const previous = await this.getById(id);
    if (!previous) throw new Error(`Project ${id} not found`);

    const updated = await apiRequest<Project>(`/api/projects/${id}`, {
      method: "PUT",
      body: JSON.stringify(input),
    });

    if (previous.name !== updated.name) {
      await employeeService.removeProjectEverywhere(previous.name);
    }
    await employeeService.syncProjectMembership(updated.name, updated.members, previous.members);

    const previousSet = new Set(previous.members);
    const updatedSet = new Set(updated.members);
    const added = updated.members.filter((memberId) => !previousSet.has(memberId));
    const removed = previous.members.filter((memberId) => !updatedSet.has(memberId));
    const unchanged = updated.members.filter((memberId) => previousSet.has(memberId));
    const datesChanged = previous.startDate !== updated.startDate || previous.endDate !== updated.endDate;

    await Promise.all([
      ...added.map((memberId) => createAssignmentBlock(updated, memberId, actingEmployeeId)),
      ...removed.map((memberId) => removeAssignmentBlock(id, memberId)),
      ...(datesChanged
        ? unchanged.map(async (memberId) => {
            await removeAssignmentBlock(id, memberId);
            await createAssignmentBlock(updated, memberId, actingEmployeeId);
          })
        : []),
    ]);

    return updated;
  }

  /** Throws if the project is still referenced by activities or POCs. */
  async delete(id: string): Promise<void> {
    const target = await this.getById(id);
    if (!target) throw new Error(`Project ${id} not found`);

    const [activities, pocs] = await Promise.all([activityService.getByProject(id), pocService.getAll()]);
    if (activities.length > 0 || pocs.some((poc) => poc.projectId === id)) {
      throw new Error("REFERENCED");
    }
    await Promise.all(target.members.map((memberId) => removeAssignmentBlock(id, memberId)));
    await apiRequest<void>(`/api/projects/${id}`, { method: "DELETE" });
    await employeeService.removeProjectEverywhere(target.name);
  }
}

export const projectService = new ProjectService();
