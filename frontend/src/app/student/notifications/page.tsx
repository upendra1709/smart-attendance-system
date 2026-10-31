"use client";

import DashboardShell from "@/components/dashboard/DashboardShell";
import PageHeader from "@/components/dashboard/PageHeader";
import NotificationCenter from "@/components/dashboard/NotificationCenter";
import { STUDENT_NAV } from "@/lib/student-nav";

export default function StudentNotificationsPage() {
  return (
    <DashboardShell navGroups={STUDENT_NAV} title="Notifications" subtitle="Persistent attendance and request updates" accent="emerald">
      <div className="p-4 lg:p-8 max-w-[950px] mx-auto">
        <PageHeader title="Notifications" subtitle="Updates are stored in PostgreSQL and synced across devices" />
        <NotificationCenter />
      </div>
    </DashboardShell>
  );
}
