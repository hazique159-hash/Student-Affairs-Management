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
import { useToast } from '@/hooks/use-toast';
import { useFirebase } from '@/firebase';
import {
  getAuth,
  createUserWithEmailAndPassword,
  initializeAuth,
} from 'firebase/auth';
import { setDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { doc, setDoc } from 'firebase/firestore';
import { useState } from 'react';
import { getApp, getApps, initializeApp } from 'firebase/app';
import { firebaseConfig } from '@/firebase/config';

const teacherSchema = z.object({
  firstName: z.string().min(1, { message: "First name is required." }),
  lastName: z.string().min(1, { message: "Last name is required." }),
  email: z.string().email({ message: 'Please enter a valid email address.' }),
  password: z
    .string()
    .min(6, { message: 'Password must be at least 6 characters.' }),
});

// Create a secondary Firebase app instance for creating users
const teacherApp = !getApps().find(app => app.name === 'teacherApp') 
  ? initializeApp(firebaseConfig, 'teacherApp')
  : getApp('teacherApp');

const teacherAuth = initializeAuth(teacherApp);


export default function AddTeacherPage() {
  const { firestore } = useFirebase();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const form = useForm<z.infer<typeof teacherSchema>>({
    resolver: zodResolver(teacherSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
    },
  });

  const onSubmit = async (values: z.infer<typeof teacherSchema>) => {
    setLoading(true);
    if (!firestore) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Firebase not initialized.',
      });
      setLoading(false);
      return;
    }
    
    try {
      const userCredential = await createUserWithEmailAndPassword(teacherAuth, values.email, values.password);
      const user = userCredential.user;

      if (user) {
        const teacherRef = doc(firestore, 'teachers', user.uid);
        // Using await here because we want to be sure the teacher doc is created
        await setDoc(teacherRef, {
            id: user.uid,
            firstName: values.firstName,
            lastName: values.lastName,
            email: values.email,
        });
        
        toast({
          title: 'Teacher Added',
          description: `Teacher account for ${values.email} has been created.`,
        });
        form.reset();
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Failed to Add Teacher',
        description: error.message || 'An unexpected error occurred.',
      });
    } finally {
        setLoading(false);
    }
  };
  
  return (
    <div className="space-y-8">
      <PageHeader
        title="Add New Teacher"
        icon={UserPlus}
        description="Create a new login account for a teacher."
      />

      <Card className="max-w-2xl mx-auto">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardHeader>
              <CardTitle>Teacher Details</CardTitle>
              <CardDescription>
                Provide the teacher's information and a temporary password.
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
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Address</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="teacher@example.com"
                        {...field}
                      />
                    </FormControl>
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
              <Button type="submit" disabled={loading}>
                 {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Teacher Account
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  );
}
