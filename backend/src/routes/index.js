import authRoutes from "./auth.routes.js";
import userRoutes from "./user.routes.js";
import meetingRoutes from "./meeting.routes.js";
import teamRoutes from "./team.routes.js";
import projectRoutes from "./project.routes.js";
import taskRoutes from "./task.routes.js";
import meetingNoteRoutes from "./meetingNote.routes.js";
import actionItemRoutes from "./actionItem.routes.js";
import notificationRoutes from "./notification.routes.js";

const registerRoutes = (app) => {
    app.use("/api/v1/auth", authRoutes);
    app.use("/api/v1/users", userRoutes);
    app.use("/api/v1/meetings", meetingRoutes);
    app.use("/api/v1/teams", teamRoutes);
    app.use("/api/v1/projects", projectRoutes);
    app.use("/api/v1/tasks", taskRoutes);
    app.use("/api/v1/meeting-notes", meetingNoteRoutes);
    app.use("/api/v1/action-items", actionItemRoutes);
    app.use("/api/v1/notifications", notificationRoutes);
};

export default registerRoutes;