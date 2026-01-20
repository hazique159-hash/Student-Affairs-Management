'use client';
import { UserPlus, Loader2 } from 'lucide-react';
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
import { useFirebase } from '@/firebase';
import {
  getAuth,
  createUserWithEmailAndPassword,
} from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { initializeApp, deleteApp } from 'firebase/app';
import { firebaseConfig } from '@/firebase/config';

const studentSchema = z.object({
  firstName: z.string().min(1, { message: 'First name is required.' }),
  lastName: z.string().min(1, { message: 'Last name is required.' }),
  registrationNumber: z
    .string()
    .min(1, { message: 'Registration number is required.' }),
  department: z.enum(['CS', 'SE', 'BBA'], {
    required_error: 'Please select a department.',
  }),
  password: z
    .string()
    .min(6, { message: 'Password must be at least 6 characters.' }),
});

export default function AddStudentPage() {
  const { firestore } = useFirebase();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof studentSchema>>({
    resolver: zodResolver(studentSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      registrationNumber: '',
      department: undefined,
      password: '',
    },
  });

  const onSubmit = async (values: z.infer<typeof studentSchema>) => {
    if (!firestore) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Firebase not initialized.',
      });
      return;
    }

    const studentEmail = `${values.registrationNumber}@student.com`;
    
    // Create a temporary, secondary Firebase app for user creation.
    const tempAppName = `temp-user-creation-${Date.now()}`;
    const tempApp = initializeApp(firebaseConfig, tempAppName);
    const tempAuth = getAuth(tempApp);

    try {
      const userCredential = await createUserWithEmailAndPassword(
        tempAuth,
        studentEmail,
        values.password
      );
      const user = userCredential.user;

      if (user) {
        // Use the student's registration number as the document ID for simplicity and uniqueness.
        const studentRef = doc(firestore, 'students', values.registrationNumber);
        await setDoc(studentRef, {
          id: values.registrationNumber,
          registrationNumber: values.registrationNumber,
          firstName: values.firstName,
          lastName: values.lastName,
          department: values.department,
          parentEmail: '',
          parentPhoneNumber: '',
        });
        
        // Also create a user document in the `users` collection for fines/counseling etc.
        const userRef = doc(firestore, 'users', user.uid);
        await setDoc(userRef, {
          studentId: values.registrationNumber,
          email: studentEmail
        });

        toast({
          title: 'Student Added',
          description: `Student account for ${values.registrationNumber} has been created.`,
        });
        form.reset();
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Failed to Add Student',
        description: error.message || 'An unexpected error occurred.',
      });
    } finally {
        // Clean up the temporary app instance.
        await deleteApp(tempApp);
    }
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="Add New Student"
        icon={UserPlus}
        description="Create a new login account for a student."
      />

      <Card className="max-w-2xl mx-auto">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardHeader>
              <CardTitle>Student Details</CardTitle>
              <CardDescription>
                Provide the student's information and a temporary password.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6">
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
                name="registrationNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Registration Number</FormLabel>
                    <FormControl>
                      <Input placeholder="BCS223089" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                  control={form.control}
                  name="department"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Department</FormLabel>
                       <Select onValueChange={field.onChange} defaultValue={field.value}>
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
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Temporary Password</FormLabel>
                    <FormControl>
                      <Input type="password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Student Account
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  );
}

    