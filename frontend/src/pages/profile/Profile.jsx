import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";
import { Camera, Save } from "lucide-react";
import {
  getCurrentUser,
  updateAvatar,
  updateProfile,
} from "../../services/user.service.js";
import { updateUser } from "../../store/slices/authSlice.js";
import { getApiError, unwrapApiData } from "../../utils/apiData.js";
import {
  LoadingState,
  PageHeader,
  SectionCard,
} from "../../components/ui/Shared.jsx";

export default function Profile() {
  const dispatch = useDispatch();
  const authUser = useSelector((state) => state.auth.user);
  const [user, setUser] = useState(authUser);
  const [loading, setLoading] = useState(!authUser);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getCurrentUser()
      .then((response) => {
        const next = unwrapApiData(response);
        setUser(next);
        dispatch(updateUser(next));
      })
      .catch((error) =>
        toast.error(getApiError(error, "Could not load profile")),
      )
      .finally(() => setLoading(false));
  }, [dispatch]);

  const updateField = (field, value) =>
    setUser((current) => ({ ...current, [field]: value }));

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);

    try {
      const response = await updateProfile({ fullName: user.fullName });
      const next = unwrapApiData(response);
      setUser(next);
      dispatch(updateUser(next));
      toast.success("Profile updated");
    } catch (error) {
      toast.error(getApiError(error, "Could not update profile"));
    } finally {
      setSaving(false);
    }
  };

  const avatar = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const response = await updateAvatar(file);
      const next = unwrapApiData(response);
      setUser(next);
      dispatch(updateUser(next));
      toast.success("Avatar updated");
    } catch (error) {
      toast.error(getApiError(error, "Could not update avatar"));
    }
  };

  if (loading) return <LoadingState text="Loading profile..." />;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Profile"
        subtitle="Manage your personal information."
      />

      <div className="grid gap-5 lg:grid-cols-3">
        <SectionCard className="lg:col-span-1">
          <div className="flex flex-col items-center p-6 text-center">
            <div className="relative">
              <div className="grid h-24 w-24 place-items-center rounded-full bg-linear-to-br from-blue-500 to-violet-600 text-3xl font-bold text-white">
                {user?.fullName?.[0] || "U"}
              </div>
              <label className="absolute -bottom-1 -right-1 grid h-9 w-9 cursor-pointer place-items-center rounded-full border border-slate-200 bg-white shadow-sm transition hover:bg-slate-50   ">
                <Camera className="h-4 w-4 text-slate-600 " />
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={avatar}
                />
              </label>
            </div>

            <h3 className="mt-4 text-lg font-semibold text-slate-900 ">
              {user?.fullName || "User"}
            </h3>
            <p className="text-sm text-slate-500 ">{user?.role || "Member"}</p>
          </div>
        </SectionCard>

        <SectionCard title="Personal information" className="lg:col-span-2">
          <form onSubmit={submit} className="space-y-5 p-5">
            <label className="block text-sm font-medium text-slate-700 ">
              Full name
              <input
                value={user?.fullName || ""}
                onChange={(event) =>
                  updateField("fullName", event.target.value)
                }
                className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20   "
              />
            </label>

            <label className="block text-sm font-medium text-slate-700 ">
              Email
              <input
                value={user?.email || ""}
                disabled
                className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-100 px-4 py-2.5 text-sm text-slate-500   "
              />
            </label>

            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
            >
              <Save className="h-4 w-4" />
              {saving ? "Saving..." : "Save changes"}
            </button>
          </form>
        </SectionCard>
      </div>
    </div>
  );
}
