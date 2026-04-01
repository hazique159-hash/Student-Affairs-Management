'use client';

import { Bell, Info, ShieldAlert, Calendar, Loader2, CheckCircle2 } from 'lucide-react';
import { PageHeader } from '@/components/page-header';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { useUser } from '@/firebase';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format } from 'date-fns';

// Mock notifications for demonstration
const MOCK_NOTIFICATIONS = [
  {
    id: '1',
    type: 'system',
    title: 'New Campus Announcement',
    message: 'A new holiday notification for the upcoming week has been published.',
    date: new Date(),
    read: false,
    roles: ['admin', 'teacher', 'student'],
  },
  {
    id: '2',
    type: 'security',
    title: 'Complaint Status Updated',
    message: 'Your recent violation report regarding Library Misconduct has been Approved.',
    date: new Date(Date.now() - 3600000), // 1 hour ago
    read: true,
    roles: ['student'],
  },
  {
    id: '3',
    type: 'calendar',
    title: 'Counseling Reminder',
    message: 'You have a scheduled counseling session tomorrow at 10:00 AM with Prof. Ahmed.',
    date: new Date(Date.now() - 86400000), // 1 day ago
    read: false,
    roles: ['student'],
  },
  {
    id: '4',
    type: 'security',
    title: 'New Pending Complaint',
    message: 'A new violation report has been filed and requires your immediate review.',
    date: new Date(Date.now() - 1200000), // 20 mins ago
    read: false,
    roles: ['admin'],
  },
];

export default function NotificationsPage() {
  const { user, isUserLoading } = useUser();

  const getRole = () => {
    const email = user?.email || '';
    if (email === 'studentaffairs316@gmail.com' || email.endsWith('@admin.com')) {
      return 'admin';
    }
    if (email.endsWith('@student.com')) {
      return 'student';
    }
    return 'teacher';
  };

  const role = getRole();
  const filteredNotifications = MOCK_NOTIFICATIONS.filter(n => n.roles.includes(role));

  if (isUserLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-10">
      <PageHeader
        title="Notifications"
        icon={Bell}
        description="Stay updated with the latest system alerts and personal notifications."
      />

      <Card className="max-w-4xl mx-auto border-none shadow-none bg-transparent sm:bg-card sm:border sm:shadow-sm">
        <CardHeader className="px-4 sm:px-6">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Inbound Alerts</CardTitle>
              <CardDescription>Review recent activity related to your account.</CardDescription>
            </div>
            <Badge variant="outline" className="text-[10px] uppercase tracking-tighter">
              {filteredNotifications.length} Total
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0 sm:p-6">
          <ScrollArea className="h-[calc(100vh-280px)] sm:h-auto">
            <div className="divide-y border-t sm:border-none">
              {filteredNotifications.length > 0 ? (
                filteredNotifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`flex items-start gap-4 p-4 transition-colors hover:bg-muted/50 ${
                      !notification.read ? 'bg-primary/5' : ''
                    }`}
                  >
                    <div className="mt-1">
                      {notification.type === 'system' && (
                        <div className="bg-blue-100 p-2 rounded-full">
                          <Info className="h-4 w-4 text-blue-600" />
                        </div>
                      )}
                      {notification.type === 'security' && (
                        <div className="bg-destructive/10 p-2 rounded-full">
                          <ShieldAlert className="h-4 w-4 text-destructive" />
                        </div>
                      )}
                      {notification.type === 'calendar' && (
                        <div className="bg-accent/10 p-2 rounded-full">
                          <Calendar className="h-4 w-4 text-accent" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="text-sm font-semibold leading-none">
                          {notification.title}
                        </h4>
                        {!notification.read && (
                          <span className="h-2 w-2 rounded-full bg-primary" />
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                        {notification.message}
                      </p>
                      <div className="flex items-center gap-2 pt-1 text-[10px] text-muted-foreground uppercase font-bold tracking-widest">
                        <span>{format(notification.date, 'MMM d, h:mm a')}</span>
                        {notification.read && (
                          <div className="flex items-center gap-1">
                            <span>•</span>
                            <CheckCircle2 className="h-3 w-3 text-green-500" />
                            <span>Seen</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                  <div className="bg-muted p-4 rounded-full">
                    <Bell className="h-8 w-8 text-muted-foreground opacity-20" />
                  </div>
                  <div className="space-y-1">
                    <p className="font-semibold text-muted-foreground">All caught up!</p>
                    <p className="text-xs text-muted-foreground">No new notifications at this time.</p>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
