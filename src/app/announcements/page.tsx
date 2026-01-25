'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import { Megaphone, Plus, Loader2, X, Trash2 } from 'lucide-react';
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
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
import { collection, addDoc, serverTimestamp, doc, deleteDoc } from 'firebase/firestore';
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
  imageUrl: z.string().optional(),
});

export default function AnnouncementsPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

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
      imageUrl: '',
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
      setImagePreview(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      setIsSheetOpen(false);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Failed to Publish',
        description: error.message || 'An unexpected error occurred.',
      });
    }
  };

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { // 2MB limit
        toast({
          variant: 'destructive',
          title: 'Image too large',
          description: 'Please select an image smaller than 2MB.',
        });
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        form.setValue('imageUrl', reader.result as string);
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const clearImage = () => {
    form.setValue('imageUrl', '');
    setImagePreview(null);
    if (fileInputRef.current) {
        fileInputRef.current.value = '';
    }
  };

  const handleDelete = async (announcementId: string) => {
    if (!firestore || !isAdmin) return;
    setDeletingId(announcementId);

    try {
        await deleteDoc(doc(firestore, 'announcements', announcementId));
        toast({
            title: 'Announcement Deleted',
            description: 'The announcement has been successfully removed.',
        });
    } catch (error: any) {
        toast({
            variant: 'destructive',
            title: 'Deletion Failed',
            description: error.message || 'Could not delete the announcement.',
        });
    } finally {
        setDeletingId(null);
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
          <Sheet open={isSheetOpen} onOpenChange={(isOpen) => {
            setIsSheetOpen(isOpen);
            if (!isOpen) {
              form.reset();
              clearImage();
            }
          }}>
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
                  <div className="py-6 space-y-6 flex-1 overflow-y-auto px-1">
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
                              className="min-h-[150px]"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                     <FormField
                      control={form.control}
                      name="imageUrl"
                      render={() => (
                        <FormItem>
                          <FormLabel>Image (Optional)</FormLabel>
                          <FormControl>
                            <Input
                              type="file"
                              accept="image/*"
                              ref={fileInputRef}
                              onChange={handleImageChange}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    {imagePreview && (
                      <div className="relative">
                          <Image
                              src={imagePreview}
                              alt="Image Preview"
                              width={400}
                              height={225}
                              className="rounded-md object-cover w-full h-auto border"
                          />
                          <Button
                              type="button"
                              variant="destructive"
                              size="icon"
                              className="absolute top-2 right-2 h-7 w-7"
                              onClick={clearImage}
                          >
                              <X className="h-4 w-4" />
                          </Button>
                      </div>
                    )}
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
                   <div className="flex items-start justify-between gap-4">
                     <div>
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
                     </div>
                     {isAdmin && (
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive flex-shrink-0" disabled={deletingId === announcement.id}>
                                    {deletingId === announcement.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        This action cannot be undone. This will permanently delete the announcement titled "{announcement.title}".
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleDelete(announcement.id)} disabled={deletingId === announcement.id}>
                                        {deletingId === announcement.id && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Delete
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                     )}
                   </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {announcement.imageUrl && (
                    <div className="relative aspect-video">
                      <Image
                        src={announcement.imageUrl}
                        alt={announcement.title}
                        fill
                        className="rounded-md object-cover border"
                      />
                    </div>
                  )}
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
