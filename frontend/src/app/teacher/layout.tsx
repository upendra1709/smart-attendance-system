"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getUser, roleHome } from "@/lib/auth";

export default function TeacherLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();

  useEffect(() => {
    const user = getUser();

    if (!user) {
      router.replace("/login");
      return;
    }

    if (user.role !== "teacher") {
      router.replace(roleHome(user.role));
    }
  }, [router]);

  return <>{children}</>;
}