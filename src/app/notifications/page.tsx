'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, Info, ShieldAlert, Calendar, Loader2, CheckCircle2, Plus, X, SendHorizontal, Mail, Trash2 } from 'lucide-react';
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
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
import { collection, addDoc, serverTimestamp, query, orderBy, doc, deleteDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import type { Notification, Student, Teacher, Admin } from '@/lib/types';
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
  const router = useRouter();
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

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

  useEffect(() => {
    if (!isUserLoading && !isAdmin) {
      toast({
        variant: 'destructive',
        title: 'Access Denied',
        description: 'You do not have permission to access the notifications panel.',
      });
      router.push('/announcements');
    }
  }, [isUserLoading, isAdmin, router, toast]);

  const notificationsRef = useMemoFirebase(
    () => (firestore ? query(collection(firestore, 'notifications'), orderBy('date', 'desc')) : null),
    [firestore]
  );
  const { data: notifications, isLoading: isLoadingNotifications } = useCollection<Notification>(notificationsRef);

  const studentsRef = useMemoFirebase(() => (firestore && isAdmin ? collection(firestore, 'students') : null), [firestore, isAdmin]);
  const teachersRef = useMemoFirebase(() => (firestore && isAdmin ? collection(firestore, 'teachers') : null), [firestore, isAdmin]);
  const adminsRef = useMemoFirebase(() => (firestore && isAdmin ? collection(firestore, 'roles_admin') : null), [firestore, isAdmin]);
  
  const { data: students } = useCollection<Student>(studentsRef);
  const { data: teachers } = useCollection<Teacher>(teachersRef);
  const { data: admins } = useCollection<Admin>(adminsRef);

  const filteredNotifications = notifications || [];

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
    if (!firestore || !isAdmin) return;
    setIsBroadcasting(true);

    try {
      await addDoc(collection(firestore, 'notifications'), {
        ...values,
        date: serverTimestamp(),
      });

      const emailList = new Set<string>();
      
      if (values.targetRoles.includes('student')) {
        students?.forEach(s => {
          if (s.email) emailList.add(s.email.toLowerCase().trim());
          if (s.recoveryEmail) emailList.add(s.recoveryEmail.toLowerCase().trim());
          if (s.parentEmail) emailList.add(s.parentEmail.toLowerCase().trim());
          if (!s.email && !s.recoveryEmail) emailList.add(`${s.id}@student.com`.toLowerCase());
        });
      }
      
      if (values.targetRoles.includes('teacher')) {
        teachers?.forEach(t => {
          if (t.email) emailList.add(t.email.toLowerCase().trim());
        });
      }

      if (values.targetRoles.includes('admin')) {
        admins?.forEach(a => {
          if (a.email) emailList.add(a.email.toLowerCase().trim());
          if (a.recoveryEmail) emailList.add(a.recoveryEmail.toLowerCase().trim());
        });
        emailList.add('studentaffairs316@gmail.com');
      }

      const uniqueEmails = Array.from(emailList).filter(e => e.includes('@'));
      
      if (uniqueEmails.length === 0) {
        toast({
          title: 'Notification Created',
          description: 'No recipient emails were found, but the in-app alert was posted.',
        });
      } else {
        const result = await sendBroadcastToEmails(
          values.title,
          values.message,
          uniqueEmails
        );

        toast({
          variant: result.success ? 'default' : 'destructive',
          title: 'Broadcast Dispatch',
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

  const handleDelete = async (notificationId: string) => {
    if (!firestore || !isAdmin) return;
    setDeletingId(notificationId);
    try {
        await deleteDoc(doc(firestore, 'notifications', notificationId));
        toast({ title: 'Notification Removed', description: 'The broadcast record has been deleted.' });
    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Deletion Failed', description: error.message });
    } finally {
        setDeletingId(null);
    }
  };

  if (isUserLoading || !isAdmin) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-10">
      <PageHeader
        title="Institutional Notifications"
        icon={Bell}
        description="Broadcast system alerts and manage official communications."
      >
        <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
          <SheetTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Broadcast
            </Button>
          </SheetTrigger>
          <SheetContent className="sm:max-w-md">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col h-full">
                <SheetHeader>
                  <SheetTitle className="flex items-center gap-2">
                      <SendHorizontal className="h-5 w-5 text-primary" />
                      Dispatch Broadcast
                  </SheetTitle>
                  <SheetDescription>
                    This will post an alert to the database and dispatch official emails to the selected audience.
                  </SheetDescription>
                </SheetHeader>
                <div className="py-6 space-y-6 flex-1 overflow-y-auto px-1">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Subject Title</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Campus Maintenance" {...field} />
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
                        <FormLabel>Content Message</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Write the full message details here..."
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
                        <FormLabel>Alert Category</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="system">System (Normal)</SelectItem>
                            <SelectItem value="security">Security (Urgent)</SelectItem>
                            <SelectItem value="calendar">Calendar (Event)</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="targetRoles"
                    render={() => (
                      <FormItem>
                        <div className="mb-4">
                          <FormLabel>Recipient Audience</FormLabel>
                          <FormDescription>Emails will be harvested from student and teacher records.</FormDescription>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          {['teacher', 'student', 'admin'].map((roleItem) => (
                            <FormField
                              key={roleItem}
                              control={form.control}
                              name="targetRoles"
                              render={({ field }) => (
                                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                  <FormControl>
                                    <Checkbox
                                      checked={field.value?.includes(roleItem)}
                                      onCheckedChange={(checked) => {
                                        return checked
                                          ? field.onChange([...field.value, roleItem])
                                          : field.onChange(field.value?.filter(v => v !== roleItem))
                                      }}
                                    />
                                  </FormControl>
                                  <FormLabel className="font-normal capitalize">
                                    {roleItem}s
                                  </FormLabel>
                                </FormItem>
                              )}
                            />
                          ))}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="bg-muted p-3 rounded-md text-[11px] text-muted-foreground space-y-2 border">
                      <div className="flex items-center gap-2 font-bold uppercase text-primary">
                          <Mail className="h-3 w-3" />
                          Mail Delivery Note
                      </div>
                      <p>Emails are sent via <strong>Resend</strong> using the student.affair.com domain.</p>
                      <p>System harvests: Primary, Recovery, and Parent email addresses.</p>
                  </div>
                </div>
                <SheetFooter className="pt-4 border-t">
                  <SheetClose asChild>
                    <Button variant="outline">Cancel</Button>
                  </SheetClose>
                  <Button type="submit" disabled={form.formState.isSubmitting || isBroadcasting}>
                    {isBroadcasting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <SendHorizontal className="mr-2 h-4 w-4" />}
                    Dispatch Now
                  </Button>
                </SheetFooter>
              </form>
            </Form>
          </SheetContent>
        </Sheet>
      </PageHeader>

      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Broadcast History</CardTitle>
            <Badge variant="outline">{filteredNotifications.length} Sent</Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[calc(100vh-280px)]">
            <div className="divide-y">
              {isLoadingNotifications ? (
                <div className="p-8 text-center"><Loader2 className="animate-spin h-6 w-6 mx-auto" /></div>
              ) : filteredNotifications.length > 0 ? (
                filteredNotifications.map((notification) => (
                  <div key={notification.id} className="flex items-start gap-4 p-4 hover:bg-muted/30 transition-colors group">
                    <div className="mt-1">
                      {notification.type === 'system' && <div className="bg-blue-100 p-2 rounded-full"><Info className="h-4 w-4 text-blue-600" /></div>}
                      {notification.type === 'security' && <div className="bg-red-100 p-2 rounded-full"><ShieldAlert className="h-4 w-4 text-red-600" /></div>}
                      {notification.type === 'calendar' && <div className="bg-purple-100 p-2 rounded-full"><Calendar className="h-4 w-4 text-purple-600" /></div>}
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-semibold">{notification.title}</h4>
                        <div className="flex items-center gap-2">
                          <div className="flex gap-1">
                            {notification.targetRoles.map(r => <Badge key={r} variant="secondary" className="text-[8px] h-3.5 capitalize">{r}</Badge>)}
                          </div>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive opacity-0 group-hover:opacity-100 transition-opacity" disabled={deletingId === notification.id}>
                                    {deletingId === notification.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Delete Broadcast Record?</AlertDialogTitle>
                                    <AlertDialogDescription>This will remove the notification from the history. It does not unsend emails already dispatched.</AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleDelete(notification.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">{notification.message}</p>
                      <div className="flex items-center gap-2 pt-2 text-[10px] text-muted-foreground uppercase font-bold">
                        <span>{notification.date?.seconds ? format(new Date(notification.date.seconds * 1000), 'PPP p') : 'Just now'}</span>
                        <Badge className="h-3.5 px-1 bg-green-500 text-white border-none text-[8px]">Distributed</Badge>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-20 text-center text-muted-foreground">
                  <Bell className="h-10 w-10 mx-auto mb-4 opacity-10" />
                  <p>No past broadcasts found.</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
