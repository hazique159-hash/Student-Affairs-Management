'use client';
import { UserCog, Loader2 } from 'lucide-react';
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
import { useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { useParams, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import type { Student } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';

const studentSchema = z.object({
  firstName: z.string().min(1, { message: 'First name is required.' }),
  lastName: z.string().min(1, { message: 'Last name is required.' }),
  department: z.enum(['CS', 'SE', 'BBA'], {
    required_error: 'Please select a department.',
  }),
});

export default function EditStudentPage() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const router = useRouter();
  const params = useParams();
  const studentId = params.id as string;

  const studentRef = useMemoFirebase(
    () => (firestore && studentId ? doc(firestore, 'students', studentId) : null),
    [firestore, studentId]
  );
  const { data: student, isLoading } = useDoc<Student>(studentRef);

  const form = useForm<z.infer<typeof studentSchema>>({
    resolver: zodResolver(studentSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      department: undefined,
    },
  });

  useEffect(() => {
    if (student) {
      form.reset({
        firstName: student.firstName,
        lastName: student.lastName,
        department: student.department,
      });
    }
  }, [student, form]);

  const onSubmit = async (values: z.infer<typeof studentSchema>) => {
    if (!studentRef) return;

    try {
      await updateDoc(studentRef, values);
      toast({
        title: 'Student Updated',
        description: 'The student record has been successfully updated.',
      });
      router.push('/students');
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Update Failed',
        description: error.message || 'Could not update student record.',
      });
    }
  };

  if (isLoading) {
    return (
        <div className="space-y-8">
            <PageHeader
                title="Edit Student"
                icon={UserCog}
                description="Loading student details..."
            />
            <Card className="max-w-2xl mx-auto">
                <CardHeader>
                    <Skeleton className="h-8 w-48" />
                    <Skeleton className="h-4 w-64" />
                </CardHeader>
                <CardContent className="grid gap-6">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                </CardContent>
                <CardFooter className="flex justify-end">
                    <Skeleton className="h-10 w-32" />
                </CardFooter>
            </Card>
        </div>
    );
  }

  if (!student && !isLoading) {
     return (
        <div className="space-y-8 text-center">
            <PageHeader
                title="Student Not Found"
                icon={UserCog}
                description={`Could not find a student with ID: ${studentId}`}
            />
             <Button onClick={() => router.push('/students')}>Back to Students</Button>
        </div>
     );
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Edit Student"
        icon={UserCog}
        description={`Editing record for ${student?.firstName} ${student?.lastName} (${student?.id})`}
      />

      <Card className="max-w-2xl mx-auto">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardHeader>
              <CardTitle>Student Details</CardTitle>
              <CardDescription>
                Update the student's information below. The registration number cannot be changed.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6">
               <FormItem>
                <FormLabel>Registration Number</FormLabel>
                <FormControl>
                  <Input value={studentId} disabled />
                </FormControl>
              </FormItem>
              <div className="grid md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Muhammad" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Haziq" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
               <FormField
                  control={form.control}
                  name="department"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Department</FormLabel>
                       <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a department" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="CS">Computer Science (CS)</SelectItem>
                          <SelectItem value="SE">Software Engineering (SE)</SelectItem>
                          <SelectItem value="BBA">Business Administration (BBA)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Update Student
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  );
}

    