'use client';
import { PenSquare, Loader2 } from 'lucide-react';
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
import { Textarea } from '@/components/ui/textarea';
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
import { useRouter } from 'next/navigation';

const complaintSchema = z.object({
  title: z.string().min(5, { message: 'Title must be at least 5 characters.' }),
  description: z.string().min(20, { message: 'Description must be at least 20 characters.' }),
});

export default function RegisterComplaintPage() {
  const { firestore, user } = useFirebase();
  const { toast } = useToast();
  const router = useRouter();

  const form = useForm<z.infer<typeof complaintSchema>>({
    resolver: zodResolver(complaintSchema),
    defaultValues: {
      title: '',
      description: '',
    },
  });

  const onSubmit = async (values: z.infer<typeof complaintSchema>) => {
    if (!firestore || !user) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'You must be logged in to file a complaint.',
      });
      return;
    }

    // In a real app, you'd save this to Firestore.
    // For now, we'll just show a success message.
    console.log({
        ...values,
        studentId: user.email?.split('@')[0],
        userId: user.uid,
        status: 'Open',
        dateSubmitted: new Date().toISOString()
    });

    toast({
      title: 'Complaint Submitted',
      description: 'Your complaint has been filed. You can track its status on the "My Complaints" page.',
    });
    
    router.push('/my-complaints');
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="File a New Complaint"
        icon={PenSquare}
        description="Provide details about your issue below. Please be as specific as possible."
      />

      <Card className="max-w-2xl mx-auto">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardHeader>
              <CardTitle>Complaint Form</CardTitle>
              <CardDescription>
                Your submission will be reviewed by an administrator.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Complaint Title</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Issue with Cafeteria Service" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Detailed Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Please describe the issue in detail, including dates, times, and any individuals involved..."
                        className="min-h-[150px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Submit Complaint
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  );
}

    