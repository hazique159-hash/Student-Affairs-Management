"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart2,
  Bell,
  HeartHandshake,
  Megaphone,
  MessageSquarePlus,
  ShieldQuestion,
  Users,
} from "lucide-react";
import { SidebarMenu, SidebarMenuItem, SidebarMenuButton } from "@/components/ui/sidebar";

const navItems = [
  { href: "/announcements", icon: Megaphone, label: "Announcements" },
  { href: "/students", icon: Users, label: "Student Records" },
  { href: "/complaints", icon: ShieldQuestion, label: "Complaints" },
  { href: "/register-complaint", icon: MessageSquarePlus, label: "Register Complaint" },
  { href: "/counseling", icon: HeartHandshake, label: "Counseling" },
  { href: "/analytics", icon: BarChart2, label: "Analytics" },
  { href: "/notifications", icon: Bell, label: "Notifications" },
];

export function AppNav() {
  const pathname = usePathname();

  return (
    <SidebarMenu>
      {navItems.map((item) => (
        <SidebarMenuItem key={item.href}>
          <Link href={item.href} passHref legacyBehavior>
            <SidebarMenuButton
              asChild
              isActive={pathname === item.href}
              tooltip={item.label}
            >
              <a>
                <item.icon />
                <span>{item.label}</span>
              </a>
            </SidebarMenuButton>
          </Link>
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  );
}
