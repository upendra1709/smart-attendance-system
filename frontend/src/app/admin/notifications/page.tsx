"use client";

import DashboardShell from "@/components/dashboard/DashboardShell";
import PageHeader from "@/components/dashboard/PageHeader";
import NotificationCenter from "@/components/dashboard/NotificationCenter";
import { ADMIN_NAV } from "@/lib/admin-nav";

export default function AdminNotificationsPage() {
  return (
    <DashboardShell navGroups={ADMIN_NAV} title="Notifications" subtitle="Persistent system and attendance updates" accent="emerald">
      <div className="p-4 lg:p-8 max-w-[950px] mx-auto">
        <PageHeader title="Notifications" subtitle="Stored updates with read/unread state" />
        <NotificationCenter />
      </div>
    </DashboardShell>
  );
}
