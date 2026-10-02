import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import { logoutUser } from "../../services/auth.service.js";
import { clearCredentials } from "../../store/slices/authSlice.js";

const LogoutButton = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const handleLogout = async () => {
    try {
      await logoutUser();
      toast.success("Logout successful");
    } catch (error) {
      toast.error(error.response?.data?.message || "Logout failed");
    } finally {
      dispatch(clearCredentials());
      navigate("/login", { replace: true });
    }
  };

  return (
    <button
      type="button"
      onClick={handleLogout}
      className="flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 hover:text-slate-900   "
    >
      <span>Log out</span>
    </button>
  );
};

export default LogoutButton;
