'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { HeartHandshake, UserPlus, Loader2, CalendarIcon, Trash2, AlertCircle, MessageCircle } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format } from 'date-fns';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { PageHeader } from '@/components/page-header';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
  SheetFooter,
  SheetClose,
} from '@/components/ui/sheet';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';

import type { Teacher, TeacherAvailability, Student, CounselingSession } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import {
  useFirebase,
  useCollection,
  useMemoFirebase,
  useUser,
} from '@/firebase';
import { collection, doc, setDoc, getDocs, query, where, addDoc, collectionGroup, deleteDoc } from 'firebase/firestore';
import { sendTargetedNotification } from '../notifications/actions';

const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const timeSlots = [
  '9:00 AM - 11:00 AM',
  '11:00 AM - 1:00 PM',
  '2:00 PM - 4:00 PM',
];
const dayNameToIndex: { [key: string]: number } = { Monday: 1, Tuesday: 2, Wednesday: 3, Thursday: 4, Friday: 5, Saturday: 6, Sunday: 0 };


const availabilitySchema = z.object({
  teacherId: z.string({ required_error: 'Please select a teacher.' }),
  availableDays: z.array(z.string()).refine((value) => value.length > 0, {
    message: 'You must select at least one day.',
  }),
  availableSlots: z.array(z.string()).refine((value) => value.length > 0, {
    message: 'You must select at least one time slot.',
  }),
});

const scheduleSchema = z.object({
  studentId: z.string({ required_error: 'Please select a student.' }),
  availabilityId: z.string({ required_error: 'Please select a teacher.' }),
  date: z.date({ required_error: 'Please select a date.' }),
  timeSlot: z.string({ required_error: 'Please select a time slot.' }),
});

