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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { LogOut, ShieldQuestion } from 'lucide-react';
import { PlaceHolderImages } from '@/lib/placeholder-images';

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const userAvatar = PlaceHolderImages.find(p => p.id === 'user-avatar');

  return (
    <SidebarProvider>
        <Sidebar variant="inset">
          <SidebarHeader className="border-b border-sidebar-border">
            <div className="flex items-center gap-2 p-2">
              <Button variant="ghost" size="icon" className="h-10 w-10 shrink-0 bg-primary text-primary-foreground hover:bg-primary/90 rounded-full">
                <ShieldQuestion className="h-5 w-5" />
              </Button>
              <div className="flex flex-col">
                <h2 className="text-lg font-semibold font-headline">AffairsConnect</h2>
              </div>
            </div>
          </SidebarHeader>
          <SidebarContent>
            <AppNav />
          </SidebarContent>
          <SidebarFooter className="border-t border-sidebar-border">
             <div className="flex items-center gap-2 p-2">
              {userAvatar && (
                 <Avatar className="h-9 w-9">
                    <AvatarImage src={userAvatar.imageUrl} alt="Admin" data-ai-hint={userAvatar.imageHint} />
                    <AvatarFallback>AD</AvatarFallback>
                </Avatar>
              )}
              <div className="flex flex-col overflow-hidden">
                <span className="text-sm font-medium truncate">Rabea Saleem</span>
                <span className="text-xs text-muted-foreground truncate">Supervisor</span>
              </div>
              <Button variant="ghost" size="icon" className="ml-auto">
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
               <h2 className="text-lg font-semibold font-headline">AffairsConnect</h2>
             </div>
          </header>
          <div className="p-4 sm:p-6 lg:p-8">
            {children}
          </div>
        </SidebarInset>
    </SidebarProvider>
  );
}
