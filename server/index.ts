import express from "express";
import cors from "cors";
import { getDb } from "./db/client.ts";
import { createEmployeesRouter } from "./routes/employees.ts";
import { createProjectsRouter } from "./routes/projects.ts";
import { createActivitiesRouter } from "./routes/activities.ts";
import { createSkillsRouter } from "./routes/skills.ts";
import { createLearningRouter } from "./routes/learning.ts";
import { createPocsRouter } from "./routes/pocs.ts";
import { createCalendarEventsRouter } from "./routes/calendarEvents.ts";
import { createTasksRouter } from "./routes/tasks.ts";
import { createTaskCategoriesRouter } from "./routes/taskCategories.ts";
import { createTaskWorkflowRouter } from "./routes/taskWorkflow.ts";
import { createUsersRouter } from "./routes/users.ts";
import { createRolesRouter } from "./routes/roles.ts";
import { createPermissionsRouter } from "./routes/permissions.ts";
import { createResourcesRouter } from "./routes/resources.ts";
import { createSettingsRouter } from "./routes/settings.ts";

const PORT = 4000;

const db = getDb();
const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/employees", createEmployeesRouter(db));
app.use("/api/projects", createProjectsRouter(db));
app.use("/api/activities", createActivitiesRouter(db));
app.use("/api/skills", createSkillsRouter(db));
app.use("/api/learning", createLearningRouter(db));
app.use("/api/pocs", createPocsRouter(db));
app.use("/api/calendar-events", createCalendarEventsRouter(db));
app.use("/api/tasks", createTasksRouter(db));
app.use("/api/task-categories", createTaskCategoriesRouter(db));
app.use("/api/task-workflow", createTaskWorkflowRouter(db));
app.use("/api/users", createUsersRouter(db));
app.use("/api/roles", createRolesRouter(db));
app.use("/api/permissions", createPermissionsRouter(db));
app.use("/api/resources", createResourcesRouter(db));
app.use("/api/settings", createSettingsRouter(db));

app.listen(PORT, () => {
  console.log(`API server listening on http://localhost:${PORT}`);
});
