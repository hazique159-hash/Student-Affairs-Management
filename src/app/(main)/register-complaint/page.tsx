'use client';
import { MessageSquarePlus, Loader2 } from 'lucide-react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { students as staticStudents, predefinedViolations } from '@/lib/data';
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
import { useFirestore, useUser, useCollection, useMemoFirebase } from '@/firebase';
import { collection, doc, addDoc, setDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import type { Student } from '@/lib/types';


const complaintSchema = z.object({
  studentId: z.string().min(1, { message: 'Please select a student.' }),
  violationType: z
    .string()
    .min(1, { message: 'Please select a violation type.' }),
  details: z
    .string()
    .min(10, { message: 'Please provide at least 10 characters.' }),
});

export default function RegisterComplaintPage() {
  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  const router = useRouter();
  const isAdmin = user?.email?.includes('admin');

  const studentsRef = useMemoFirebase(
    () => (firestore ? collection(firestore, 'students') : null),
    [firestore]
  );
  const { data: students, isLoading: isLoadingStudents } = useCollection<Student>(studentsRef);

  const form = useForm<z.infer<typeof complaintSchema>>({
    resolver: zodResolver(complaintSchema),
    defaultValues: {
      studentId: '',
      violationType: '',
      details: '',
    },
  });

  const onSubmit = async (values: z.infer<typeof complaintSchema>) => {
    if (!firestore || !user) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'You must be logged in to submit a complaint.',
      });
      return;
    }

    const student = students?.find((s) => s.id === values.studentId);
    if (!student) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Student not found.',
      });
      return;
    }

    const complaintData = {
      ...values,
      studentName: `${student.firstName} ${student.lastName}`,
      teacherId: user.uid,
      status: 'Pending' as 'Pending' | 'Approved' | 'Resolved',
      dateSubmitted: new Date().toISOString(),
    };

    try {
      // All users with teacher roles can write to their own subcollection
      const teacherComplaintsRef = collection(
        firestore,
        `teachers/${user.uid}/complaints`
      );
      const newComplaintDocRef = await addDoc(teacherComplaintsRef, complaintData);

      // Only admins also write to the root collection for aggregation
      if (isAdmin) {
        const rootComplaintRef = doc(firestore, 'complaints', newComplaintDocRef.id);
        await setDoc(rootComplaintRef, complaintData);
      }
      
      toast({
        title: 'Complaint Submitted',
        description: 'Your complaint has been successfully submitted.',
      });
      router.push('/complaints');

    } catch (error: any) {
      console.error('Error submitting complaint:', error);
      toast({
        variant: 'destructive',
        title: 'Submission Failed',
        description: error.message || 'Could not submit complaint.',
      });
    }
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="Register Complaint"
        icon={MessageSquarePlus}
        description="Submit a new complaint against a student."
      />

      <Card className="max-w-2xl mx-auto">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardHeader>
              <CardTitle>New Complaint Form</CardTitle>
              <CardDescription>
                Please provide all necessary details about the incident.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6">
              <FormField
                control={form.control}
                name="studentId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Student</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      disabled={isLoadingStudents}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={isLoadingStudents ? "Loading students..." : "Select a student"} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {students?.map((student) => (
                          <SelectItem key={student.id} value={student.id}>
                            {student.firstName} {student.lastName} ({student.id})
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
                name="violationType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Violation Type</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a violation" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {predefinedViolations.map((violation) => (
                          <SelectItem
                            key={violation}
                            value={violation}
                          >
                            {violation}
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
                name="details"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Details</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Provide specific details about the incident..."
                        className="min-h-[120px]"
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
                 {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Submit Complaint
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  );
}
