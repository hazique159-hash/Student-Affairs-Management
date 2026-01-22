'use client';

import { useState, useMemo } from 'react';
import {
  HeartHandshake,
  Plus,
  Calendar as CalendarIcon,
  UserPlus,
  Loader2,
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { PageHeader } from '@/components/page-header';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';

import type { Teacher, TeacherAvailability, CounselingSession, Student } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import {
  useFirebase,
  useCollection,
  useMemoFirebase,
  useUser,
} from '@/firebase';
import { collection, doc, setDoc, addDoc, getDoc } from 'firebase/firestore';

const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const timeSlots = [
  '9:00 AM - 11:00 AM',
  '11:00 AM - 1:00 PM',
  '2:00 PM - 4:00 PM',
];

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
  availabilityId: z.string({ required_error: 'Please select a counselor.' }),
  date: z.date({ required_error: 'Please select a date.' }),
  slot: z.string({ required_error: 'Please select a time slot.' }),
  notes: z.string().optional(),
});

export default function CounselingPage() {
  const { user } = useUser();
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isScheduleSheetOpen, setIsScheduleSheetOpen] = useState(false);
  const { firestore } = useFirebase();
  const { toast } = useToast();

  const isAdmin = user?.email?.endsWith('@admin.com');
  const isStudent = user?.email?.endsWith('@student.com');

  const teachersRef = useMemoFirebase(
    () => (firestore ? collection(firestore, 'teachers') : null),
    [firestore]
  );
  const { data: teachers, isLoading: isLoadingTeachers } =
    useCollection<Teacher>(teachersRef);

  const availabilityRef = useMemoFirebase(
    () => (firestore ? collection(firestore, 'counseling_availability') : null),
    [firestore]
  );
  const { data: availableTeachers, isLoading: isLoadingAvailability } =
    useCollection<TeacherAvailability>(availabilityRef);

  const sessionsRef = useMemoFirebase(
    () =>
      firestore && user
        ? collection(firestore, `users/${user.uid}/counselingSessions`)
        : null,
    [firestore, user]
  );
  const { data: upcomingSessions, isLoading: isLoadingSessions } =
    useCollection<CounselingSession>(sessionsRef);

  const form = useForm<z.infer<typeof availabilitySchema>>({
    resolver: zodResolver(availabilitySchema),
    defaultValues: {
      teacherId: undefined,
      availableDays: [],
      availableSlots: [],
    },
  });

  const scheduleForm = useForm<z.infer<typeof scheduleSchema>>({
    resolver: zodResolver(scheduleSchema),
    defaultValues: {
      notes: '',
    },
  });

  const availabilityId = scheduleForm.watch('availabilityId');
  const selectedDate = scheduleForm.watch('date');

  const selectedAvailability = useMemo(() => {
      return availableTeachers?.find(avail => avail.id === availabilityId);
  }, [availableTeachers, availabilityId]);

  const dayNameToNumber: { [key: string]: number } = {
      'Sunday': 0, 'Monday': 1, 'Tuesday': 2, 'Wednesday': 3, 'Thursday': 4, 'Friday': 5, 'Saturday': 6
  };

  const dateDisabledMatcher = (date: Date) => {
      if (date < new Date(new Date().setHours(0, 0, 0, 0))) { // disable past dates
          return true;
      }
      if (!selectedAvailability) {
          return true; // disable all if no teacher selected
      }
      const availableDayNumbers = selectedAvailability.availableDays.map(day => dayNameToNumber[day]);
      return !availableDayNumbers.includes(date.getDay());
  };


  const onSubmit = async (values: z.infer<typeof availabilitySchema>) => {
    if (!firestore) return;

    const selectedTeacher = teachers?.find((t) => t.id === values.teacherId);
    if (!selectedTeacher) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Selected teacher not found.',
      });
      return;
    }

    try {
      const availabilityCollectionRef = collection(
        firestore,
        'counseling_availability'
      );
      const newAvailDocRef = doc(availabilityCollectionRef);

      await setDoc(newAvailDocRef, {
        id: newAvailDocRef.id,
        teacherId: values.teacherId,
        teacherName: `${selectedTeacher.firstName} ${selectedTeacher.lastName}`,
        availableDays: values.availableDays,
        availableSlots: values.availableSlots,
      });
      toast({
        title: 'Availability Added',
        description: `Availability for ${selectedTeacher.firstName} ${selectedTeacher.lastName} has been set.`,
      });
      form.reset();
      setIsSheetOpen(false);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Failed to Add Availability',
        description: error.message || 'An unexpected error occurred.',
      });
    }
  };

  const onScheduleSubmit = async (values: z.infer<typeof scheduleSchema>) => {
    if (!firestore || !user) {
        toast({
            variant: 'destructive',
            title: 'Error',
            description: 'You must be logged in to schedule a session.',
        });
        return;
    }

    const selectedAvailability = availableTeachers?.find(avail => avail.id === values.availabilityId);
    if (!selectedAvailability) {
        toast({ variant: 'destructive', title: 'Error', description: 'Selected counselor is no longer available.' });
        return;
    }

    try {
        const studentRegId = user.email!.split('@')[0].toUpperCase();
        let studentName: string;
        const studentDocRef = doc(firestore, 'students', studentRegId);
        const studentDoc = await getDoc(studentDocRef);

        if (studentDoc.exists()) {
            const studentData = studentDoc.data() as Student;
            studentName = `${studentData.firstName} ${studentData.lastName}`;
        } else {
            studentName = user.email!; // Fallback
        }

        const [startTime] = values.slot.split(' - ');
        const [time, ampm] = startTime.split(' ');
        let [hours, minutes] = time.split(':').map(Number);
        if (ampm === 'PM' && hours < 12) hours += 12;
        if (ampm === 'AM' && hours === 12) hours = 0;
        const scheduledDate = new Date(values.date);
        scheduledDate.setHours(hours, minutes, 0, 0);

        const counselingCollectionRef = collection(firestore, `users/${user.uid}/counselingSessions`);
        const newSessionDocRef = doc(counselingCollectionRef);

        await setDoc(newSessionDocRef, {
            id: newSessionDocRef.id,
            studentId: studentRegId,
            studentName: studentName,
            teacherId: selectedAvailability.teacherId,
            teacherName: selectedAvailability.teacherName,
            dateScheduled: scheduledDate,
            timeSlot: values.slot,
            notes: values.notes || '',
        });

        toast({
            title: 'Session Scheduled',
            description: 'Your counseling session has been successfully booked.',
        });
        scheduleForm.reset();
        setIsScheduleSheetOpen(false);
    } catch (error: any) {
        toast({
            variant: 'destructive',
            title: 'Scheduling Failed',
            description: error.message || 'An unexpected error occurred.',
        });
    }
  };


  return (
    <div className="space-y-8">
      <PageHeader
        title="Counseling Services"
        icon={HeartHandshake}
        description="Schedule and manage student counseling sessions."
      >
        <div className="flex items-center gap-2">
          {isAdmin && (
            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
              <SheetTrigger asChild>
                <Button>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Add Available Teacher
                </Button>
              </SheetTrigger>
              <SheetContent>
                <Form {...form}>
                  <form
                    onSubmit={form.handleSubmit(onSubmit)}
                    className="flex h-full flex-col"
                  >
                    <SheetHeader>
                      <SheetTitle>Add Teacher Availability</SheetTitle>
                      <SheetDescription>
                        Set the days and times a teacher is available for
                        counseling sessions.
                      </SheetDescription>
                    </SheetHeader>
                    <div className="flex-1 space-y-8 overflow-y-auto py-6 px-1">
                      <FormField
                        control={form.control}
                        name="teacherId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Teacher</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger disabled={isLoadingTeachers}>
                                  <SelectValue
                                    placeholder={
                                      isLoadingTeachers
                                        ? 'Loading teachers...'
                                        : 'Select a teacher'
                                    }
                                  />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {teachers?.map((teacher) => (
                                  <SelectItem key={teacher.id} value={teacher.id}>
                                    {teacher.firstName} {teacher.lastName}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="availableDays"
                        render={() => (
                          <FormItem>
                            <div className="mb-4">
                              <FormLabel>Available Days</FormLabel>
                              <FormDescription>
                                Select the days the teacher is available.
                              </FormDescription>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              {days.map((item) => (
                                <FormField
                                  key={item}
                                  control={form.control}
                                  name="availableDays"
                                  render={({ field }) => (
                                    <FormItem
                                      key={item}
                                      className="flex flex-row items-start space-x-3 space-y-0"
                                    >
                                      <FormControl>
                                        <Checkbox
                                          checked={field.value?.includes(item)}
                                          onCheckedChange={(checked) => {
                                            return checked
                                              ? field.onChange([
                                                  ...(field.value || []),
                                                  item,
                                                ])
                                              : field.onChange(
                                                  (field.value || [])?.filter(
                                                    (value) => value !== item
                                                  )
                                                );
                                          }}
                                        />
                                      </FormControl>
                                      <FormLabel className="font-normal">
                                        {item}
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

                      <FormField
                        control={form.control}
                        name="availableSlots"
                        render={() => (
                          <FormItem>
                            <div className="mb-4">
                              <FormLabel>Available Time Slots</FormLabel>
                              <FormDescription>
                                Select the time slots the teacher is available.
                              </FormDescription>
                            </div>
                            <div className="space-y-2">
                              {timeSlots.map((item) => (
                                <FormField
                                  key={item}
                                  control={form.control}
                                  name="availableSlots"
                                  render={({ field }) => (
                                    <FormItem
                                      key={item}
                                      className="flex flex-row items-start space-x-3 space-y-0"
                                    >
                                      <FormControl>
                                        <Checkbox
                                          checked={field.value?.includes(item)}
                                          onCheckedChange={(checked) => {
                                            return checked
                                              ? field.onChange([
                                                  ...(field.value || []),
                                                  item,
                                                ])
                                              : field.onChange(
                                                  (field.value || [])?.filter(
                                                    (value) => value !== item
                                                  )
                                                );
                                          }}
                                        />
                                      </FormControl>
                                      <FormLabel className="font-normal">
                                        {item}
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
                    </div>
                    <SheetFooter>
                      <SheetClose asChild>
                        <Button variant="outline">Cancel</Button>
                      </SheetClose>
                      <Button
                        type="submit"
                        disabled={form.formState.isSubmitting}
                      >
                        {form.formState.isSubmitting && (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        Save Availability
                      </Button>
                    </SheetFooter>
                  </form>
                </Form>
              </SheetContent>
            </Sheet>
          )}
          {isStudent && (
             <Sheet open={isScheduleSheetOpen} onOpenChange={setIsScheduleSheetOpen}>
              <SheetTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Schedule Session
                </Button>
              </SheetTrigger>
              <SheetContent className="w-full sm:max-w-md">
                 <Form {...scheduleForm}>
                  <form onSubmit={scheduleForm.handleSubmit(onScheduleSubmit)} className="flex h-full flex-col">
                    <SheetHeader>
                      <SheetTitle>Schedule a Counseling Session</SheetTitle>
                      <SheetDescription>
                        Select a counselor and a time that works for you.
                      </SheetDescription>
                    </SheetHeader>
                    <div className="flex-1 space-y-6 overflow-y-auto py-6 px-1">
                      <FormField
                        control={scheduleForm.control}
                        name="availabilityId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Counselor</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger disabled={isLoadingAvailability}>
                                  <SelectValue placeholder={isLoadingAvailability ? 'Loading counselors...' : 'Select a counselor'} />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {availableTeachers?.map((avail) => (
                                  <SelectItem key={avail.id} value={avail.id}>
                                    {avail.teacherName}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      {selectedAvailability && (
                        <FormField
                          control={scheduleForm.control}
                          name="date"
                          render={({ field }) => (
                            <FormItem className="flex flex-col">
                                <FormLabel>Date</FormLabel>
                                <Popover>
                                    <PopoverTrigger asChild>
                                    <FormControl>
                                        <Button
                                        variant={"outline"}
                                        className={cn(
                                            "w-full pl-3 text-left font-normal",
                                            !field.value && "text-muted-foreground"
                                        )}
                                        >
                                        {field.value ? (
                                            format(field.value, "PPP")
                                        ) : (
                                            <span>Pick a date</span>
                                        )}
                                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                        </Button>
                                    </FormControl>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                        mode="single"
                                        selected={field.value}
                                        onSelect={field.onChange}
                                        disabled={dateDisabledMatcher}
                                        initialFocus
                                    />
                                    </PopoverContent>
                                </Popover>
                                <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}

                       {selectedDate && (
                        <FormField
                            control={scheduleForm.control}
                            name="slot"
                            render={({ field }) => (
                            <FormItem className="space-y-3">
                                <FormLabel>Available Time Slot</FormLabel>
                                <FormControl>
                                <RadioGroup
                                    onValueChange={field.onChange}
                                    defaultValue={field.value}
                                    className="flex flex-col space-y-1"
                                >
                                    {selectedAvailability?.availableSlots.map(slot => (
                                    <FormItem key={slot} className="flex items-center space-x-3 space-y-0">
                                        <FormControl>
                                            <RadioGroupItem value={slot} />
                                        </FormControl>
                                        <FormLabel className="font-normal">
                                            {slot}
                                        </FormLabel>
                                    </FormItem>
                                    ))}
                                </RadioGroup>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                      )}
                      
                      <FormField
                          control={scheduleForm.control}
                          name="notes"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Reason for Session (Optional)</FormLabel>
                              <FormControl>
                                <Textarea
                                  placeholder="Briefly describe what you'd like to discuss..."
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                    </div>
                    <SheetFooter>
                      <SheetClose asChild>
                        <Button variant="outline">Cancel</Button>
                      </SheetClose>
                      <Button type="submit" disabled={scheduleForm.formState.isSubmitting}>
                        {scheduleForm.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Book Session
                      </Button>
                    </SheetFooter>
                  </form>
                </Form>
              </SheetContent>
            </Sheet>
          )}
        </div>
      </PageHeader>

      <Card>
        <CardHeader>
          <CardTitle>Available Counselors</CardTitle>
          <CardDescription>
            Teachers who are currently available for counseling sessions.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingAvailability ? (
            <div className="flex justify-center">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : availableTeachers && availableTeachers.length > 0 ? (
            <ul className="space-y-6">
              {availableTeachers.map((avail) => (
                <li
                  key={avail.id}
                  className="p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <h3 className="font-semibold">{avail.teacherName}</h3>
                  </div>
                  <div className="mt-2 space-y-2 text-sm">
                    <div>
                      <h4 className="font-medium text-muted-foreground">
                        Available Days
                      </h4>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {avail.availableDays.map((day) => (
                          <Badge key={day} variant="secondary">
                            {day}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium text-muted-foreground">
                        Available Slots
                      </h4>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {avail.availableSlots.map((slot) => (
                          <Badge key={slot} variant="outline">
                            {slot}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="flex items-center justify-center h-24">
              <p className="text-muted-foreground">
                No teachers have set their availability yet.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Upcoming Sessions</CardTitle>
          <CardDescription>
            Here are the counseling sessions scheduled for the upcoming days.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingSessions ? (
            <div className="flex justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>
          ) : upcomingSessions && upcomingSessions.length > 0 ? (
            <ul className="space-y-4">
            {upcomingSessions
              .sort((a, b) => a.dateScheduled.seconds - b.dateScheduled.seconds)
              .map((session) => (
                <li
                  key={session.id}
                  className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                     <Avatar>
                        <AvatarFallback>
                          {session.studentName.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                    <div>
                      <p className="font-semibold">{isStudent ? session.teacherName : session.studentName}</p>
                      <p className="text-sm text-muted-foreground">
                        {isStudent ? 'Counselor' : session.studentId}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium flex items-center gap-2">
                      <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                      {format(new Date(session.dateScheduled.seconds * 1000), 'PPP')}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {session.timeSlot}
                    </p>
                  </div>
                </li>
              ))}
          </ul>
          ) : (
             <div className="flex items-center justify-center h-24">
              <p className="text-muted-foreground">No upcoming sessions scheduled.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
