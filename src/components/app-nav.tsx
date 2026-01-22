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
  Bell,
  MessageSquareHeart,
  PenSquare,
  MessageSquareWarning,
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
  { href: '/teachers', icon: Briefcase, label: 'Teacher Records', roles: ['admin'] },
  { href: '/students', icon: Users, label: 'Student Records', roles: ['admin', 'teacher'] },
  { href: '/counseling', icon: HeartHandshake, label: 'Counseling', roles: ['admin', 'teacher'] },
  { href: '/add-student', icon: UserPlus, label: 'Add Student', roles: ['admin'] },
  { href: '/complaints', icon: MessageSquareWarning, label: 'Complaints Inbox', roles: ['admin'] },
  
  // Student
  { href: '/my-fines', icon: CircleDollarSign, label: 'My Fines', roles: ['student'] },
  { href: '/my-complaints', icon: MessageSquareHeart, label: 'My Complaints', roles: ['student', 'teacher'] },
  
  // Student & Teacher
  { href: '/register-complaint', icon: PenSquare, label: 'File Complaint', roles: ['student', 'teacher'] },
];

const adminNavOrder = [
  '/analytics',
  '/announcements',
  '/students',
  '/teachers',
  '/complaints',
  '/add-student',
  '/add-teacher',
  '/counseling',
  '/admin'
];

const teacherNavOrder = [
  '/announcements',
  '/counseling',
  '/students',
  '/my-complaints',
  '/register-complaint',
];

const studentNavOrder = [
  '/announcements',
  '/my-fines',
  '/my-complaints',
  '/register-complaint'
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
