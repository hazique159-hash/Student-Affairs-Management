
'use client';
import { Shield, Loader2, KeyRound, UserRoundPen } from 'lucide-react';
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
} from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const updatePasswordSchema = z.object({
  newPassword: z
    .string()
    .min(6, { message: 'Password must be at least 6 characters.' }),
});

const saveEmailSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address.' }),
});

export default function AdminPage() {
  const { auth, user, firestore, isUserLoading } = useFirebase();
  const { toast } = useToast();
  const [loadingPassword, setLoadingPassword] = useState(false);
  const [loadingSaveEmail, setLoadingSaveEmail] = useState(false);
  const router = useRouter();

  const isAdmin = user?.email === 'studentaffairs316@gmail.com' || user?.email?.endsWith('@admin.com');

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

  const saveEmailForm = useForm<z.infer<typeof saveEmailSchema>>({
    resolver: zodResolver(saveEmailSchema),
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

  const onSaveEmailSubmit = async (values: z.infer<typeof saveEmailSchema>) => {
    if (!firestore || !user) return;
    setLoadingSaveEmail(true);
    try {
      // Update the admin's own document in roles_admin
      const adminRef = doc(firestore, 'roles_admin', user.uid);
      await setDoc(adminRef, {
        recoveryEmail: values.email,
        email: user.email,
        id: user.uid,
      }, { merge: true });

      toast({
        title: 'Email Saved',
        description: 'Your recovery email address has been updated.',
      });
      saveEmailForm.reset();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Failed to Save Email',
        description: error.message || 'An unexpected error occurred.',
      });
    } finally {
      setLoadingSaveEmail(false);
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
        description="Manage your account settings and recovery options."
      />

      <div className="grid gap-8 max-w-2xl mx-auto">
        <Card>
          <Form {...passwordForm}>
            <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)}>
              <CardHeader>
                <CardTitle>Update Password</CardTitle>
                <CardDescription>
                  Change the password for your administrator account.
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
          <Form {...saveEmailForm}>
            <form onSubmit={saveEmailForm.handleSubmit(onSaveEmailSubmit)}>
              <CardHeader>
                <CardTitle>Recovery Email</CardTitle>
                <CardDescription>
                  Set an email address to be used for future password recovery.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-6">
                <FormField
                  control={saveEmailForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Recovery Email Address</FormLabel>
                      <FormControl>
                        <Input placeholder="admin.recovery@example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
              <CardFooter className="flex justify-end">
                <Button type="submit" variant="outline" disabled={loadingSaveEmail}>
                  {loadingSaveEmail ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <UserRoundPen className="mr-2 h-4 w-4" />
                  )}
                  Save Recovery Email
                </Button>
              </CardFooter>
            </form>
          </Form>
        </Card>
      </div>
    </div>
  );
}
