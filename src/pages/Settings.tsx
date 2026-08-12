import { Settings as SettingsIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmptyState, LoadingSkeleton, PageHeader } from "@/components/common";
import { SettingsSection } from "@/components/settings/SettingsSection";
import { useSettings } from "@/hooks/useSettings";
import { usePermission } from "@/security";
import type { EditableSettingsKey } from "@/services/SettingsService";

const SECTIONS: { key: EditableSettingsKey; label: string; description: string }[] = [
  { key: "roles", label: "Roles", description: "Organization roles used across the application." },
  { key: "technicalSkills", label: "Technical Skills", description: "Skills tracked in the skill matrix." },
  { key: "aiSkills", label: "AI Skills", description: "AI tools and skills tracked in the skill matrix." },
  { key: "aiTools", label: "AI Tools", description: "Tools that can be selected when logging activities." },
  { key: "projectStages", label: "Project Stages", description: "Stages a project can be in." },
  { key: "activityTypes", label: "AI Activity Categories", description: "Categories for AI activities." },
  { key: "pocCategories", label: "POC Categories", description: "Categories for POCs and innovations." },
  { key: "learningPlatforms", label: "Learning Platforms", description: "Platforms for learning records." },
  { key: "eventTypes", label: "Calendar Event Types", description: "Event types available on the team calendar." },
];

export default function Settings() {
  const { role, canEdit } = usePermission();
  const { settings, isLoading, error, updateList } = useSettings();
  // Route access is enforced by RequirePermission; here we only gate editing.
  const readOnly = !canEdit("settings");

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Settings" description="Manage application master data" />
        <LoadingSkeleton variant="table" count={6} />
      </div>
    );
  }

  if (error || !settings) {
    return (
      <div className="space-y-6">
        <PageHeader title="Settings" />
        <EmptyState icon={SettingsIcon} title="Unable to load settings" description={error ?? "Please try again."} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        description="Manage roles, skills, AI tools, stages and platforms"
        actions={
          readOnly ? (
            <Badge variant="secondary" title="Your role does not have Edit permission for Settings">
              Read-only ({role?.name ?? "No role"})
            </Badge>
          ) : undefined
        }
      />

      <Tabs defaultValue={SECTIONS[0].key}>
        <TabsList className="h-auto w-full flex-wrap">
          {SECTIONS.map((section) => (
            <TabsTrigger key={section.key} value={section.key}>
              {section.label}
            </TabsTrigger>
          ))}
        </TabsList>
        {SECTIONS.map((section) => (
          <TabsContent key={section.key} value={section.key} className="mt-4">
            <SettingsSection
              label={section.label}
              description={section.description}
              values={settings[section.key] as string[]}
              readOnly={readOnly}
              onChange={(values) => updateList(section.key, values)}
            />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
