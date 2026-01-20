'use client';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { FirebaseClientProvider } from '@/firebase';

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
import { LogOut, ShieldQuestion, Loader2 } from 'lucide-react';
import { useFirebase } from '@/firebase';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const router = useRouter();
  const { auth, user, isUserLoading } = useFirebase();

  const isLoginPage = pathname === '/login';

  const portalBg = PlaceHolderImages.find((p) => p.id === 'login-background');

  useEffect(() => {
    // Redirect to login if not authenticated and not on the login page
    if (!isUserLoading && !user && !isLoginPage) {
      router.push('/login');
    }
  }, [isUserLoading, user, isLoginPage, router]);
  
  const handleLogout = () => {
    if (auth) {
      auth.signOut();
      router.push('/login');
    }
  };

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

  const role = user ? getRole() : '';


  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <title>AffairsConnect</title>
        <meta
          name="description"
          content="Student Affairs Management System"
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=PT+Sans:wght@400;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-body antialiased">
        <FirebaseClientProvider>
          {isLoginPage ? (
            <>
              {children}
            </>
          ) : (
             <>
              {(isUserLoading || !user) ? (
                 <div className="flex h-screen w-full items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
              ) : (
                <div className="relative min-h-screen w-full">
                  {portalBg && (
                    <Image
                      src={portalBg.imageUrl}
                      alt={portalBg.description}
                      data-ai-hint={portalBg.imageHint}
                      fill
                      className="object-cover blur-sm -z-10"
                    />
                  )}
                  <div className="absolute inset-0 bg-black/50 -z-10" />
                  <div className="portal-background-effect">
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
                  </div>
                </div>
              )}
             </>
          )}
          <Toaster />
        </FirebaseClientProvider>
      </body>
    </html>
  );
}
