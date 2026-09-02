import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import { getDb } from "./db/client.ts";
import { createEmployeesRouter } from "./routes/employees.ts";
import { createProjectsRouter } from "./routes/projects.ts";
import { createActivitiesRouter } from "./routes/activities.ts";
import { createLearningRouter } from "./routes/learning.ts";
import { createPocsRouter } from "./routes/pocs.ts";
import { createCalendarEventsRouter } from "./routes/calendarEvents.ts";
import { createTasksRouter } from "./routes/tasks.ts";
import { createTaskCategoriesRouter } from "./routes/taskCategories.ts";
import { createTaskWorkflowRouter } from "./routes/taskWorkflow.ts";
import { createUsersRouter } from "./routes/users.ts";
import { createRolesRouter } from "./routes/roles.ts";
import { createPermissionsRouter } from "./routes/permissions.ts";
import { createPermissionOverridesRouter } from "./routes/permissionOverrides.ts";
import { createResourcesRouter } from "./routes/resources.ts";
import { createSettingsRouter } from "./routes/settings.ts";
import { createAuditLogRouter } from "./routes/auditLog.ts";
import { requireAuth } from "./security/requireAuth.ts";

const PORT = Number(process.env.PORT) || 4000;

const db = getDb();
const app = express();

// origin: true reflects whatever Origin the request actually came from
// (needed for credentialed/cookie requests — a wildcard "*" origin doesn't
// work once credentials are involved) — fine for a same-network dev/VM
// setup; tighten to an explicit allow-list if this ever faces a wider network.
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(cookieParser());

// /api/users owns its own auth boundary internally (POST /authenticate has
// to be reachable *without* a session — see server/routes/users.ts) —
// every other router requires a valid session for all of its routes.
app.use("/api/users", createUsersRouter(db));

app.use("/api/employees", requireAuth(db), createEmployeesRouter(db));
app.use("/api/projects", requireAuth(db), createProjectsRouter(db));
app.use("/api/activities", requireAuth(db), createActivitiesRouter(db));
app.use("/api/learning", requireAuth(db), createLearningRouter(db));
app.use("/api/pocs", requireAuth(db), createPocsRouter(db));
app.use("/api/calendar-events", requireAuth(db), createCalendarEventsRouter(db));
app.use("/api/tasks", requireAuth(db), createTasksRouter(db));
app.use("/api/task-categories", requireAuth(db), createTaskCategoriesRouter(db));
app.use("/api/task-workflow", requireAuth(db), createTaskWorkflowRouter(db));
app.use("/api/roles", requireAuth(db), createRolesRouter(db));
app.use("/api/permissions", requireAuth(db), createPermissionsRouter(db));
app.use("/api/permission-overrides", requireAuth(db), createPermissionOverridesRouter(db));
app.use("/api/resources", requireAuth(db), createResourcesRouter(db));
app.use("/api/settings", requireAuth(db), createSettingsRouter(db));
app.use("/api/audit-log", requireAuth(db), createAuditLogRouter(db));

// Catch-all so any unhandled route error returns a real message instead of a
// bare 500 with no body (Express's default) — apiRequest on the frontend
// reads this `error` field and surfaces it in the thrown Error.
app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: err instanceof Error ? err.message : "Internal server error" });
});

app.listen(PORT, () => {
  console.log(`API server listening on http://localhost:${PORT}`);
});
