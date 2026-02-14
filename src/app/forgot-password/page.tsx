
'use client';
import Image from 'next/image';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { ShieldQuestion, Loader2, ArrowLeft, MailCheck } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useFirebase } from '@/firebase';
import { sendPasswordResetEmail } from 'firebase/auth';
import { collection, query, where, getDocs, FirestoreError } from 'firebase/firestore';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { FirestorePermissionError } from '@/firebase/errors';
import { errorEmitter } from '@/firebase/error-emitter';

const forgotPasswordSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid administrator email address.' }),
});

export default function ForgotPasswordPage() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [recoveryEmail, setRecoveryEmail] = useState<string | null>(null);
  const router = useRouter();
  const { toast } = useToast();
  const { auth, firestore } = useFirebase();

  const loginBg = PlaceHolderImages.find((p) => p.id === 'login-background');

  const form = useForm<z.infer<typeof forgotPasswordSchema>>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  });

  async function onSubmit(values: z.infer<typeof forgotPasswordSchema>) {
    setLoading(true);
    let emailToReset = values.email;

    // Alias admin@admin.com to the primary admin account for consistent password management
    if (emailToReset === 'admin@admin.com') {
      emailToReset = 'studentaffairs316@gmail.com';
    }

    try {
      if (!auth || !firestore) throw new Error('Services not available');

      // 1. Look up the admin's recovery email in Firestore
      const adminQuery = query(
        collection(firestore, 'roles_admin'),
        where('email', '==', emailToReset)
      );
      
      let querySnapshot;
      try {
        querySnapshot = await getDocs(adminQuery);
      } catch (error: any) {
        if (error.code === 'permission-denied' || (error as FirestoreError).code === 'permission-denied') {
          const contextualError = new FirestorePermissionError({
            operation: 'list',
            path: 'roles_admin',
          });
          errorEmitter.emit('permission-error', contextualError);
          throw contextualError;
        }
        throw error;
      }

      let foundRecovery = null;

      if (!querySnapshot.empty) {
        const adminData = querySnapshot.docs[0].data();
        if (adminData.recoveryEmail) {
          foundRecovery = adminData.recoveryEmail;
        }
      }

      setRecoveryEmail(foundRecovery || emailToReset);

      await sendPasswordResetEmail(auth, emailToReset);
      
      setSuccess(true);
      toast({
        title: 'Reset Instructions Sent',
        description: `Check your recovery inbox at ${foundRecovery || emailToReset}.`,
      });

    } catch (error: any) {
      if (!(error instanceof FirestorePermissionError)) {
        toast({
          variant: 'destructive',
          title: 'Reset Failed',
          description: error.message || 'We could not find an account with that email.',
        });
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative min-h-screen w-full">
      {loginBg && (
        <Image
          src={loginBg.imageUrl}
          alt={loginBg.description}
          data-ai-hint={loginBg.imageHint}
          fill
          className="object-cover"
        />
      )}
      <div className="absolute inset-0 bg-black/50" />
      <div className="relative z-10 flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-sm">
          <CardHeader className="text-center">
            <div className="flex justify-center items-center mb-4">
              <ShieldQuestion className="h-10 w-10 text-primary" />
            </div>
            <CardTitle className="text-2xl">Reset Admin Access</CardTitle>
            <CardDescription>
              {success 
                ? "Reset link has been dispatched." 
                : "Enter your administrator email to receive a recovery link."}
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            {success ? (
              <div className="text-center space-y-4">
                <div className="flex justify-center">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <MailCheck className="h-6 w-6 text-primary" />
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  A password reset link has been sent to the primary admin account and your stored recovery email:
                </p>
                <p className="text-sm font-semibold text-primary break-all">
                  {recoveryEmail}
                </p>
                <p className="text-xs text-muted-foreground">
                  Please check your inbox (and spam folder) for instructions.
                </p>
              </div>
            ) : (
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Admin Email</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="admin@example.com"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Send Reset Link
                  </Button>
                </form>
              </Form>
            )}
          </CardContent>
          
          <CardFooter>
            <Button 
              variant="ghost" 
              className="w-full text-sm font-normal text-muted-foreground" 
              asChild
            >
              <Link href="/login">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Login
              </Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
