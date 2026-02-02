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
import { useDoc, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { useParams, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import type { Teacher } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';

const teacherSchema = z.object({
  firstName: z.string().min(1, { message: 'First name is required.' }),
  lastName: z.string().min(1, { message: 'Last name is required.' }),
  department: z.enum(['CS', 'SE', 'BBA'], {
    required_error: 'Please select a department.',
  }),
});

export default function EditTeacherPage() {
  const firestore = useFirestore();
  const { user, isUserLoading: isAuthLoading } = useUser();
  const { toast } = useToast();
  const router = useRouter();
  const params = useParams();
  const teacherId = params.id as string;
  
  const isAdmin = user?.email?.endsWith('@admin.com');

  const teacherRef = useMemoFirebase(
    () => (firestore && teacherId && isAdmin ? doc(firestore, 'teachers', teacherId) : null),
    [firestore, teacherId, isAdmin]
  );
  const { data: teacher, isLoading: isDocLoading } = useDoc<Teacher>(teacherRef);

  const form = useForm<z.infer<typeof teacherSchema>>({
    resolver: zodResolver(teacherSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      department: undefined,
    },
  });
  
  useEffect(() => {
    if (!isAuthLoading && !isAdmin) {
      toast({
        variant: 'destructive',
        title: 'Access Denied',
        description: 'You do not have permission to view this page.',
      });
      router.push('/teachers');
    }
  }, [isAdmin, isAuthLoading, router, toast]);

  useEffect(() => {
    if (teacher) {
      form.reset({
        firstName: teacher.firstName,
        lastName: teacher.lastName,
        department: teacher.department,
      });
    }
  }, [teacher, form]);

  const onSubmit = async (values: z.infer<typeof teacherSchema>) => {
    if (!teacherRef) return;

    try {
      await updateDoc(teacherRef, values);
      toast({
        title: 'Teacher Updated',
        description: 'The teacher record has been successfully updated.',
      });
      router.push('/teachers');
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Update Failed',
        description: error.message || 'Could not update teacher record.',
      });
    }
  };

  const isLoading = isDocLoading || isAuthLoading;

  if (isLoading) {
    return (
        <div className="space-y-8">
            <PageHeader
                title="Edit Teacher"
                icon={UserCog}
                description="Loading teacher details..."
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

  if (!teacher && !isLoading) {
     return (
        <div className="space-y-8 text-center">
            <PageHeader
                title="Teacher Not Found"
                icon={UserCog}
                description={`Could not find a teacher with ID: ${teacherId}`}
            />
             <Button onClick={() => router.push('/teachers')}>Back to Teachers</Button>
        </div>
     );
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Edit Teacher"
        icon={UserCog}
        description={`Editing record for ${teacher?.firstName} ${teacher?.lastName}`}
      />

      <Card className="max-w-2xl mx-auto">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardHeader>
              <CardTitle>Teacher Details</CardTitle>
              <CardDescription>
                Update the teacher's information below. The email address cannot be changed.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6">
               <FormItem>
                <FormLabel>Email Address</FormLabel>
                <FormControl>
                  <Input value={teacher?.email} disabled />
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
                        <Input placeholder="John" {...field} />
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
                        <Input placeholder="Doe" {...field} />
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
                Update Teacher
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  );
}
