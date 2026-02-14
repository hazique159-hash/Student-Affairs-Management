'use client';
import { Shield, UserPlus, Loader2, KeyRound, Mail } from 'lucide-react';
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
  updatePassword,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const updatePasswordSchema = z.object({
  newPassword: z
    .string()
    .min(6, { message: 'Password must be at least 6 characters.' }),
});

const resetPasswordSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address.' }),
});

export default function AdminPage() {
  const { auth, user, isUserLoading } = useFirebase();
  const { toast } = useToast();
  const [loadingPassword, setLoadingPassword] = useState(false);
  const [loadingReset, setLoadingReset] = useState(false);
  const router = useRouter();

  const isAdmin = user?.email?.endsWith('@admin.com');

  useEffect(() => {
    if (!isUserLoading && !isAdmin) {
      toast({
        variant: 'destructive',
        title: 'Access Denied',
        description: 'You do not have permission to view this page.',
      });
      router.push('/announcements');
    }
  }, [isAdmin, isUserLoading, router, toast]);

  const passwordForm = useForm<z.infer<typeof updatePasswordSchema>>({
    resolver: zodResolver(updatePasswordSchema),
    defaultValues: {
      newPassword: '',
    },
  });

  const resetForm = useForm<z.infer<typeof resetPasswordSchema>>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      email: '',
    },
  });

  const onPasswordSubmit = async (values: z.infer<typeof updatePasswordSchema>) => {
    setLoadingPassword(true);
    if (!user) {
        toast({
            variant: 'destructive',
            title: 'Error',
            description: 'You must be logged in.',
        });
        setLoadingPassword(false);
        return;
    }
    
    try {
      await updatePassword(user, values.newPassword);
      toast({
        title: 'Password Updated',
        description: 'Your password has been successfully updated.',
      });
      passwordForm.reset();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Failed to Update Password',
        description: error.message || 'An unexpected error occurred.',
      });
    } finally {
      setLoadingPassword(false);
    }
  };

  const onResetSubmit = async (values: z.infer<typeof resetPasswordSchema>) => {
    if (!auth) return;
    setLoadingReset(true);
    try {
      await sendPasswordResetEmail(auth, values.email);
      toast({
        title: 'Reset Email Sent',
        description: `A password reset link has been sent to ${values.email}.`,
      });
      resetForm.reset();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Failed to Send Reset Email',
        description: error.message || 'An unexpected error occurred.',
      });
    } finally {
      setLoadingReset(false);
    }
  };

  if (isUserLoading || !isAdmin) {
    return <div className="flex items-center justify-center h-full"><Loader2 className="animate-spin" /></div>;
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Admin Panel"
        icon={Shield}
        description="Manage application settings and users."
      />

      <div className="grid gap-8 max-w-2xl mx-auto">
        <Card>
          <Form {...passwordForm}>
            <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)}>
              <CardHeader>
                <CardTitle>Update Admin Password</CardTitle>
                <CardDescription>
                  Change the password for the current admin account.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-6">
                <FormField
                  control={passwordForm.control}
                  name="newPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>New Password</FormLabel>
                      <FormControl>
                        <Input type="password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
              <CardFooter className="flex justify-end">
                <Button type="submit" disabled={loadingPassword}>
                  {loadingPassword ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <KeyRound className="mr-2 h-4 w-4" />
                  )}
                  Update Password
                </Button>
              </CardFooter>
            </form>
          </Form>
        </Card>

        <Card>
          <Form {...resetForm}>
            <form onSubmit={resetForm.handleSubmit(onResetSubmit)}>
              <CardHeader>
                <CardTitle>Send Password Reset Link</CardTitle>
                <CardDescription>
                  Trigger a password reset email for any registered user (Student or Teacher).
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-6">
                <FormField
                  control={resetForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>User Email Address</FormLabel>
                      <FormControl>
                        <Input placeholder="user@example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
              <CardFooter className="flex justify-end">
                <Button type="submit" variant="outline" disabled={loadingReset}>
                  {loadingReset ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Mail className="mr-2 h-4 w-4" />
                  )}
                  Send Reset Link
                </Button>
              </CardFooter>
            </form>
          </Form>
        </Card>
      </div>
    </div>
  );
}
