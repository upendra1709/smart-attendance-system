"use client";

import DashboardShell from "@/components/dashboard/DashboardShell";
import PageHeader from "@/components/dashboard/PageHeader";
import ProfileEditor from "@/components/dashboard/ProfileEditor";
import { TEACHER_NAV } from "@/lib/teacher-nav";

export default function TeacherProfilePage() {
  return (
    <DashboardShell navGroups={TEACHER_NAV} title="My Profile" subtitle="Database-backed account details" accent="violet">
      <div className="p-4 lg:p-8 max-w-[900px] mx-auto">
        <PageHeader title="My Profile" subtitle="Update your personal and academic information" />
        <ProfileEditor accent="violet" />
      </div>
    </DashboardShell>
  );
}
