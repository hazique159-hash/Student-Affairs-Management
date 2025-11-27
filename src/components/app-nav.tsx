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
  CircleDollarSign,
} from 'lucide-react';
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar';
import { useUser } from '@/firebase';

const baseNavItems = [
  { href: '/admin', icon: Shield, label: 'Admin', roles: ['admin'] },
  { href: '/announcements', icon: Megaphone, label: 'Announcements', roles: ['admin', 'teacher', 'student'] },
  { href: '/students', icon: Users, label: 'Student Records', roles: ['admin', 'teacher'] },
  { href: '/complaints', icon: ShieldQuestion, label: 'Complaints', roles: ['admin', 'teacher'] },
  { href: '/register-complaint', icon: MessageSquarePlus, label: 'Register Complaint', roles: ['teacher'] },
  { href: '/counseling', icon: HeartHandshake, label: 'Counseling', roles: ['admin'] },
  { href: '/analytics', icon: BarChart2, label: 'Analytics', roles: ['admin'] },
  { href: '/notifications', icon: Bell, label: 'Notifications', roles: ['admin'] },
  { href: '/add-teacher', icon: UserPlus, label: 'Add Teacher', roles: ['admin'] },
  { href: '/my-fines', icon: CircleDollarSign, label: 'My Fines', roles: ['student'] },
];

export function AppNav() {
  const pathname = usePathname();
  const { user } = useUser();
  
  const getRole = () => {
    if (user?.email?.endsWith('@admin.com')) {
      return 'admin';
    }
    if (user?.email) {
      // This is a simplification. In a real-world app, you'd use custom claims.
      return 'teacher';
    }
    return 'student';
  }
  
  const userRole = getRole();

  const navItems = baseNavItems.filter(item => item.roles.includes(userRole));


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
