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
import { useToast } from '@/hooks/use-toast';
import { useFirebase } from '@/firebase';
import {
  getAuth,
  createUserWithEmailAndPassword,
} from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { initializeApp, deleteApp } from 'firebase/app';
import { firebaseConfig } from '@/firebase/config';

const DEPARTMENTS = [
  'Computer Science',
  'Software Engineering',
  'Mathematics',
  'Electrical Engineering',
  'Mechanical Engineering',
  'Civil Engineering',
  'Management Sciences',
  'Accounting & Finance',
  'Psychology',
  'English',
  'Bioinformatics & Biosciences',
  'Pharmacy',
  'Law',
] as const;

const studentSchema = z.object({
  firstName: z.string().min(1, { message: 'First name is required.' }),
  lastName: z.string().min(1, { message: 'Last name is required.' }),
  registrationNumber: z
    .string()
    .min(1, { message: 'Registration number is required.' })
    .regex(/^[A-Z]{3}[0-9]{1,6}$/, { 
      message: 'Registration ID must start with 3 capital letters followed by up to 6 digits (e.g., BCS223089).' 
    }),
  email: z.string().email({ message: 'Please enter a valid personal or institutional email.' }),
  phoneNumber: z.string().min(10, { message: 'Phone number must be at least 10 digits.' }),
  department: z.enum(DEPARTMENTS, {
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
      email: '',
      phoneNumber: '',
      department: undefined,
      password: '',
    },
  });

  const onSubmit = async (values: z.infer<typeof studentSchema>) => {
    if (!firestore) return;

    const tempAppName = `temp-user-creation-${Date.now()}`;
    const tempApp = initializeApp(firebaseConfig, tempAppName);
    const tempAuth = getAuth(tempApp);

    try {
      const userCredential = await createUserWithEmailAndPassword(
        tempAuth,
        values.email,
        values.password
      );
      const user = userCredential.user;

      if (user) {
        const regId = values.registrationNumber.toUpperCase();
        const studentRef = doc(firestore, 'students', regId);
        
        await setDoc(studentRef, {
          id: regId,
          registrationNumber: regId,
          firstName: values.firstName,
          lastName: values.lastName,
          email: values.email,
          phoneNumber: values.phoneNumber,
          department: values.department,
          complaintCount: 0,
        });
        
        const userRef = doc(firestore, 'users', user.uid);
        await setDoc(userRef, {
          studentId: regId,
          email: values.email
        });

        toast({
          title: 'Student Created',
          description: `${values.firstName} can now log in with ${values.email}.`,
        });
        form.reset();
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Creation Failed',
        description: error.message || 'An unexpected error occurred.',
      });
    } finally {
        await deleteApp(tempApp);
    }
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="Add Student"
        icon={UserPlus}
        description="Register a new student and set their login credentials."
      />

      <Card className="max-w-2xl mx-auto">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardHeader>
              <CardTitle>Enrollment Details</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-6">
              <div className="grid md:grid-cols-2 gap-4">
                <FormField control={form.control} name="firstName" render={({ field }) => (
                    <FormItem><FormLabel>First Name</FormLabel><FormControl><Input placeholder="Muhammad" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="lastName" render={({ field }) => (
                    <FormItem><FormLabel>Last Name</FormLabel><FormControl><Input placeholder="Ali" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <FormField control={form.control} name="registrationNumber" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Registration ID</FormLabel>
                        <FormControl><Input placeholder="BCS223089" {...field} /></FormControl>
                        <FormDescription>Must start with 3 capital letters and up to 6 numbers.</FormDescription>
                        <FormMessage />
                    </FormItem>
                )} />
                <FormField control={form.control} name="email" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Login Email</FormLabel>
                        <FormControl><Input type="email" placeholder="student@gmail.com" {...field} /></FormControl>
                        <FormDescription>Real email required for notifications.</FormDescription>
                        <FormMessage />
                    </FormItem>
                )} />
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <FormField control={form.control} name="phoneNumber" render={({ field }) => (
                    <FormItem><FormLabel>Phone No.</FormLabel><FormControl><Input placeholder="03123456789" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="department" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Department</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl><SelectTrigger><SelectValue placeholder="Select Department" /></SelectTrigger></FormControl>
                            <SelectContent>{DEPARTMENTS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                )} />
              </div>
              <FormField control={form.control} name="password" render={({ field }) => (
                  <FormItem><FormLabel>Login Password</FormLabel><FormControl><Input type="password" {...field} /></FormControl><FormDescription>At least 6 characters.</FormDescription><FormMessage /></FormItem>
              )} />
            </CardContent>
            <CardFooter className="flex justify-end gap-2">
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
