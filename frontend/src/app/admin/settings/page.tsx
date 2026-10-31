// 36. src/app/admin/settings/page.tsx
"use client";

import { useEffect, useState } from "react";
import { Bell, Rows3, Save, Settings } from "lucide-react";
import DashboardShell from "@/components/dashboard/DashboardShell";
import PageHeader from "@/components/dashboard/PageHeader";
import { InfoBox } from "@/components/dashboard/DataState";
import { ADMIN_NAV } from "@/lib/admin-nav";

export default function AdminSettingsPage() {
  const [defaulterAlerts, setDefaulterAlerts] = useState(true);
  const [compactTables, setCompactTables] = useState(false);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    setDefaulterAlerts(localStorage.getItem("adminDefaulterAlerts") !== "false");
    setCompactTables(localStorage.getItem("adminCompactTables") === "true");
  }, []);

  function saveSettings() {
    localStorage.setItem("adminDefaulterAlerts", String(defaulterAlerts));
    localStorage.setItem("adminCompactTables", String(compactTables));
    setNotice("Preferences saved in this browser.");
  }

  const preferences = [
    { label: "Defaulter alerts", description: "Show students below the 75% threshold on the Alerts page.", value: defaulterAlerts, setter: setDefaulterAlerts, icon: Bell },
    { label: "Compact tables", description: "Save your preference for denser user and attendance lists.", value: compactTables, setter: setCompactTables, icon: Rows3 },
  ];

  return (
    <DashboardShell navGroups={ADMIN_NAV} title="Settings" subtitle="Admin dashboard preferences" accent="emerald">
      <div className="p-4 lg:p-8 max-w-[800px] mx-auto space-y-6">
        <PageHeader title="Settings" subtitle="Local preferences stored in this browser" />
        <InfoBox message="These preferences are browser-local. They do not sync across devices and are cleared if you clear this browser's site data." />
        <InfoBox message={notice} />

        <div className="glass-card rounded-3xl p-6 space-y-5">
          <h3 className="font-display font-bold flex items-center gap-2">
            <Settings size={18} className="text-emerald-500" /> Preferences
          </h3>
          {preferences.map((p) => (
            <label key={p.label} className="flex items-start justify-between gap-6 rounded-2xl border border-border p-4 cursor-pointer">
              <span className="flex items-start gap-3">
                <p.icon size={18} className="text-emerald-500 mt-0.5 shrink-0" />
                <span>
                  <span className="font-bold block">{p.label}</span>
                  <span className="text-xs text-zinc-500 leading-relaxed block mt-1">{p.description}</span>
                </span>
              </span>
              <input
                type="checkbox"
                checked={p.value}
                onChange={(e) => p.setter(e.target.checked)}
                className="accent-emerald-500 w-4 h-4 mt-1 shrink-0"
              />
            </label>
          ))}
          <button onClick={saveSettings} className="rounded-xl bg-emerald-500 px-5 py-3 text-sm font-bold text-white flex items-center gap-2 hover:bg-emerald-600 transition-colors">
            <Save size={15} /> Save Preferences
          </button>
        </div>
      </div>
    </DashboardShell>
  );
}