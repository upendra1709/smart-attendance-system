"use client";

import DashboardShell from "@/components/dashboard/DashboardShell";
import PageHeader from "@/components/dashboard/PageHeader";
import NotificationCenter from "@/components/dashboard/NotificationCenter";
import { TEACHER_NAV } from "@/lib/teacher-nav";

export default function TeacherNotificationsPage() {
  return (
    <DashboardShell navGroups={TEACHER_NAV} title="Notifications" subtitle="Persistent attendance and regularisation updates" accent="violet">
      <div className="p-4 lg:p-8 max-w-[950px] mx-auto">
        <PageHeader title="Notifications" subtitle="Attendance warnings and student request updates" />
        <NotificationCenter accent="violet" />
      </div>
    </DashboardShell>
  );
}
