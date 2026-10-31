import {
  LayoutDashboard,
  Users,
  BookOpen,
  School,
  CalendarCheck2,
  BarChart3,
  Bell,
  User,
  Settings,
  ScanFace,
} from "lucide-react";

export const ADMIN_NAV = [
  {
    label: "Overview",
    items: [
      {
        icon: LayoutDashboard,
        label: "Dashboard",
        href: "/admin/dashboard",
      },
      {
        icon: Users,
        label: "Users",
        href: "/admin/users",
      },
      {
        icon: School,
        label: "Classes",
        href: "/admin/classes",
      },
    ],
  },
  {
    label: "Attendance",
    items: [
      {
        icon: CalendarCheck2,
        label: "Attendance",
        href: "/admin/attendance",
      },
      {
        icon: ScanFace,
        label: "Face Approvals",
        href: "/admin/face",
      },
      {
        icon: BarChart3,
        label: "Reports",
        href: "/admin/reports",
      },
    ],
  },
  {
    label: "System",
    items: [
      {
        icon: BookOpen,
        label: "Subjects",
        href: "/admin/classes?tab=subjects",
      },
      {
        icon: Bell,
        label: "Notifications",
        href: "/admin/notifications",
      },
    ],
  },
  {
    label: "Account",
    items: [
      {
        icon: User,
        label: "My Profile",
        href: "/admin/profile",
      },
      {
        icon: Settings,
        label: "Settings",
        href: "/admin/settings",
      },
    ],
  },
];