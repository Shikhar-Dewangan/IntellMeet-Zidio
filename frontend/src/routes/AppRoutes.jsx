import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Navigate, Route, Routes } from "react-router-dom";
import MainLayout from "../components/layout/MainLayout.jsx";
import LandingPage from "../pages/LandingPage.jsx";
import GoogleCallback from "../pages/auth/GoogleCallback.jsx";
import Login from "../pages/auth/Login.jsx";
import Register from "../pages/auth/Register.jsx";
import { getCurrentUser } from "../services/user.service.js";
import {
  clearCredentials,
  setCredentials,
  setLoading,
} from "../store/slices/authSlice.js";
import ProtectedRoute from "./ProtectedRoute.jsx";
import PublicRoute from "./PublicRoute.jsx";
import Dashboard from "../pages/dashboard/Dashboard.jsx";
import Meetings from "../pages/meetings/Meetings.jsx";
import Projects from "../pages/projects/Projects.jsx";
import ProjectDetails from "../pages/projects/ProjectDetails.jsx";
import Tasks from "../pages/tasks/Tasks.jsx";
import Teams from "../pages/teams/Teams.jsx";
import TeamDetails from "../pages/teams/TeamDetails.jsx";
import CreateMeeting from "../pages/meetings/CreateMeeting.jsx";
import MeetingDetails from "../pages/meetings/MeetingDetails.jsx";
import MeetingRoom from "../pages/meetings/MeetingRoom.jsx";
import Recordings from "../pages/recordings/Recordings.jsx";
import RecordingDetails from "../pages/recordings/RecordingDetails.jsx";
import Analytics from "../pages/analytics/Analytics.jsx";
import Notifications from "../pages/notifications/Notifications.jsx";
import Profile from "../pages/profile/Profile.jsx";
import Settings from "../pages/settings/Settings.jsx";

function AppRoutes() {
  const dispatch = useDispatch();
  const { isAuthenticated, loading } = useSelector((state) => state.auth);

  useEffect(() => {
    let isMounted = true;

    getCurrentUser()
      .then((response) => {
        const user =
          response?.data?.data ??
          response?.data?.user ??
          response?.data ??
          null;
        if (isMounted && user) dispatch(setCredentials(user));
        else if (isMounted) dispatch(clearCredentials());
      })
      .catch(() => {
        if (isMounted) dispatch(clearCredentials());
      })
      .finally(() => {
        if (isMounted) dispatch(setLoading(false));
      });

    return () => {
      isMounted = false;
    };
  }, [dispatch]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--app-background)] text-[var(--app-muted)]">
        <div className="flex items-center gap-3 rounded-full border border-[var(--app-border)] bg-[var(--app-surface)] px-4 py-2 shadow-sm">
          <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-[var(--app-accent)]" />
          Loading workspace...
        </div>
      </div>
    );
  }

  return (
    <Routes>
      <Route
        path="/"
        element={
          isAuthenticated ? (
            <Navigate to="/dashboard" replace />
          ) : (
            <LandingPage />
          )
        }
      />

      <Route element={<PublicRoute />}>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/auth/google/callback" element={<GoogleCallback />} />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route element={<MainLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/meetings" element={<Meetings />} />
          <Route path="/meetings/create" element={<CreateMeeting />} />
          <Route path="/meetings/:meetingId" element={<MeetingDetails />} />
          <Route path="/meetings/:meetingId/room" element={<MeetingRoom />} />
          <Route path="/recordings" element={<Recordings />} />
          <Route
            path="/recordings/:recordingId"
            element={<RecordingDetails />}
          />
          <Route path="/teams" element={<Teams />} />
          <Route path="/teams/:teamId" element={<TeamDetails />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/projects/:projectId/*" element={<ProjectDetails />} />
          <Route path="/tasks" element={<Tasks />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
      </Route>

      <Route
        path="*"
        element={<Navigate to={isAuthenticated ? "/dashboard" : "/"} replace />}
      />
    </Routes>
  );
}

export default AppRoutes;
