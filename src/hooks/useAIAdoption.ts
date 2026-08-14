import { useMemo } from "react";
import { useProjects } from "@/hooks/useProjects";
import { useSettings } from "@/hooks/useSettings";
import type { Project } from "@/types";

export interface CategoryBreakdown {
  category: string;
  projectCount: number;
  /** Rounded 0–100. */
  percentOfProjects: number;
  projects: Project[];
  /** Employee names on any project using this category (deduped). */
  people: string[];
}

/** Loads projects + the AI Adoption Categories settings list and aggregates category usage. */
export function useAIAdoption(projectScope?: (projects: Project[]) => Project[]) {
  const { projects: allProjects, employees, isLoading: projectsLoading, error: projectsError } = useProjects();
  const { settings, isLoading: settingsLoading, error: settingsError } = useSettings();

  const projects = useMemo(
    () => (projectScope ? projectScope(allProjects) : allProjects),
    [allProjects, projectScope]
  );

  const employeeNameById = useMemo(() => new Map(employees.map((e) => [e.id, e.name])), [employees]);

  const categories = settings?.aiAdoptionCategories ?? [];

  const breakdown = useMemo<CategoryBreakdown[]>(() => {
    const totalProjects = projects.length || 1;
    return categories
      .map((category) => {
        const matching = projects.filter((p) => p.aiAdoptionCategories.includes(category));
        const people = [
          ...new Set(matching.flatMap((p) => p.members.map((id) => employeeNameById.get(id)).filter(Boolean) as string[])),
        ];
        return {
          category,
          projectCount: matching.length,
          percentOfProjects: Math.round((matching.length / totalProjects) * 100),
          projects: matching,
          people,
        };
      })
      .sort((a, b) => b.projectCount - a.projectCount);
  }, [categories, projects, employeeNameById]);

  const projectsUsingAI = projects.filter((p) => p.aiAdoptionCategories.length > 0).length;

  return {
    breakdown,
    totalProjects: projects.length,
    projectsUsingAI,
    categoriesTracked: categories.length,
    topCategory: breakdown[0]?.category ?? "—",
    isLoading: projectsLoading || settingsLoading,
    error: projectsError ?? settingsError,
  };
}
