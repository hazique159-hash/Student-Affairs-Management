'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BarChart2,
  HeartHandshake,
  Megaphone,
  Shield,
  Users,
  UserPlus,
  CircleDollarSign,
  Briefcase,
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
  { href: '/teachers', icon: Briefcase, label: 'Teacher Records', roles: ['admin', 'teacher'] },
  { href: '/students', icon: Users, label: 'Student Records', roles: ['admin', 'teacher'] },
  { href: '/counseling', icon: HeartHandshake, label: 'Counseling', roles: ['admin'] },
  { href: '/add-student', icon: UserPlus, label: 'Add Student', roles: ['admin'] },
  
  // Student
  { href: '/my-fines', icon: CircleDollarSign, label: 'My Fines', roles: ['student'] },
];

const adminNavOrder = [
  '/analytics',
  '/announcements',
  '/add-teacher',
  '/teachers',
  '/students',
  '/counseling',
  '/add-student',
  '/admin'
];

const teacherNavOrder = [
  '/announcements',
  '/students',
  '/teachers'
];

const studentNavOrder = [
  '/announcements',
  '/my-fines'
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

  // Sort items based on role-specific order
  if (userRole === 'admin') {
    navItems.sort((a, b) => adminNavOrder.indexOf(a.href) - adminNavOrder.indexOf(b.href));
  } else if (userRole === 'teacher') {
    navItems.sort((a, b) => teacherNavOrder.indexOf(a.href) - teacherNavOrder.indexOf(b.href));
  } else if (userRole === 'student') {
    navItems.sort((a, b) => studentNavOrder.indexOf(a.href) - studentNavOrder.indexOf(b.href));
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

    