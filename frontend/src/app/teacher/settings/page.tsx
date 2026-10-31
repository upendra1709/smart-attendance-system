"use client";

import { useEffect, useState } from "react";
import {
  Save,
  Settings,
} from "lucide-react";

import DashboardShell from "@/components/dashboard/DashboardShell";
import PageHeader from "@/components/dashboard/PageHeader";
import { InfoBox } from "@/components/dashboard/DataState";
import { TEACHER_NAV } from "@/lib/teacher-nav";

export default function TeacherSettingsPage() {
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [compactTables, setCompactTables] = useState(false);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    setAutoRefresh(
      localStorage.getItem("autoRefresh") !== "false"
    );

    setCompactTables(
      localStorage.getItem("compactTables") === "true"
    );
  }, []);

  function saveSettings() {
    localStorage.setItem(
      "autoRefresh",
      String(autoRefresh)
    );

    localStorage.setItem(
      "compactTables",
      String(compactTables)
    );

    setNotice("Preferences saved locally.");
  }

  const preferences = [
    {
      label: "Auto-refresh live sessions",
      description:
        "Updates the roster every five seconds while a live page is open.",
      value: autoRefresh,
      setter: setAutoRefresh,
    },
    {
      label: "Compact tables",
      description:
        "Reserved for future dense table layouts.",
      value: compactTables,
      setter: setCompactTables,
    },
  ];

  return (
    <DashboardShell
      navGroups={TEACHER_NAV}
      title="Settings"
      subtitle="Dashboard preferences"
      accent="violet"
    >
      <div className="p-4 lg:p-8 max-w-[800px] mx-auto space-y-6">
        <PageHeader
          title="Settings"
          subtitle="Local preferences stored in this browser"
        />

        <InfoBox message={notice} />

        <div className="glass-card rounded-3xl p-6 space-y-5">
          <h3 className="font-display font-bold flex items-center gap-2">
            <Settings size={18} className="text-violet-400" />
            Preferences
          </h3>

          {preferences.map((preference) => (
            <label
              key={preference.label}
              className="flex items-start justify-between gap-6 rounded-2xl border border-border p-4"
            >
              <span>
                <span className="font-bold block">
                  {preference.label}
                </span>

                <span className="text-xs text-zinc-500">
                  {preference.description}
                </span>
              </span>

              <input
                type="checkbox"
                checked={preference.value}
                onChange={(e) =>
                  preference.setter(e.target.checked)
                }
                className="accent-violet-500 w-4 h-4 mt-1"
              />
            </label>
          ))}

          <button
            onClick={saveSettings}
            className="rounded-xl bg-violet-500 px-5 py-3 text-sm font-bold text-white flex items-center gap-2"
          >
            <Save size={15} />
            Save Preferences
          </button>
        </div>
      </div>
    </DashboardShell>
  );
}