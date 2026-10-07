import { createContext, useContext, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { updateAppearance as updateAppearanceRequest } from "../services/user.service.js";
import { updateUser } from "../store/slices/authSlice.js";
import { unwrapApiData } from "../utils/apiData.js";

const AppearanceContext = createContext();

const ACCENTS = ["indigo", "violet", "pink", "red", "orange", "green", "blue"];

export function AppearanceProvider({ children }) {
  const dispatch = useDispatch();
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const userId = user?._id ?? user?.id;
  const [draft, setDraft] = useState(null);
  const profileAccent = ACCENTS.includes(user?.appearance?.accent)
    ? user.appearance.accent
    : "indigo";
  const profileFontSize = ["small", "medium", "large"].includes(
    user?.appearance?.fontSize,
  )
    ? user.appearance.fontSize
    : "medium";
  const hasDraft = Boolean(isAuthenticated && userId && draft?.userId === userId);
  const accent = hasDraft ? draft.accent : profileAccent;
  const fontSize = hasDraft ? draft.fontSize : profileFontSize;

  useEffect(() => {
    const root = document.documentElement;
    if (!isAuthenticated || !userId) {
      root.removeAttribute("data-accent");
      root.removeAttribute("data-font-size");
      return;
    }

    root.setAttribute("data-accent", accent);
    root.setAttribute("data-font-size", fontSize);
  }, [accent, fontSize, isAuthenticated, userId]);

  const setAccent = (nextAccent) => {
    if (!isAuthenticated || !userId || !ACCENTS.includes(nextAccent)) return;
    setDraft((current) => ({
      userId,
      accent: nextAccent,
      fontSize: current?.userId === userId ? current.fontSize : profileFontSize,
    }));
  };

  const setFontSize = (nextFontSize) => {
    if (!isAuthenticated || !userId || !["small", "medium", "large"].includes(nextFontSize)) return;
    setDraft((current) => ({
      userId,
      accent: current?.userId === userId ? current.accent : profileAccent,
      fontSize: nextFontSize,
    }));
  };

  const saveAppearance = async () => {
    if (!isAuthenticated || !userId) {
      throw new Error("Sign in to save appearance preferences");
    }

    const response = await updateAppearanceRequest({ accent, fontSize });
    const updated = unwrapApiData(response);
    if (updated) dispatch(updateUser(updated));
    setDraft((current) => (current?.userId === userId ? null : current));
  };

  return (
    <AppearanceContext.Provider
      value={{ accent, setAccent, fontSize, setFontSize, saveAppearance, accents: ACCENTS }}
    >
      {children}
    </AppearanceContext.Provider>
  );
}

// Context modules intentionally export their consumer hook alongside the provider.
// eslint-disable-next-line react-refresh/only-export-components
export function useAppearance() {
  const ctx = useContext(AppearanceContext);
  if (!ctx) throw new Error("useAppearance must be used inside AppearanceProvider");
  return ctx;
}

// eslint-disable-next-line react-refresh/only-export-components
export const ACCENT_OPTIONS = [
  { value: "indigo", label: "Indigo", color: "#6366f1" },
  { value: "violet", label: "Violet", color: "#8b5cf6" },
  { value: "pink", label: "Pink", color: "#ec4899" },
  { value: "red", label: "Red", color: "#ef4444" },
  { value: "orange", label: "Orange", color: "#f97316" },
  { value: "green", label: "Green", color: "#10b981" },
  { value: "blue", label: "Blue", color: "#3b82f6" },
];