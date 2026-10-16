import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";
import {
  Camera, Mail, Phone, MapPin, Shield, Save, X, Pencil,
  Calendar, User as UserIcon, Loader2,
} from "lucide-react";

import {
  getCurrentUser,
  updateProfile,
  updateAvatar,
  updatePhone,
  updateLocation,
} from "../../services/user.service.js";
import { getApiError, unwrapApiData } from "../../utils/apiData.js";
import { updateUser } from "../../store/slices/authSlice.js";

export default function PersonalInformationSection() {
  const dispatch = useDispatch();
  const currentUser = useSelector((s) => s.auth.user);

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editingField, setEditingField] = useState(null);
  const [draftValue, setDraftValue] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = useRef(null);

  /* ============ FETCH ============ */
  const loadProfile = async () => {
    try {
      const response = await getCurrentUser();
      const userData = unwrapApiData(response);
      setProfile(userData);
      if (userData) dispatch(updateUser(userData));
    } catch (error) {
      toast.error(getApiError(error, "Could not load profile"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ============ EDIT ============ */
  const startEdit = (field, currentValue) => {
    setEditingField(field);
    setDraftValue(currentValue || "");
  };

  const cancelEdit = () => {
    setEditingField(null);
    setDraftValue("");
  };

  const saveEdit = async () => {
    if (!editingField) return;
    setSaving(true);
    try {
      let response;
      if (editingField === "fullName") {
        if (!draftValue.trim()) {
          toast.error("Name cannot be empty");
          return;
        }
        response = await updateProfile({ fullName: draftValue.trim() });
      } else if (editingField === "phone") {
        response = await updatePhone(draftValue.trim());
      } else if (editingField === "location") {
        response = await updateLocation(draftValue.trim());
      }

      const updated = unwrapApiData(response);
      setProfile(updated);
      dispatch(updateUser(updated));
      toast.success("Updated successfully");
      cancelEdit();
    } catch (error) {
      toast.error(getApiError(error, "Could not update"));
    } finally {
      setSaving(false);
    }
  };

  /* ============ AVATAR ============ */
  const handleAvatarClick = () => fileInputRef.current?.click();

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5MB");
      return;
    }

    if (!/^image\/(jpeg|png|webp|gif)$/.test(file.type)) {
      toast.error("Only JPEG, PNG, WebP, GIF allowed");
      return;
    }

    setUploadingAvatar(true);
    try {
      const response = await updateAvatar(file);
      const updated = unwrapApiData(response);
      setProfile(updated);
      dispatch(updateUser(updated));
      toast.success("Avatar updated");
    } catch (error) {
      toast.error(getApiError(error, "Could not upload avatar"));
    } finally {
      setUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  /* ============ HELPERS ============ */
  const getInitial = () => {
    const name = profile?.fullName || profile?.email || "U";
    return name[0]?.toUpperCase() || "U";
  };

  const formatDate = (iso) => {
    if (!iso) return "—";
    return new Date(iso).toLocaleDateString([], {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  /* ============ LOADING ============ */
  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 text-accent-600 animate-spin" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="rounded-2xl border border-line bg-card p-12 text-center">
        <UserIcon className="mx-auto h-12 w-12 text-fg-3" />
        <p className="mt-4 text-sm text-fg-2">Could not load profile</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* ============ HEADER CARD ============ */}
      <div className="relative overflow-hidden rounded-2xl border border-line bg-linear-to-br from-card via-card to-page">
        <div className="absolute -top-16 -right-16 h-64 w-64 rounded-full bg-accent-purple/15 blur-[80px] pointer-events-none" />

        <div className="relative p-5 sm:p-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
            {/* Avatar */}
            <div className="relative shrink-0">
              {profile.avatar ? (
                <img
                  src={profile.avatar}
                  alt={profile.fullName}
                  className="h-24 w-24 sm:h-28 sm:w-28 rounded-full object-cover ring-4 ring-card shadow-xl"
                />
              ) : (
                <div className="flex h-24 w-24 sm:h-28 sm:w-28 items-center justify-center rounded-full bg-linear-to-br from-accent-600 to-accent-700 text-white text-3xl font-bold ring-4 ring-card shadow-xl">
                  {getInitial()}
                </div>
              )}

              <button
                onClick={handleAvatarClick}
                disabled={uploadingAvatar}
                className="absolute bottom-0 right-0 flex h-9 w-9 items-center justify-center rounded-full bg-accent-600 text-white shadow-lg ring-4 ring-card transition hover:bg-accent-700 disabled:opacity-60"
                title="Change avatar"
              >
                {uploadingAvatar ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Camera className="h-4 w-4" />
                )}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={handleAvatarChange}
                className="hidden"
              />
            </div>

            {/* Name + badges */}
            <div className="flex-1 text-center sm:text-left min-w-0">
              <h2 className="text-2xl sm:text-3xl font-bold text-fg truncate">
                {profile.fullName || "Unnamed User"}
              </h2>
              <p className="mt-1 text-sm text-fg-2 truncate">{profile.email}</p>

              <div className="mt-3 flex flex-wrap items-center gap-2 justify-center sm:justify-start">
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${
                    profile.role === "admin"
                      ? "bg-accent-violet/15 text-accent-violet border border-accent-violet/20"
                      : "bg-accent-500/15 text-accent-600 dark:text-accent-400 border border-accent-500/20"
                  }`}
                >
                  <Shield className="h-3 w-3" />
                  {profile.role || "Member"}
                </span>

                {profile.authProvider === "google" && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-surface px-2.5 py-1 text-[11px] font-medium text-fg-2 border border-line">
                    <span className="h-1.5 w-1.5 rounded-full bg-accent-emerald" />
                    Google Account
                  </span>
                )}

                {profile.createdAt && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-surface px-2.5 py-1 text-[11px] font-medium text-fg-2 border border-line">
                    <Calendar className="h-3 w-3" />
                    Joined {formatDate(profile.createdAt)}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ============ INFO CARD ============ */}
      <div className="rounded-2xl border border-line bg-card overflow-hidden">
        <div className="flex items-center gap-2 border-b border-line px-5 py-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-500/15">
            <UserIcon className="h-4 w-4 text-accent-600 dark:text-accent-400" />
          </div>
          <h3 className="text-base font-semibold text-fg">Personal Details</h3>
        </div>

        <div className="divide-y divide-line">
          <InfoRow
            icon={UserIcon}
            label="Full Name"
            value={profile.fullName || "Not set"}
            editable
            editing={editingField === "fullName"}
            draftValue={draftValue}
            onDraftChange={setDraftValue}
            onEdit={() => startEdit("fullName", profile.fullName)}
            onSave={saveEdit}
            onCancel={cancelEdit}
            saving={saving}
            placeholder="Enter your full name"
          />

          <InfoRow
            icon={Mail}
            label="Email Address"
            value={profile.email}
            editable={false}
            hint="Email cannot be changed"
          />

          <InfoRow
            icon={Phone}
            label="Phone"
            value={profile.phone || "Not set"}
            editable
            editing={editingField === "phone"}
            draftValue={draftValue}
            onDraftChange={setDraftValue}
            onEdit={() => startEdit("phone", profile.phone)}
            onSave={saveEdit}
            onCancel={cancelEdit}
            saving={saving}
            placeholder="+91 9876543210"
          />

          <InfoRow
            icon={MapPin}
            label="Location"
            value={profile.location || "Not set"}
            editable
            editing={editingField === "location"}
            draftValue={draftValue}
            onDraftChange={setDraftValue}
            onEdit={() => startEdit("location", profile.location)}
            onSave={saveEdit}
            onCancel={cancelEdit}
            saving={saving}
            placeholder="City, Country"
          />
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   INFO ROW COMPONENT
   ============================================================ */
function InfoRow({
  icon: Icon,
  label,
  value,
  editable,
  editing,
  draftValue,
  onDraftChange,
  onEdit,
  onSave,
  onCancel,
  saving,
  placeholder,
  hint,
}) {
  return (
    <div className="flex items-center gap-3 px-5 py-4">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-surface border border-line">
        <Icon className="h-4 w-4 text-fg-2" />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-fg-3">
          {label}
        </p>

        {editing ? (
          <div className="mt-1.5 flex items-center gap-2">
            <input
              type="text"
              value={draftValue}
              onChange={(e) => onDraftChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") onSave();
                if (e.key === "Escape") onCancel();
              }}
              placeholder={placeholder}
              autoFocus
              className="flex-1 min-w-0 rounded-lg border border-line bg-surface px-3 py-1.5 text-sm text-fg placeholder:text-fg-3 focus:border-accent-500 focus:outline-none focus:ring-2 focus:ring-accent-500/20"
            />
            <button
              onClick={onSave}
              disabled={saving}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent-600 text-white transition hover:bg-accent-700 disabled:opacity-60"
              title="Save"
            >
              {saving ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Save className="h-3.5 w-3.5" />
              )}
            </button>
            <button
              onClick={onCancel}
              disabled={saving}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-line bg-card text-fg-2 transition hover:bg-surface disabled:opacity-60"
              title="Cancel"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : (
          <p className="mt-0.5 text-sm font-medium text-fg truncate">
            {value}
          </p>
        )}

        {hint && !editing && (
          <p className="mt-0.5 text-[11px] text-fg-3">{hint}</p>
        )}
      </div>

      {editable && !editing && (
        <button
          onClick={onEdit}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-line bg-card text-fg-2 transition hover:bg-surface"
          title="Edit"
        >
          <Pencil className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}