
'use client';

import { useState } from 'react';
import { Bell, Info, ShieldAlert, Calendar, Loader2, CheckCircle2, Plus, X, SendHorizontal, Mail } from 'lucide-react';
import { PageHeader } from '@/components/page-header';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
  SheetClose,
} from '@/components/ui/sheet';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useUser, useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format } from 'date-fns';
import { collection, addDoc, serverTimestamp, query, orderBy } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import type { Notification, Student, Teacher } from '@/lib/types';
import { sendBroadcastToEmails } from './actions';

const notificationSchema = z.object({
  title: z.string().min(5, { message: 'Title must be at least 5 characters.' }),
  message: z.string().min(10, { message: 'Message must be at least 10 characters.' }),
  type: z.enum(['system', 'security', 'calendar']),
  targetRoles: z.array(z.string()).min(1, { message: 'Select at least one target role.' }),
});

export default function NotificationsPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isBroadcasting, setIsBroadcasting] = useState(false);

  // Fetch notifications
  const notificationsRef = useMemoFirebase(
    () => (firestore ? query(collection(firestore, 'notifications'), orderBy('date', 'desc')) : null),
    [firestore]
  );
  const { data: notifications, isLoading: isLoadingNotifications } = useCollection<Notification>(notificationsRef);

  // Fetch students and teachers for harvesting emails (Admin only)
  const studentsRef = useMemoFirebase(() => (firestore ? collection(firestore, 'students') : null), [firestore]);
  const teachersRef = useMemoFirebase(() => (firestore ? collection(firestore, 'teachers') : null), [firestore]);
  
  const { data: students } = useCollection<Student>(studentsRef);
  const { data: teachers } = useCollection<Teacher>(teachersRef);

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
  const isAdmin = role === 'admin';

  // Client-side filtering for notifications
  const filteredNotifications = notifications?.filter(n => n.targetRoles.includes(role)) || [];

  const form = useForm<z.infer<typeof notificationSchema>>({
    resolver: zodResolver(notificationSchema),
    defaultValues: {
      title: '',
      message: '',
      type: 'system',
      targetRoles: [],
    },
  });

  const onSubmit = async (values: z.infer<typeof notificationSchema>) => {
    if (!firestore) return;
    setIsBroadcasting(true);

    try {
      // 1. Create the in-app notification document
      await addDoc(collection(firestore, 'notifications'), {
        ...values,
        date: serverTimestamp(),
      });

      // 2. Harvest all relevant emails based on roles
      const emailList = new Set<string>();
      
      if (values.targetRoles.includes('student')) {
        students?.forEach(s => {
          // Add primary student email (either derived or stored)
          const sEmail = s.email || `${s.id}@student.com`;
          emailList.add(sEmail.toLowerCase());
          
          // Also notify parents if email is provided
          if (s.parentEmail && s.parentEmail.trim() !== '') {
            emailList.add(s.parentEmail.toLowerCase().trim());
          }
        });
      }
      
      if (values.targetRoles.includes('teacher')) {
        teachers?.forEach(t => {
          if (t.email) emailList.add(t.email.toLowerCase().trim());
        });
      }

      // 3. Trigger the email broadcast via Server Action
      const uniqueEmails = Array.from(emailList);
      
      if (uniqueEmails.length === 0) {
        toast({
          title: 'Notification Created',
          description: 'No email addresses were found for the selected roles, but the in-app alert was posted.',
        });
      } else {
        const result = await sendBroadcastToEmails(
          values.title,
          values.message,
          uniqueEmails
        );

        toast({
          variant: result.success ? 'default' : 'destructive',
          title: result.success ? 'Broadcast Processed' : 'Dispatch Error',
          description: result.message,
        });
      }

      form.reset();
      setIsSheetOpen(false);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Operation Failed',
        description: error.message || 'An unexpected error occurred.',
      });
    } finally {
      setIsBroadcasting(false);
    }
  };

  if (isUserLoading || isLoadingNotifications) {
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
      >
        {isAdmin && (
          <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
            <SheetTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                New Notification
              </Button>
            </SheetTrigger>
            <SheetContent className="sm:max-w-md">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col h-full">
                  <SheetHeader>
                    <SheetTitle className="flex items-center gap-2">
                        <SendHorizontal className="h-5 w-5 text-primary" />
                        Send New Notification
                    </SheetTitle>
                    <SheetDescription>
                      Broadcast a system alert and send email messages to all saved contacts.
                    </SheetDescription>
                  </SheetHeader>
                  <div className="py-6 space-y-6 flex-1 overflow-y-auto px-1">
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Title</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., Upcoming Maintenance" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="message"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Message</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Describe the details..."
                              className="min-h-[100px]"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Notification Type</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="system">System (Blue)</SelectItem>
                              <SelectItem value="security">Security (Red)</SelectItem>
                              <SelectItem value="calendar">Calendar (Purple)</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="targetRoles"
                      render={() => (
                        <FormItem>
                          <div className="mb-4">
                            <FormLabel>Target Audience</FormLabel>
                            <FormDescription>
                              Recipients will receive an in-app alert and an email.
                            </FormDescription>
                          </div>
                          <div className="space-y-2">
                            {['teacher', 'student'].map((roleItem) => (
                              <FormField
                                key={roleItem}
                                control={form.control}
                                name="targetRoles"
                                render={({ field }) => {
                                  return (
                                    <FormItem
                                      key={roleItem}
                                      className="flex flex-row items-start space-x-3 space-y-0"
                                    >
                                      <FormControl>
                                        <Checkbox
                                          checked={field.value?.includes(roleItem)}
                                          onCheckedChange={(checked) => {
                                            return checked
                                              ? field.onChange([...field.value, roleItem])
                                              : field.onChange(
                                                  field.value?.filter(
                                                    (value) => value !== roleItem
                                                  )
                                                )
                                          }}
                                        />
                                      </FormControl>
                                      <FormLabel className="font-normal capitalize">
                                        {roleItem}s
                                      </FormLabel>
                                    </FormItem>
                                  )
                                }}
                              />
                            ))}
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="bg-muted p-3 rounded-md text-[10px] text-muted-foreground flex items-start gap-2 border">
                        <Mail className="h-3 w-3 mt-0.5" />
                        <p>Emails will be harvested automatically from the <strong>Students</strong> (including Parents) and <strong>Teachers</strong> records based on your selection.</p>
                    </div>
                  </div>
                  <SheetFooter className="pt-4 border-t">
                    <SheetClose asChild>
                      <Button variant="outline">Cancel</Button>
                    </SheetClose>
                    <Button type="submit" disabled={form.formState.isSubmitting || isBroadcasting}>
                      {isBroadcasting ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <SendHorizontal className="mr-2 h-4 w-4" />
                      )}
                      Send Broadcast
                    </Button>
                  </SheetFooter>
                </form>
              </Form>
            </SheetContent>
          </Sheet>
        )}
      </PageHeader>

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
                    className="flex items-start gap-4 p-4 transition-colors hover:bg-muted/50"
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
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                        {notification.message}
                      </p>
                      <div className="flex items-center gap-2 pt-1 text-[10px] text-muted-foreground uppercase font-bold tracking-widest">
                        <span>
                          {notification.date?.seconds 
                            ? format(new Date(notification.date.seconds * 1000), 'MMM d, h:mm a') 
                            : 'Just now'}
                        </span>
                        <div className="flex items-center gap-1">
                          <span>•</span>
                          <CheckCircle2 className="h-3 w-3 text-green-500" />
                          <span>Delivered</span>
                        </div>
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
