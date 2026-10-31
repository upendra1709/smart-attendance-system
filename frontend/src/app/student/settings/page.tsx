"use client";

import { useEffect, useState } from "react";
import {
  Bell,
  Rows3,
  Save,
  Settings,
} from "lucide-react";
import DashboardShell from "@/components/dashboard/DashboardShell";
import PageHeader from "@/components/dashboard/PageHeader";
import { InfoBox } from "@/components/dashboard/DataState";
import { STUDENT_NAV } from "@/lib/student-nav";

export default function StudentSettingsPage() {
  const [attendanceAlerts, setAttendanceAlerts] = useState(true);
  const [compactHistory, setCompactHistory] = useState(false);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    setAttendanceAlerts(
      localStorage.getItem("studentAttendanceAlerts") !== "false"
    );

    setCompactHistory(
      localStorage.getItem("studentCompactHistory") === "true"
    );
  }, []);

  function saveSettings() {
    localStorage.setItem(
      "studentAttendanceAlerts",
      String(attendanceAlerts)
    );

    localStorage.setItem(
      "studentCompactHistory",
      String(compactHistory)
    );

    setNotice("Preferences saved in this browser.");
  }

  const preferences = [
    {
      label: "Attendance alerts",
      description:
        "Show attendance threshold and recent-record notifications.",
      value: attendanceAlerts,
      setter: setAttendanceAlerts,
      icon: Bell,
    },
    {
      label: "Compact attendance history",
      description:
        "Save your preference for a denser attendance-history layout.",
      value: compactHistory,
      setter: setCompactHistory,
      icon: Rows3,
    },
  ];

  return (
    <DashboardShell
      navGroups={STUDENT_NAV}
      title="Settings"
      subtitle="Student dashboard preferences"
      accent="emerald"
    >
      <div className="p-4 lg:p-8 max-w-[800px] mx-auto space-y-6">
        <PageHeader
          title="Settings"
          subtitle="Local preferences stored in this browser"
        />

        <InfoBox message="These preferences are browser-local. They do not sync across devices and are cleared if you clear this browser's site data." />

        <InfoBox message={notice} />

        <div className="glass-card rounded-3xl p-6 space-y-5">
          <h3 className="font-display font-bold flex items-center gap-2">
            <Settings
              size={18}
              className="text-emerald-500"
            />
            Preferences
          </h3>

          {preferences.map((preference) => (
            <label
              key={preference.label}
              className="flex items-start justify-between gap-6 rounded-2xl border border-border p-4 cursor-pointer"
            >
              <span className="flex items-start gap-3">
                <preference.icon
                  size={18}
                  className="text-emerald-500 mt-0.5 shrink-0"
                />
                <span>
                  <span className="font-bold block">
                    {preference.label}
                  </span>
                  <span className="text-xs text-zinc-500 leading-relaxed block mt-1">
                    {preference.description}
                  </span>
                </span>
              </span>

              <input
                type="checkbox"
                checked={preference.value}
                onChange={(e) =>
                  preference.setter(e.target.checked)
                }
                className="accent-emerald-500 w-4 h-4 mt-1 shrink-0"
              />
            </label>
          ))}

          <button
            onClick={saveSettings}
            className="rounded-xl bg-emerald-500 px-5 py-3 text-sm font-bold text-white flex items-center gap-2 hover:bg-emerald-600 transition-colors"
          >
            <Save size={15} />
            Save Preferences
          </button>
        </div>
      </div>
    </DashboardShell>
  );
}