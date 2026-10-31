"use client";

import DashboardShell from "@/components/dashboard/DashboardShell";
import PageHeader from "@/components/dashboard/PageHeader";
import ProfileEditor from "@/components/dashboard/ProfileEditor";
import { ADMIN_NAV } from "@/lib/admin-nav";

export default function AdminProfilePage() {
  return (
    <DashboardShell navGroups={ADMIN_NAV} title="My Profile" subtitle="Database-backed account details" accent="emerald">
      <div className="p-4 lg:p-8 max-w-[900px] mx-auto">
        <PageHeader title="My Profile" subtitle="Update your personal and academic information" />
        <ProfileEditor />
      </div>
    </DashboardShell>
  );
}
