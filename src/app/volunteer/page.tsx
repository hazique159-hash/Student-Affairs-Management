
'use client';
import { HandHeart, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { PageHeader } from '@/components/page-header';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Form,
  FormControl,
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
import { useToast } from '@/hooks/use-toast';
import { useFirebase } from '@/firebase';
import { useRouter } from 'next/navigation';
import {
  collection,
  writeBatch,
  doc,
  getDoc,
  serverTimestamp,
} from 'firebase/firestore';
import type { Student } from '@/lib/types';
import { useEffect } from 'react';

const SEMESTERS = ['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th'];

const volunteerSchema = z.object({
  eventName: z.string().min(3, { message: 'Event name must be at least 3 characters.' }),
  reason: z
    .string()
    .min(20, { message: 'Reason must be at least 20 characters.' }),
  whatsappNumber: z.string().min(10, { message: 'WhatsApp number must be at least 10 digits.' }),
  semester: z.string().min(1, { message: 'Please select your semester.' }),
});

export default function VolunteerPage() {
  const { firestore, user, isUserLoading } = useFirebase();
  const { toast } = useToast();
  const router = useRouter();

  const isStudent = user?.email?.endsWith('@student.com');

  useEffect(() => {
    if (!isUserLoading && !isStudent) {
      toast({
        variant: 'destructive',
        title: 'Access Denied',
        description: 'You must be a student to volunteer.',
      });
      router.push('/announcements');
    }
  }, [isUserLoading, isStudent, router, toast]);

  const form = useForm<z.infer<typeof volunteerSchema>>({
    resolver: zodResolver(volunteerSchema),
    defaultValues: {
      eventName: '',
      reason: '',
      whatsappNumber: '',
      semester: '',
    },
  });

  const onSubmit = async (values: z.infer<typeof volunteerSchema>) => {
    if (!firestore || !user || !isStudent) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'You must be logged in as a student to apply.',
      });
      return;
    }

    try {
      const batch = writeBatch(firestore);
      const applicationId = doc(collection(firestore, 'id_generator')).id;

      const studentRegId = user.email!.split('@')[0].toUpperCase();
      const studentDocRef = doc(firestore, 'students', studentRegId);
      const studentDoc = await getDoc(studentDocRef);
      
      let studentName = 'Student';
      let studentDept = '';
      let studentPhone = '';

      if (studentDoc.exists()) {
        const studentData = studentDoc.data() as Student;
        studentName = `${studentData.firstName} ${studentData.lastName}`;
        studentDept = studentData.department || '';
        studentPhone = studentData.phoneNumber || '';
      }

      const applicationData = {
        id: applicationId,
        eventName: values.eventName,
        reason: values.reason,
        whatsappNumber: values.whatsappNumber,
        semester: values.semester,
        studentId: studentRegId,
        studentName: studentName,
        department: studentDept,
        phoneNumber: studentPhone,
        status: 'Pending' as const,
        dateApplied: serverTimestamp(),
      };

      // 1. Write to the global collection for admin review
      const globalAppRef = doc(firestore, 'volunteerApplications', applicationId);
      batch.set(globalAppRef, applicationData);

      // 2. Write to the student's own subcollection for their history
      const userAppRef = doc(firestore, `users/${user.uid}/volunteerApplications`, applicationId);
      batch.set(userAppRef, applicationData);

      await batch.commit();

      toast({
        title: 'Application Submitted',
        description: 'Your volunteer application has been submitted for review.',
      });

      router.push('/announcements');
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Submission Failed',
        description: error.message || 'An unexpected error occurred.',
      });
    }
  };
  
  if (isUserLoading || !isStudent) {
    return <div className="flex items-center justify-center h-full"><Loader2 className="animate-spin" /></div>;
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Volunteer Application"
        icon={HandHeart}
        description="Apply to be a volunteer for an upcoming event."
      />

      <Card className="max-w-2xl mx-auto">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardHeader>
              <CardTitle>Volunteer Form</CardTitle>
              <CardDescription>
                Your submission will be reviewed by an administrator.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6">
              <FormField
                control={form.control}
                name="eventName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Event Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., Annual Sports Gala"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="whatsappNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>WhatsApp No.</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="03XXXXXXXXX"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="semester"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Semester</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select Semester" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {SEMESTERS.map((sem) => (
                            <SelectItem key={sem} value={sem}>
                              {sem} Semester
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="reason"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reason for Volunteering</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Tell us why you want to volunteer for this event..."
                        className="min-h-[150px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Submit Application
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  );
}
