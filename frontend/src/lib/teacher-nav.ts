import {
  GraduationCap, Camera, BookOpen, Users, CalendarDays, CheckCircle2,
  BarChart3, Clock, Settings,
} from "lucide-react";

export const TEACHER_NAV = [
  {
    label: "Main",
    items: [
      { icon: GraduationCap, label: "Dashboard", href: "/teacher/dashboard" },
      { icon: Camera, label: "Live Attendance", href: "/teacher/session" },
      { icon: BookOpen, label: "My Classes", href: "/teacher/classes" },
      { icon: Users, label: "Students", href: "/teacher/students" },
    ],
  },
  {
    label: "Attendance",
    items: [
      { icon: CalendarDays, label: "Attendance History", href: "/teacher/history" },
      { icon: CheckCircle2, label: "Attendance Corrections", href: "/teacher/corrections" },
      { icon: BarChart3, label: "Reports & Analytics", href: "/teacher/reports" },
    ],
  },
  {
    label: "System",
    items: [
      { icon: Camera, label: "Face Recognition", href: "/teacher/face-recognition" },
      { icon: Clock, label: "Notifications", href: "/teacher/notifications" },
    ],
  },
  {
    label: "Account",
    items: [
      { icon: Users, label: "My Profile", href: "/teacher/profile" },
      { icon: Settings, label: "Settings", href: "/teacher/settings" },
    ],
  },
];