import {
  GraduationCap,
  LayoutDashboard,
  BookOpen,
  History,
  FileCheck2,
  Bell,
  User,
  Settings,
} from "lucide-react";

export const STUDENT_NAV = [
  {
    label: "Main",
    items: [
      {
        icon: GraduationCap,
        label: "Dashboard",
        href: "/student/dashboard",
      },
      {
        icon: LayoutDashboard,
        label: "My Classes",
        href: "/student/classes",
      },
      {
        icon: History,
        label: "Attendance History",
        href: "/student/history",
      },
      {
        icon: FileCheck2,
        label: "Regularisation",
        href: "/student/requests",
      },
    ],
  },
  {
    label: "Activity",
    items: [
      {
        icon: BookOpen,
        label: "Subjects",
        href: "/student/classes",
      },
      {
        icon: Bell,
        label: "Notifications",
        href: "/student/notifications",
      },
    ],
  },
  {
    label: "Account",
    items: [
      {
        icon: User,
        label: "My Profile",
        href: "/student/profile",
      },
      {
        icon: Settings,
        label: "Settings",
        href: "/student/settings",
      },
    ],
  },
];