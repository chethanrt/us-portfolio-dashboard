import type { Employee, POC, Project } from "@/types";

export type ProjectRole = "Team Member" | "Tech Lead" | "Engineering Manager" | "Project Manager";

export interface EmployeeProjectAssignment {
  project: Project;
  roles: ProjectRole[];
}

export type PocRole = "Owner" | "Team Member";

export interface EmployeePocAssignment {
  poc: POC;
  role: PocRole;
}

/**
 * Every project this employee is currently involved in and their role(s)
 * on it, computed live from Project records — never from a manually
 * maintained field. `manager`/`techLead`/`projectManager` are matched by
 * name (that's how Project itself stores them; see ProjectFormDialog),
 * `members` by id. A person can hold more than one role on the same
 * project (e.g. Tech Lead who is also listed as a team member).
 */
export function getEmployeeProjectAssignments(employee: Employee, projects: Project[]): EmployeeProjectAssignment[] {
  const assignments: EmployeeProjectAssignment[] = [];
  for (const project of projects) {
    const roles: ProjectRole[] = [];
    if (project.members.includes(employee.id)) roles.push("Team Member");
    if (project.techLead === employee.name) roles.push("Tech Lead");
    if (project.manager === employee.name) roles.push("Engineering Manager");
    if (project.projectManager === employee.name) roles.push("Project Manager");
    if (roles.length > 0) assignments.push({ project, roles });
  }
  return assignments;
}

/** Every POC this employee owns or is on the team for, computed live from POC records. */
export function getEmployeePocAssignments(employee: Employee, pocs: POC[]): EmployeePocAssignment[] {
  return pocs
    .filter((poc) => poc.ownerId === employee.id || poc.team.includes(employee.id))
    .map((poc) => ({ poc, role: (poc.ownerId === employee.id ? "Owner" : "Team Member") as PocRole }));
}
