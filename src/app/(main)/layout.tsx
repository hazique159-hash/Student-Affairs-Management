'use client';
import {
  SidebarProvider,
  Sidebar,
  SidebarInset,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { AppNav } from '@/components/app-nav';
import { Button } from '@/components/ui/button';
import { LogOut, ShieldQuestion } from 'lucide-react';
import { useFirebase } from '@/firebase';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { auth, user, isUserLoading } = useFirebase();
  const router = useRouter();

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [isUserLoading, user, router]);

  const handleLogout = () => {
    if (auth) {
      auth.signOut();
      router.push('/login');
    }
  };

  if (isUserLoading || !user) {
    return (
      <div className="flex min-h-screen w-full">
        <div className="hidden md:block w-64 border-r p-4 space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
        </div>
        <div className="flex-1 p-8">
          <Skeleton className="h-16 w-1/3 mb-8" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  const getRole = () => {
    const email = user?.email || '';
    if (email.endsWith('@admin.com')) {
      return 'Admin';
    }
    if (email.endsWith('@student.com')) {
      return 'Student';
    }
    if (email) {
      return 'Teacher';
    }
    return 'Student'; // Default for safety, though should have email
  };

  const role = getRole();

  return (
    <SidebarProvider>
      <Sidebar variant="inset">
        <SidebarHeader className="border-b border-sidebar-border">
          <div className="flex items-center gap-2 p-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 shrink-0 bg-primary text-primary-foreground hover:bg-primary/90 rounded-full"
            >
              <ShieldQuestion className="h-5 w-5" />
            </Button>
            <div className="flex flex-col">
              <h2 className="text-lg font-semibold font-headline">
                AffairsConnect
              </h2>
            </div>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <AppNav />
        </SidebarContent>
        <SidebarFooter className="border-t border-sidebar-border">
          <div className="flex items-center gap-2 p-2">
            <div className="flex flex-col overflow-hidden">
              <span className="text-sm font-medium truncate">
                {user.email || user.uid}
              </span>
              <span className="text-xs text-muted-foreground truncate">
                {role === 'Admin' ? 'Supervisor' : role}
              </span>
            </div>
            <Button variant="ghost" size="icon" className="ml-auto" onClick={handleLogout}>
              <LogOut />
            </Button>
          </div>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background/80 px-6 backdrop-blur-sm md:hidden">
          <SidebarTrigger />
          <div className="flex items-center gap-2">
            <ShieldQuestion className="h-6 w-6 text-primary" />
            <h2 className="text-lg font-semibold font-headline">
              AffairsConnect
            </h2>
          </div>
        </header>
        <div className="p-4 sm:p-6 lg:p-8">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
