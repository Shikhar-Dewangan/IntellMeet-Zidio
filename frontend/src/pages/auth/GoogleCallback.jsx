import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function GoogleCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    navigate("/dashboard", { replace: true });
  }, [navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-700  ">
      <div className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium shadow-sm  ">
        Redirecting to your workspace...
      </div>
    </div>
  );
}
