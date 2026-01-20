'use client';

import { useState } from 'react';
import { Megaphone, Plus, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
  SheetClose,
} from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useToast } from '@/hooks/use-toast';
import {
  useCollection,
  useFirestore,
  useMemoFirebase,
  useUser,
} from '@/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { PageHeader } from '@/components/page-header';
import type { Announcement } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';

// Form schema for creating an announcement
const announcementSchema = z.object({
  title: z.string().min(5, { message: 'Title must be at least 5 characters.' }),
  content: z
    .string()
    .min(20, { message: 'Content must be at least 20 characters.' }),
});

export default function AnnouncementsPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const announcementsRef = useMemoFirebase(
    () => (firestore ? collection(firestore, 'announcements') : null),
    [firestore]
  );
  const { data: announcements, isLoading } =
    useCollection<Announcement>(announcementsRef);

  const isAdmin = user?.email?.endsWith('@admin.com');

  const form = useForm<z.infer<typeof announcementSchema>>({
    resolver: zodResolver(announcementSchema),
    defaultValues: {
      title: '',
      content: '',
    },
  });

  const onSubmit = async (values: z.infer<typeof announcementSchema>) => {
    if (!firestore || !announcementsRef) return;

    try {
      await addDoc(announcementsRef, {
        ...values,
        datePublished: serverTimestamp(),
      });
      toast({
        title: 'Announcement Published',
        description: 'The announcement is now live for all users.',
      });
      form.reset();
      setIsSheetOpen(false);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Failed to Publish',
        description: error.message || 'An unexpected error occurred.',
      });
    }
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="Announcements"
        icon={Megaphone}
        description="Stay updated with the latest news and announcements from the institution."
      >
        {isAdmin && (
          <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
            <SheetTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                New Announcement
              </Button>
            </SheetTrigger>
            <SheetContent>
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="flex flex-col h-full"
                >
                  <SheetHeader>
                    <SheetTitle>Create New Announcement</SheetTitle>
                    <SheetDescription>
                      This announcement will be visible to all students and
                      teachers.
                    </SheetDescription>
                  </SheetHeader>
                  <div className="py-6 space-y-6 flex-1 overflow-y-auto">
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Title</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="e.g., Campus Holiday Notification"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="content"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Content</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Provide the full details of the announcement here..."
                              className="min-h-[200px]"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <SheetFooter>
                    <SheetClose asChild>
                      <Button variant="outline">Cancel</Button>
                    </SheetClose>
                    <Button type="submit" disabled={form.formState.isSubmitting}>
                      {form.formState.isSubmitting ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : null}
                      Publish
                    </Button>
                  </SheetFooter>
                </form>
              </Form>
            </SheetContent>
          </Sheet>
        )}
      </PageHeader>

      <div className="space-y-6">
        {isLoading &&
          Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/4 mt-2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full mt-2" />
                <Skeleton className="h-4 w-2/3 mt-2" />
              </CardContent>
            </Card>
          ))}

        {!isLoading && announcements && announcements.length > 0 ? (
          announcements
            .sort(
              (a, b) =>
                (b.datePublished as any)?.seconds -
                (a.datePublished as any)?.seconds
            )
            .map((announcement) => (
              <Card key={announcement.id}>
                <CardHeader>
                  <CardTitle>{announcement.title}</CardTitle>
                  <CardDescription>
                    Published on{' '}
                    {announcement.datePublished
                      ? format(
                          new Date(
                            (announcement.datePublished as any).seconds * 1000
                          ),
                          'PPP'
                        )
                      : '...'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="whitespace-pre-wrap">{announcement.content}</p>
                </CardContent>
              </Card>
            ))
        ) : (
          !isLoading && (
            <Card className="flex items-center justify-center h-48">
              <p className="text-muted-foreground">
                There are no announcements at this time.
              </p>
            </Card>
          )
        )}
      </div>
    </div>
  );
}
