'use client';
import { MessageSquarePlus } from 'lucide-react';
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
import { predefinedViolations, students } from '@/lib/data';
import { useForm, Controller } from 'react-hook-form';
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
import { useFirestore, useUser } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import { addDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { setDoc } from 'firebase/firestore';

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

    const student = students.find((s) => s.id === values.studentId);
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
      studentName: student.name,
      teacherId: user.uid,
      status: 'Pending',
      dateSubmitted: new Date().toISOString(),
    };

    try {
      const teacherComplaintsRef = collection(
        firestore,
        `teachers/${user.uid}/complaints`
      );
      const newComplaintDoc = await addDocumentNonBlocking(teacherComplaintsRef, complaintData);

      if (newComplaintDoc) {
         // Also add to a root 'complaints' collection for admin view.
         // This is a denormalization step.
        const rootComplaintRef = doc(firestore, 'complaints', newComplaintDoc.id);
        await setDoc(rootComplaintRef, complaintData);
      }
      
      toast({
        title: 'Complaint Submitted',
        description: 'Your complaint has been successfully submitted.',
      });
      router.push('/complaints');
    } catch (error: any) {
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
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a student" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {students.map((student) => (
                          <SelectItem key={student.id} value={student.id}>
                            {student.name} ({student.id})
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
                Submit Complaint
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  );
}
