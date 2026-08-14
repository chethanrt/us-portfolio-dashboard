/**
 * Magento-inspired Role & Permission framework types.
 *
 * The chain is:
 *   User → Role → Permissions → Modules → Actions → Field Permissions
 *
 * Data lives in src/data/roles.json, resources.json and permissions.json.
 * Evaluation happens in src/security/PermissionService.
 */

// ---------------------------------------------------------------------------
// Modules (resources) and actions
// ---------------------------------------------------------------------------

/** Application modules that can be protected. */
export type ModuleId =
  | "dashboard"
  | "projects"
  | "tasks"
  | "activities"
  | "people"
  | "skills"
  | "learning"
  | "pocs"
  | "reports"
  | "settings"
  | "users"
  | "roles"
  | "auditLog";

/** Actions a role can be granted on a module. */
export type PermissionAction =
  | "view"
  | "create"
  | "edit"
  | "delete"
  | "export"
  /** Assign work to other people (Task Board). */
  | "assign"
  /** Participate in discussion threads (Task Board). */
  | "comment";

/**
 * Row-level data scope.
 * - all:  every record in the portfolio
 * - team: records belonging to the user's team / led projects
 * - own:  only records belonging to the logged-in user
 */
export type DataScope = "all" | "team" | "own";

/** A field a module exposes (used by field-level security and the Roles UI). */
export interface ResourceField {
  key: string;
  label: string;
}

/** resources.json — the registry of protectable modules. */
export interface Resource {
  id: ModuleId;
  label: string;
  path: string;
  description: string;
  /** Actions this module supports (drives the Roles permission editor). */
  actions: PermissionAction[];
  /** Fields available for field-level security. */
  fields: ResourceField[];
  /** Whether the module holds per-employee records that can be scoped. */
  scopable: boolean;
}

// ---------------------------------------------------------------------------
// Permissions
// ---------------------------------------------------------------------------

/** Action grants for one module. Missing actions default to false. */
export type ActionPermission = Partial<Record<PermissionAction, boolean>>;

/** Field-level security for a single field. */
export interface FieldPermission {
  visible: boolean;
  editable: boolean;
}

/** Permissions a role holds on one module. */
export interface ModulePermission {
  module: ModuleId;
  actions: ActionPermission;
  /** Row-level scopes; missing values default to "all". */
  scope?: {
    view?: DataScope;
    edit?: DataScope;
  };
  /** Field rules; fields not listed default to visible + editable. */
  fields?: Record<string, FieldPermission>;
}

/** permissions.json — one entry per role. */
export interface Permission {
  roleId: string;
  modules: ModulePermission[];
}

/**
 * user_permission_overrides — per-user action grants/revocations layered on
 * top of the role's defaults (see src/security/PermissionService's
 * mergeModulePermissions). Only actions are meaningful here; scope and field
 * rules always come from the role. An action key absent from `modules`
 * means "inherit the role default" — present keys always win.
 */
export interface UserPermissionOverride {
  userId: string;
  modules: ModulePermission[];
}

// ---------------------------------------------------------------------------
// Roles
// ---------------------------------------------------------------------------

/** roles.json — an assignable application role. */
export interface Role {
  id: string;
  name: string;
  description: string;
  /** System roles ship with the app and cannot be deleted or renamed. */
  isSystem: boolean;
}