export default function CounselingPage() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const [isAvailSheetOpen, setIsAvailSheetOpen] = useState(false);
  const [isScheduleSheetOpen, setIsScheduleSheetOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const { firestore } = useFirebase();
  const { toast } = useToast();

  const isAdmin = user?.email === 'studentaffairs316@gmail.com' || user?.email?.endsWith('@admin.com');

  useEffect(() => {
    if (!isUserLoading && !isAdmin) {
      toast({
        variant: 'destructive',
        title: 'Access Denied',
        description: 'You do not have permission to view this page.',
      });
      router.push('/announcements');
    }
  }, [isUserLoading, isAdmin, router, toast]);

  // Data Fetching
  const teachersRef = useMemoFirebase(() => (firestore ? collection(firestore, 'teachers') : null), [firestore]);
  const { data: teachers, isLoading: isLoadingTeachers } = useCollection<Teacher>(teachersRef);

  const studentsRef = useMemoFirebase(() => (firestore ? collection(firestore, 'students') : null), [firestore]);
  const { data: students, isLoading: isLoadingStudents } = useCollection<Student>(studentsRef);

  const availabilityRef = useMemoFirebase(() => (firestore ? collection(firestore, 'counseling_availability') : null), [firestore]);
  const { data: availableTeachers, isLoading: isLoadingAvailability } = useCollection<TeacherAvailability>(availabilityRef);

  const sessionsRef = useMemoFirebase(() => (firestore && isAdmin ? collectionGroup(firestore, 'counselingSessions') : null), [firestore, isAdmin]);
  const { data: scheduledSessions, isLoading: isLoadingSessions } = useCollection<CounselingSession>(sessionsRef);

  // Filtered Students for counseling (complaintCount > 3)
  const eligibleStudents = useMemo(() => {
    return students?.filter((s) => (s.complaintCount ?? 0) > 3) || [];
  }, [students]);

  // Form for Teacher Availability
  const availForm = useForm<z.infer<typeof availabilitySchema>>({
    resolver: zodResolver(availabilitySchema),
    defaultValues: { teacherId: undefined, availableDays: [], availableSlots: [] },
  });

  const onAvailSubmit = async (values: z.infer<typeof availabilitySchema>) => {
    if (!firestore) return;
    const selectedTeacher = teachers?.find((t) => t.id === values.teacherId);
    if (!selectedTeacher) {
      toast({ variant: 'destructive', title: 'Error', description: 'Selected teacher not found.' });
      return;
    }
    try {
      const newAvailDocRef = doc(collection(firestore, 'counseling_availability'));
      await setDoc(newAvailDocRef, {
        id: newAvailDocRef.id,
        teacherId: values.teacherId,
        teacherName: `${selectedTeacher.firstName} ${selectedTeacher.lastName}`,
        availableDays: values.availableDays,
        availableSlots: values.availableSlots,
      });
      toast({ title: 'Availability Added', description: `Availability for ${selectedTeacher.firstName} ${selectedTeacher.lastName} has been set.` });
      availForm.reset();
      setIsAvailSheetOpen(false);
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Failed to Add Availability', description: error.message || 'An unexpected error occurred.' });
    }
  };

  // Form for Scheduling Session
  const scheduleForm = useForm<z.infer<typeof scheduleSchema>>({
    resolver: zodResolver(scheduleSchema),
    defaultValues: { studentId: undefined, availabilityId: undefined, date: undefined, timeSlot: undefined },
  });

  const watchAvailabilityId = scheduleForm.watch('availabilityId');
  const selectedAvailability = useMemo(() => availableTeachers?.find(t => t.id === watchAvailabilityId), [availableTeachers, watchAvailabilityId]);

  useEffect(() => {
    scheduleForm.resetField('date');
    scheduleForm.resetField('timeSlot');
  }, [watchAvailabilityId, scheduleForm]);

  const onScheduleSubmit = async (values: z.infer<typeof scheduleSchema>) => {
    if (!firestore || !selectedAvailability) return;
    const selectedStudent = students?.find(s => s.id === values.studentId);
    if (!selectedStudent) {
      toast({ variant: 'destructive', title: 'Error', description: 'Student not found.' });
      return;
    }

    try {
      const usersQuery = query(collection(firestore, 'users'), where('studentId', '==', values.studentId));
      const userSnapshot = await getDocs(usersQuery);

      if (userSnapshot.empty) throw new Error(`User account for student ${values.studentId} not found.`);
      
      const studentAuthId = userSnapshot.docs[0].id;
      const formattedDate = format(values.date, "PPPP");
      
      const sessionData = {
        studentId: values.studentId,
        studentName: `${selectedStudent.firstName} ${selectedStudent.lastName}`,
        teacherId: selectedAvailability.teacherId,
        teacherName: selectedAvailability.teacherName,
        dateScheduled: values.date,
        timeSlot: values.timeSlot,
        notes: '',
        studentAuthId: studentAuthId,
      };
      
      const sessionCollectionRef = collection(firestore, `users/${studentAuthId}/counselingSessions`);
      const newDoc = await addDoc(sessionCollectionRef, sessionData);
      await setDoc(doc(sessionCollectionRef, newDoc.id), { id: newDoc.id }, { merge: true });

      // AUTOMATED NOTIFICATION
      const studentEmail = selectedStudent.email || `${selectedStudent.id}@student.com`;
      await sendTargetedNotification(
        studentEmail,
        'Counseling Session Scheduled',
        'Counseling Appointment Confirmed',
        `Dear ${selectedStudent.firstName},\n\nA mandatory counseling session has been scheduled for you.\n\nCounselor: ${selectedAvailability.teacherName}\nDate: ${formattedDate}\nTime Slot: ${values.timeSlot}\n\nPlease ensure your presence at the Student Affairs office 5 minutes before your slot.`
      );

      toast({ title: 'Session Scheduled', description: `Counseling scheduled for ${selectedStudent.firstName}. Student notified via email.` });
      scheduleForm.reset();
      setIsScheduleSheetOpen(false);
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Failed to Schedule Session', description: error.message || 'An unexpected error occurred.' });
    }
  };

  const handleDeleteSession = async (session: CounselingSession) => {
    if (!firestore || !isAdmin) return;
    
    let studentAuthId = session.studentAuthId;
    setDeletingId(session.id);
    
    try {
        if (!studentAuthId) {
            const usersQuery = query(collection(firestore, 'users'), where('studentId', '==', session.studentId));
            const userSnapshot = await getDocs(usersQuery);
            if (!userSnapshot.empty) {
                studentAuthId = userSnapshot.docs[0].id;
            }
        }

        if (!studentAuthId) {
            throw new Error("Could not determine the student path for this session.");
        }

        await deleteDoc(doc(firestore, `users/${studentAuthId}/counselingSessions`, session.id));
        toast({
            title: 'Session Removed',
            description: 'The counseling session has been successfully deleted.',
        });
    } catch (error: any) {
        toast({
            variant: 'destructive',
            title: 'Delete Failed',
            description: error.message || 'Could not delete the session.',
        });
    } finally {
        setDeletingId(null);
    }
  };

  const handleDeleteAvailability = async (availabilityId: string) => {
    if (!firestore || !isAdmin) return;
    setDeletingId(availabilityId);
    try {
        await deleteDoc(doc(firestore, 'counseling_availability', availabilityId));
        toast({
            title: 'Availability Removed',
            description: 'The teacher availability record has been deleted.',
        });
    } catch (error: any) {
        toast({
            variant: 'destructive',
            title: 'Delete Failed',
            description: error.message || 'Could not delete the availability record.',
        });
    } finally {
        setDeletingId(null);
    }
  };

  const openWhatsApp = (session: CounselingSession) => {
    const student = students?.find(s => s.id === session.studentId);
    const phone = student?.phoneNumber || student?.phone;
    if (!phone) {
        toast({ variant: 'destructive', title: 'No phone number', description: 'Student has no contact number saved.' });
        return;
    }
    const message = encodeURIComponent(`Hi ${session.studentName}, this is AffairsConnect. Your counseling session with ${session.teacherName} is scheduled for ${format(new Date(session.dateScheduled.seconds * 1000), 'PPP')} at ${session.timeSlot}. Please confirm.`);
    window.open(`https://wa.me/${phone.replace(/\D/g, '')}?text=${message}`, '_blank');
  };

  if (isUserLoading || !isAdmin) {
    return <div className="flex items-center justify-center h-full"><Loader2 className="animate-spin" /></div>;
  }

  return (
    <div className="space-y-8">
      <PageHeader title="Counseling Services" icon={HeartHandshake} description="Manage student counseling sessions.">
        <div className="flex items-center gap-2">
          {isAdmin && (
            <>
              <Sheet open={isScheduleSheetOpen} onOpenChange={setIsScheduleSheetOpen}>
                <SheetTrigger asChild><Button><UserPlus className="mr-2 h-4 w-4" /> Add Counseling</Button></SheetTrigger>
                <SheetContent className="w-[400px] sm:w-[540px]">
                  <Form {...scheduleForm}>
                    <form onSubmit={scheduleForm.handleSubmit(onScheduleSubmit)} className="flex h-full flex-col">
                      <SheetHeader>
                        <SheetTitle>Schedule Counseling Session</SheetTitle>
                        <SheetDescription>
                          Counseling is mandatory for students with more than 3 violations.
                        </SheetDescription>
                      </SheetHeader>
                      <div className="flex-1 space-y-6 overflow-y-auto py-6 px-1">
                        <FormField control={scheduleForm.control} name="studentId" render={({ field }) => (
                          <FormItem>
                            <FormLabel>Student</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoadingStudents}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder={isLoadingStudents ? "Loading..." : "Select an eligible student"} />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {eligibleStudents.length > 0 ? (
                                  eligibleStudents.map((s) => (
                                    <SelectItem key={s.id} value={s.id}>
                                      {s.firstName} {s.lastName} ({s.id}) - {s.complaintCount} Violations
                                    </SelectItem>
                                  ))
                                ) : (
                                  <div className="p-4 text-xs text-muted-foreground flex items-center gap-2">
                                    <AlertCircle className="h-4 w-4" />
                                    No students with &gt; 3 violations found.
                                  </div>
                                )}
                              </SelectContent>
                            </Select>
                            <FormDescription>
                              Only students with more than 3 approved violations are eligible for counseling.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )} />
                        <FormField control={scheduleForm.control} name="availabilityId" render={({ field }) => (
                          <FormItem>
                            <FormLabel>Teacher</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoadingAvailability}>
                              <FormControl><SelectTrigger><SelectValue placeholder={isLoadingAvailability ? "Loading..." : "Select an available teacher"} /></SelectTrigger></FormControl>
                              <SelectContent>{availableTeachers?.map((t) => (<SelectItem key={t.id} value={t.id}>{t.teacherName}</SelectItem>))}</SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )} />
                        {selectedAvailability && (
                          <>
                            <FormField control={scheduleForm.control} name="date" render={({ field }) => (
                              <FormItem className="flex flex-col">
                                <FormLabel>Date</FormLabel>
                                <Popover>
                                  <PopoverTrigger asChild>
                                    <FormControl>
                                      <Button variant={"outline"} className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                                        {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                      </Button>
                                    </FormControl>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar mode="single" selected={field.value} onSelect={field.onChange} disabled={(date) => {
                                        const dayOfWeek = date.getDay();
                                        const availableDayIndexes = selectedAvailability.availableDays.map(d => dayNameToIndex[d]);
                                        return !availableDayIndexes.includes(dayOfWeek) || date < new Date();
                                    }} initialFocus />
                                  </PopoverContent>
                                </Popover>
                                <FormMessage />
                              </FormItem>
                            )} />
                            <FormField control={scheduleForm.control} name="timeSlot" render={({ field }) => (
                              <FormItem>
                                <FormLabel>Time Slot</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value} disabled={!scheduleForm.getValues('date')}>
                                  <FormControl><SelectTrigger><SelectValue placeholder="Select a time slot" /></SelectTrigger></FormControl>
                                  <SelectContent>{selectedAvailability.availableSlots.map(slot => (<SelectItem key={slot} value={slot}>{slot}</SelectItem>))}</SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )} />
                          </>
                        )}
                      </div>
                      <SheetFooter><SheetClose asChild><Button variant="outline">Cancel</Button></SheetClose><Button type="submit" disabled={scheduleForm.formState.isSubmitting || eligibleStudents.length === 0}>{scheduleForm.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Schedule Session</Button></SheetFooter>
                    </form>
                  </Form>
                </SheetContent>
              </Sheet>
              
              <Sheet open={isAvailSheetOpen} onOpenChange={setIsAvailSheetOpen}>
                <SheetTrigger asChild><Button variant="outline"><UserPlus className="mr-2 h-4 w-4" /> Add Teacher Availability</Button></SheetTrigger>
                <SheetContent>
                  <Form {...availForm}><form onSubmit={availForm.handleSubmit(onAvailSubmit)} className="flex h-full flex-col">
                    <SheetHeader><SheetTitle>Add Teacher Availability</SheetTitle><SheetDescription>Set the days and times a teacher is available for counseling sessions.</SheetDescription></SheetHeader>
                    <div className="flex-1 space-y-8 overflow-y-auto py-6 px-1">
                      <FormField control={availForm.control} name="teacherId" render={({ field }) => (
                        <FormItem><FormLabel>Teacher</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger disabled={isLoadingTeachers}><SelectValue placeholder={isLoadingTeachers ? 'Loading teachers...' : 'Select a teacher'}/></SelectTrigger></FormControl><SelectContent>{teachers?.map((teacher) => (<SelectItem key={teacher.id} value={teacher.id}>{teacher.firstName} {teacher.lastName}</SelectItem>))}</SelectContent></Select><FormMessage /></FormItem>
                      )} />
                      <FormField control={availForm.control} name="availableDays" render={() => (
                        <FormItem><div className="mb-4"><FormLabel>Available Days</FormLabel><FormDescription>Select the days the teacher is available.</FormDescription></div><div className="grid grid-cols-2 gap-4">{days.map((item) => (<FormField key={item} control={availForm.control} name="availableDays" render={({ field }) => (<FormItem key={item} className="flex flex-row items-start space-x-3 space-y-0"><FormControl><Checkbox checked={field.value?.includes(item)} onCheckedChange={(checked) => {return checked ? field.onChange([...(field.value || []), item]) : field.onChange((field.value || [])?.filter((value) => value !== item)) }}/></FormControl><FormLabel className="font-normal">{item}</FormLabel></FormItem>)}/>))}</div><FormMessage /></FormItem>
                      )} />
                      <FormField control={availForm.control} name="availableSlots" render={() => (
                        <FormItem><div className="mb-4"><FormLabel>Available Time Slots</FormLabel><FormDescription>Select the time slots the teacher is available.</FormDescription></div><div className="space-y-2">{timeSlots.map((item) => (<FormField key={item} control={availForm.control} name="availableSlots" render={({ field }) => (<FormItem key={item} className="flex flex-row items-start space-x-3 space-y-0"><FormControl><Checkbox checked={field.value?.includes(item)} onCheckedChange={(checked) => {return checked ? field.onChange([...(field.value || []), item]) : field.onChange((field.value || [])?.filter((value) => value !== item))}}/></FormControl><FormLabel className="font-normal">{item}</FormLabel></FormItem>)}/>))}</div><FormMessage /></FormItem>
                      )} />
                    </div>
                    <SheetFooter><SheetClose asChild><Button variant="outline">Cancel</Button></SheetClose><Button type="submit" disabled={availForm.formState.isSubmitting}>{availForm.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Save Availability</Button></SheetFooter>
                  </form></Form>
                </SheetContent>
              </Sheet>
            </>
          )}
        </div>
      </PageHeader>

      <Card>
        <CardHeader><CardTitle>Available Counselors</CardTitle><CardDescription>Teachers who are currently available for counseling sessions.</CardDescription></CardHeader>
        <CardContent>
          {isLoadingAvailability ? (
            <div className="flex justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>
          ) : availableTeachers && availableTeachers.length > 0 ? (
            <ul className="space-y-6">{availableTeachers.map((avail) => (
              <li key={avail.id} className="p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors group">
                <div className="flex items-start justify-between">
                    <h3 className="font-semibold">{avail.teacherName}</h3>
                    {isAdmin && (
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive opacity-0 group-hover:opacity-100 transition-opacity" disabled={deletingId === avail.id}>
                                    {deletingId === avail.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Delete Availability?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        This will remove the counseling availability for {avail.teacherName}.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleDeleteAvailability(avail.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                        Delete
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    )}
                </div>
                <div className="mt-2 space-y-2 text-sm">
                  <div><h4 className="font-medium text-muted-foreground">Available Days</h4><div className="flex flex-wrap gap-2 mt-1">{avail.availableDays.map((day) => (<Badge key={day} variant="secondary">{day}</Badge>))}</div></div>
                  <div><h4 className="font-medium text-muted-foreground">Available Slots</h4><div className="flex flex-wrap gap-2 mt-1">{avail.availableSlots.map((slot) => (<Badge key={slot} variant="outline">{slot}</Badge>))}</div></div>
                </div>
              </li>
            ))}</ul>
          ) : (
            <div className="flex items-center justify-center h-24"><p className="text-muted-foreground">No teachers have set their availability yet.</p></div>
          )}
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
            <CardTitle>Upcoming Sessions</CardTitle>
            <CardDescription>A list of all scheduled counseling sessions.</CardDescription>
        </CardHeader>
        <CardContent>
            {isLoadingSessions ? (
                <div className="flex justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>
            ) : scheduledSessions && scheduledSessions.length > 0 ? (
                <TooltipProvider>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Student</TableHead>
                                <TableHead>Teacher</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead>Time</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {scheduledSessions
                                .sort((a, b) => a.dateScheduled.seconds - b.dateScheduled.seconds)
                                .map((session) => (
                                    <TableRow key={session.id}>
                                        <TableCell>
                                            <div className="font-medium">{session.studentName}</div>
                                            <div className="text-xs text-muted-foreground">{session.studentId}</div>
                                        </TableCell>
                                        <TableCell>{session.teacherName}</TableCell>
                                        <TableCell>{format(new Date(session.dateScheduled.seconds * 1000), 'PPP')}</TableCell>
                                        <TableCell>{session.timeSlot}</TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="text-green-600 hover:text-green-700" onClick={() => openWhatsApp(session)}>
                                                            <MessageCircle className="h-4 w-4" />
                                                        </Button>
                                                    </TooltipTrigger>
                                                    <TooltipContent>WhatsApp Reminder</TooltipContent>
                                                </Tooltip>

                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="text-destructive" disabled={deletingId === session.id}>
                                                            {deletingId === session.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                                                        </Button>
                                                    </AlertDialogTrigger>
                                                    <AlertDialogContent>
                                                        <AlertDialogHeader>
                                                            <AlertDialogTitle>Cancel Counseling Session?</AlertDialogTitle>
                                                            <AlertDialogDescription>
                                                                This will permanently delete the session for {session.studentName} with {session.teacherName}.
                                                            </AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                            <AlertDialogAction onClick={() => handleDeleteSession(session)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                                                Delete Session
                                                            </AlertDialogAction>
                                                        </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            }
                        </TableBody>
                    </Table>
                </TooltipProvider>
            ) : (
                <div className="flex items-center justify-center h-24"><p className="text-muted-foreground">No upcoming sessions.</p></div>
            )}
        </CardContent>
      </Card>

    </div>
  );
}
