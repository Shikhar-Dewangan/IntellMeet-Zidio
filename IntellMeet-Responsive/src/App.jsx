import { Routes, Route, Navigate } from "react-router-dom";
import Landing from "./pages/Landing";
import Login from "./pages/Auth/Login";
import SignUp from "./pages/Auth/SignUp";
import Dashboard from "./pages/Dashboard";
import Meetings from "./pages/Meetings/Meetings";
import MeetingRoom from "./pages/Meetings/MeetingRoom";
import Teams from "./pages/Teams/Teams";
import Projects from "./pages/Projects/Projects";
import Analytics from "./pages/Analytics";
import Settings from "./pages/Settings/Settings";
import NotFound from "./pages/NotFound";
import AppLayout from "./components/common/AppLayout";
import PrivateRoute from "./components/Auth/PrivateRoute";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<SignUp />} />

      <Route element={<PrivateRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/meetings" element={<Meetings />} />
          <Route path="/meetings/:meetingId" element={<MeetingRoom />} />
          <Route path="/teams" element={<Teams />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
      </Route>

      <Route path="/404" element={<NotFound />} />
      <Route path="*" element={<Navigate to="/404" replace />} />
    </Routes>
  );
}