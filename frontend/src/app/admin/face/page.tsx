"use client";

import DashboardShell from "@/components/dashboard/DashboardShell";
import PageHeader from "@/components/dashboard/PageHeader";
import FaceApprovalReview from "@/components/dashboard/FaceApprovalReview";
import { ADMIN_NAV } from "@/lib/admin-nav";

export default function AdminFaceApprovalsPage() {
  return (
    <DashboardShell navGroups={ADMIN_NAV} title="Face Approvals" subtitle="Review student face enrollments" accent="emerald">
      <div className="p-4 lg:p-8 max-w-[950px] mx-auto space-y-6">
        <PageHeader title="Face Approvals" subtitle="Approve or reject faces students enrolled themselves" />
        <FaceApprovalReview />
      </div>
    </DashboardShell>
  );
}
