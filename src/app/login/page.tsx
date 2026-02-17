'use client';
import Image from 'next/image';
import { useState, useEffect } from 'react';
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
import { ShieldQuestion, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useFirebase } from '@/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { PlaceHolderImages } from '@/lib/placeholder-images';

const formSchema = z.object({
  email: z
    .string()
    .min(1, { message: 'Please enter a valid email or registration number.' }),
  password: z
    .string()
    .min(6, { message: 'Password must be at least 6 characters.' }),
});

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [isSetup, setIsSetup] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const { auth } = useFirebase();

  const loginBg = PlaceHolderImages.find((p) => p.id === 'login-background');

  useEffect(() => {
    const setupAdmin = async () => {
      try {
        await fetch('/api/setup-admin', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: 'studentaffairs316@gmail.com',
            password: 'admin1234',
          }),
        });
      } catch (error) {
        console.error('Failed to setup admin user:', error);
      } finally {
        setIsSetup(true);
      }
    };
    setupAdmin();
  }, []);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setLoading(true);
    let emailToLogin = values.email;

    // Alias admin@admin.com to the primary admin account
    if (emailToLogin === 'admin@admin.com') {
      emailToLogin = 'studentaffairs316@gmail.com';
    } else if (!values.email.includes('@')) {
      emailToLogin = `${values.email}@student.com`;
    }

    try {
      if (!auth) throw new Error('Auth service not available');
      await signInWithEmailAndPassword(auth, emailToLogin, values.password);

      const isAdmin = emailToLogin === 'studentaffairs316@gmail.com' || emailToLogin.endsWith('@admin.com');

      let role = 'User';
       if (isAdmin) {
        role = 'Admin';
      } else if (emailToLogin.endsWith('@student.com')) {
        role = 'Student';
      } else {
        role = 'Teacher';
      }

      toast({
        title: 'Login Successful',
        description: `Welcome back, ${role}!`,
      });
      
      if (isAdmin) {
        router.push('/analytics');
      } else {
        router.push('/announcements');
      }

    } catch (error: any) {
      console.error(error);
      const errorMessage = error.code === 'auth/invalid-credential' 
        ? 'Invalid email or password. Please try again.' 
        : error.message || 'An unexpected error occurred.';
      
      toast({
        variant: 'destructive',
        title: 'Login Failed',
        description: errorMessage,
      });
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
            <CardTitle className="text-2xl">AffairsConnect</CardTitle>
            <CardDescription>Login to your Account</CardDescription>
          </CardHeader>
          {!isSetup ? (
            <CardContent className="flex justify-center items-center p-10">
              <Loader2 className="h-8 w-8 animate-spin" />
            </CardContent>
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)}>
                <CardContent className="grid gap-4">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email or Registration No.</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="user@example.com or BCS223089"
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
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <Input
                            type="password"
                            placeholder="••••••••"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
                <CardFooter className="flex flex-col gap-2">
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Sign In
                  </Button>
                  <Link 
                    href="/forgot-password" 
                    className="w-full text-center text-sm font-normal text-muted-foreground hover:text-primary transition-colors mt-2"
                  >
                    Reset Password
                  </Link>
                </CardFooter>
              </form>
            </Form>
          )}
        </Card>
      </div>
    </div>
  );
}
