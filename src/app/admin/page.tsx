'use client';
import { Shield, Loader2, KeyRound, UserRoundPen, Mail } from 'lucide-react';
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
import { useFirebase, useDoc, useMemoFirebase } from '@/firebase';
import {
  updatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential,
} from 'firebase/auth';
import { doc, setDoc, FirestoreError } from 'firebase/firestore';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { Admin } from '@/lib/types';
import { FirestorePermissionError } from '@/firebase/errors';
import { errorEmitter } from '@/firebase/error-emitter';

const updatePasswordSchema = z.object({
  currentPassword: z.string().min(1, { message: 'Current password is required.' }),
  newPassword: z
    .string()
    .min(6, { message: 'New password must be at least 6 characters.' }),
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

  const adminRef = useMemoFirebase(
    () => (firestore && user ? doc(firestore, 'roles_admin', user.uid) : null),
    [firestore, user]
  );
  const { data: adminData, isLoading: isDocLoading } = useDoc<Admin>(adminRef);

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
      currentPassword: '',
      newPassword: '',
    },
  });

  const saveEmailForm = useForm<z.infer<typeof saveEmailSchema>>({
    resolver: zodResolver(saveEmailSchema),
    defaultValues: {
      email: '',
    },
  });

  useEffect(() => {
    if (adminData?.recoveryEmail) {
      saveEmailForm.reset({
        email: adminData.recoveryEmail,
      });
    }
  }, [adminData, saveEmailForm]);

  const onPasswordSubmit = async (values: z.infer<typeof updatePasswordSchema>) => {
    setLoadingPassword(true);
    if (!user || !user.email) {
        toast({
            variant: 'destructive',
            title: 'Error',
            description: 'You must be logged in.',
        });
        setLoadingPassword(false);
        return;
    }
    
    try {
      // Re-authenticate first
      const credential = EmailAuthProvider.credential(user.email, values.currentPassword);
      await reauthenticateWithCredential(user, credential);
      
      // Then update
      await updatePassword(user, values.newPassword);
      
      toast({
        title: 'Password Updated',
        description: 'Your password has been successfully updated.',
      });
      passwordForm.reset();
    } catch (error: any) {
      let message = error.message;
      if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password') {
        message = 'The current password you entered is incorrect.';
      }
      toast({
        variant: 'destructive',
        title: 'Failed to Update Password',
        description: message || 'An unexpected error occurred.',
      });
    } finally {
      setLoadingPassword(false);
    }
  };

  const onSaveEmailSubmit = async (values: z.infer<typeof saveEmailSchema>) => {
    if (!firestore || !user) return;
    setLoadingSaveEmail(true);
    try {
      const adminRef = doc(firestore, 'roles_admin', user.uid);
      const dataToSave = {
        recoveryEmail: values.email,
        email: user.email,
        id: user.uid,
      };

      try {
        await setDoc(adminRef, dataToSave, { merge: true });
      } catch (error: any) {
        if (error.code === 'permission-denied' || (error as FirestoreError).code === 'permission-denied') {
          const contextualError = new FirestorePermissionError({
            operation: 'update',
            path: adminRef.path,
            requestResourceData: dataToSave,
          });
          errorEmitter.emit('permission-error', contextualError);
          throw contextualError;
        }
        throw error;
      }

      toast({
        title: 'Email Saved',
        description: 'Your recovery email address has been updated.',
      });
    } catch (error: any) {
      if (!(error instanceof FirestorePermissionError)) {
        toast({
          variant: 'destructive',
          title: 'Failed to Save Email',
          description: error.message || 'An unexpected error occurred.',
        });
      }
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
                  name="currentPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Current Password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="Enter current password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={passwordForm.control}
                  name="newPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>New Password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="Enter new password" {...field} />
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
                {adminData?.recoveryEmail && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted p-3 rounded-md">
                    <Mail className="h-4 w-4" />
                    <span>Currently saved: <strong>{adminData.recoveryEmail}</strong></span>
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex justify-end">
                <Button type="submit" variant="outline" disabled={loadingSaveEmail || isDocLoading}>
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
