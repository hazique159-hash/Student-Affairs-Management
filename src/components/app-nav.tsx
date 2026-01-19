'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BarChart2,
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
  // Admin
  { href: '/admin', icon: Shield, label: 'Admin', roles: ['admin'] },
  { href: '/analytics', icon: BarChart2, label: 'Analytics', roles: ['admin'] },
  { href: '/announcements', icon: Megaphone, label: 'Announcements', roles: ['admin', 'teacher', 'student'] },
  { href: '/add-teacher', icon: UserPlus, label: 'Add Teacher', roles: ['admin'] },
  { href: '/students', icon: Users, label: 'Student Records', roles: ['admin', 'teacher'] },
  { href: '/complaints', icon: ShieldQuestion, label: 'Complaints', roles: ['admin', 'teacher', 'student'] },
  { href: '/counseling', icon: HeartHandshake, label: 'Counseling', roles: ['admin'] },
  { href: '/add-student', icon: UserPlus, label: 'Add Student', roles: ['admin'] },
  
  // Teacher
  { href: '/register-complaint', icon: MessageSquarePlus, label: 'Register Complaint', roles: ['teacher'] },

  // Student
  { href: '/my-fines', icon: CircleDollarSign, label: 'My Fines', roles: ['student'] },
];

const adminNavOrder = [
  '/analytics',
  '/announcements',
  '/add-teacher',
  '/students',
  '/complaints',
  '/counseling',
  '/add-student',
  '/admin'
];

export function AppNav() {
  const pathname = usePathname();
  const { user } = useUser();
  
  const getRole = () => {
    if (user?.email?.endsWith('@admin.com')) {
      return 'admin';
    }
    if (user?.email?.endsWith('@student.com')) {
      return 'student';
    }
    if (user?.email) {
      return 'teacher';
    }
    return 'student'; // Default to student if no email
  }
  
  const userRole = getRole();

  let navItems = baseNavItems.filter(item => item.roles.includes(userRole));

  if (userRole === 'admin') {
    const adminItems = adminNavOrder.map(href => navItems.find(item => item.href === href)).filter(Boolean);
    const otherAdminItems = navItems.filter(item => !adminNavOrder.includes(item.href) && item.roles.includes('admin'));
    navItems = [...(adminItems as any), ...otherAdminItems];
  }


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
