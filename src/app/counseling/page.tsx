'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  HeartHandshake,
  UserPlus,
  Loader2,
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

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

import type { Teacher, TeacherAvailability } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import {
  useFirebase,
  useCollection,
  useMemoFirebase,
  useUser,
} from '@/firebase';
import { collection, doc, setDoc } from 'firebase/firestore';
import { useEffect } from 'react';

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


export default function CounselingPage() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const { firestore } = useFirebase();
  const { toast } = useToast();

  const isAdmin = user?.email?.endsWith('@admin.com');
  const isStudent = user?.email?.endsWith('@student.com');

  useEffect(() => {
    if (!isUserLoading && isStudent) {
      router.push('/announcements');
    }
  }, [isUserLoading, isStudent, router]);

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


  const form = useForm<z.infer<typeof availabilitySchema>>({
    resolver: zodResolver(availabilitySchema),
    defaultValues: {
      teacherId: undefined,
      availableDays: [],
      availableSlots: [],
    },
  });

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

  if (isUserLoading || isStudent) {
    return <div className="flex items-center justify-center h-full"><Loader2 className="animate-spin" /></div>;
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Counseling Services"
        icon={HeartHandshake}
        description="Manage student counseling sessions."
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
    </div>
  );
}
