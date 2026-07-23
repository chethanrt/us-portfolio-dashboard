import type { SkillRecord } from "@/types";

export type SkillKey = keyof Omit<SkillRecord, "employeeId">;

/** All tracked skills in display order (docs/06): 8 technical + 5 AI. */
export const SKILL_COLUMNS: { key: SkillKey; label: string }[] = [
  { key: "Magento", label: "Magento" },
  { key: "PHP", label: "PHP" },
  { key: "React", label: "React" },
  { key: "JavaScript", label: "JavaScript" },
  { key: "GraphQL", label: "GraphQL" },
  { key: "MySQL", label: "MySQL" },
  { key: "Docker", label: "Docker" },
  { key: "Git", label: "Git" },
  { key: "Claude", label: "Claude" },
  { key: "ChatGPT", label: "ChatGPT" },
  { key: "GitHubCopilot", label: "GitHub Copilot" },
  { key: "Cursor", label: "Cursor" },
  { key: "PromptEngineering", label: "Prompt Engineering" },
];
