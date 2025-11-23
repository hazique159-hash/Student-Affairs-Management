'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BarChart2,
  Bell,
  HeartHandshake,
  Megaphone,
  MessageSquarePlus,
  Shield,
  ShieldQuestion,
  Users,
  UserPlus,
} from 'lucide-react';
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar';
import { useUser } from '@/firebase';

const baseNavItems = [
  { href: '/admin', icon: Shield, label: 'Admin', adminOnly: true },
  { href: '/announcements', icon: Megaphone, label: 'Announcements', adminOnly: false },
  { href: '/students', icon: Users, label: 'Student Records', adminOnly: false },
  { href: '/complaints', icon: ShieldQuestion, label: 'Complaints', adminOnly: false },
  { href: '/register-complaint', icon: MessageSquarePlus, label: 'Register Complaint', adminOnly: false, teacherOnly: true },
  { href: '/counseling', icon: HeartHandshake, label: 'Counseling', adminOnly: true },
  { href: '/analytics', icon: BarChart2, label: 'Analytics', adminOnly: true },
  { href: '/notifications', icon: Bell, label: 'Notifications', adminOnly: true },
  { href: '/add-teacher', icon: UserPlus, label: 'Add Teacher', adminOnly: true },
];

export function AppNav() {
  const pathname = usePathname();
  const { user } = useUser();
  const isAdmin = user?.email?.endsWith('@admin.com');

  const navItems = baseNavItems.filter(item => {
    if (isAdmin) {
      return !item.teacherOnly;
    }
    // For teachers (or other non-admin roles)
    return !item.adminOnly;
  });


  return (
    <SidebarMenu>
      {navItems.map((item) => (
        <SidebarMenuItem key={item.href}>
            <SidebarMenuButton
              as={Link}
              href={item.href}
              isActive={pathname === item.href}
              tooltip={item.label}
            >
                <item.icon />
                <span>{item.label}</span>
            </SidebarMenuButton>
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  );
}
