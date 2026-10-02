import { Navigate, Outlet } from "react-router-dom";
import { useSelector } from "react-redux";
import LoadingSpinner from "../components/common/LoadingSpinner.jsx";

const ProtectedRoute = () => {
  const { isAuthenticated, loading } = useSelector((state) => state.auth);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <LoadingSpinner size="lg" color="blue" text="Loading workspace..." />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
