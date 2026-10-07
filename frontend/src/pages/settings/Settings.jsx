import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft, User, Palette, Lock, Shield, Mic, Eye, AlertTriangle,
} from "lucide-react";

import PersonalInformationSection from "./PersonalInformationSection.jsx";
import AppearanceSection from "./AppearanceSection.jsx";
import SecuritySection from "./SecuritySection.jsx";
import AccountSection from "./AccountSection.jsx";
import AudioVideoSection from "./AudioVideoSection.jsx";
import PrivacySection from "./PrivacySection.jsx";
import DangerZoneSection from "./DangerZoneSection.jsx";

const TABS = [
  { key: "personal", label: "Personal Information", icon: User, component: PersonalInformationSection },
  { key: "appearance", label: "Appearance", icon: Palette, component: AppearanceSection },
  { key: "security", label: "Security", icon: Lock, component: SecuritySection },
  { key: "account", label: "Account", icon: Shield, component: AccountSection },
  { key: "audio", label: "Audio & Video", icon: Mic, component: AudioVideoSection },
  { key: "privacy", label: "Privacy", icon: Eye, component: PrivacySection },
  { key: "danger", label: "Danger Zone", icon: AlertTriangle, component: DangerZoneSection },
];

export default function Settings() {
  const [activeTab, setActiveTab] = useState("personal");
  const ActiveComponent = TABS.find((t) => t.key === activeTab)?.component;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* ===== HEADER ===== */}
      <div className="flex items-start gap-4">
        <Link
          to="/dashboard"
          className="mt-1 flex h-9 w-9 items-center justify-center rounded-xl border border-line bg-card text-fg-2 transition hover:bg-surface"
          aria-label="Back"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-fg">Settings</h1>
          <p className="mt-1 text-sm text-fg-2">
            Manage your account settings and preferences
          </p>
        </div>
      </div>

      {/* ===== GRID ===== */}
      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-5">
        {/* ===== LEFT: TABS ===== */}
        <aside className="rounded-2xl border border-line bg-surface p-2 h-fit lg:sticky lg:top-20">
          <ul className="space-y-1">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.key;
              return (
                <li key={tab.key}>
                  <button
                    onClick={() => setActiveTab(tab.key)}
                    className={`w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition text-left ${
                      isActive
                        ? "bg-accent-500/15 text-accent-600 dark:text-accent-400 border border-accent-500/20"
                        : "text-fg-2 hover:bg-card hover:text-fg"
                    }`}
                  >
                    <Icon className={`h-4 w-4 shrink-0 ${isActive ? "text-accent-600 dark:text-accent-400" : ""}`} />
                    <span className="truncate">{tab.label}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </aside>

        {/* ===== RIGHT: CONTENT ===== */}
        <div className="rounded-2xl border border-line bg-surface p-5 sm:p-6">
          {ActiveComponent && <ActiveComponent />}
        </div>
      </div>
    </div>
  );
}