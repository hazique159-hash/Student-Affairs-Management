'use client';

import { Megaphone, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { PageHeader } from '@/components/page-header';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, addDoc } from 'firebase/firestore';
import type { Announcement } from '@/lib/types';
import { useState } from 'react';
import { useUser } from '@/firebase/provider';
import { useToast } from '@/hooks/use-toast';

export default function AnnouncementsPage() {
  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  const announcementsRef = useMemoFirebase(
    () => (firestore ? collection(firestore, 'announcements') : null),
    [firestore]
  );
  const { data: announcements, isLoading } =
    useCollection<Announcement>(announcementsRef);

  const [newAnnouncementTitle, setNewAnnouncementTitle] = useState('');
  const [newAnnouncementContent, setNewAnnouncementContent] = useState('');
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const handlePublish = async () => {
    if (!announcementsRef || !newAnnouncementTitle || !newAnnouncementContent) {
        toast({
            variant: 'destructive',
            title: 'Missing Fields',
            description: 'Please provide both a title and content for the announcement.'
        });
        return;
    }
    try {
        await addDoc(announcementsRef, {
            title: newAnnouncementTitle,
            content: newAnnouncementContent,
            datePublished: new Date().toISOString(),
        });
        toast({
            title: 'Announcement Published',
            description: 'The new announcement is now live for all users.'
        })
        setNewAnnouncementTitle('');
        setNewAnnouncementContent('');
        setIsSheetOpen(false);
    } catch(e: any) {
        toast({
            variant: 'destructive',
            title: 'Publishing Failed',
            description: e.message || 'There was an error publishing the announcement.'
        })
    }
  };

  // A simple way to check for admin without full RBAC for now
  const isAdmin = user?.email?.includes('admin');

  return (
    <div className="space-y-8">
      <PageHeader
        title="Announcements"
        icon={Megaphone}
        description="Publish and view announcements for all students."
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
              <SheetHeader>
                <SheetTitle>Create New Announcement</SheetTitle>
                <SheetDescription>
                  Fill out the form below to publish a new announcement to all
                  students.
                </SheetDescription>
              </SheetHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="title" className="text-right">
                    Title
                  </Label>
                  <Input
                    id="title"
                    placeholder="e.g., Exam Schedule Update"
                    className="col-span-3"
                    value={newAnnouncementTitle}
                    onChange={(e) => setNewAnnouncementTitle(e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-4 items-start gap-4">
                  <Label htmlFor="content" className="text-right pt-2">
                    Content
                  </Label>
                  <Textarea
                    id="content"
                    placeholder="Enter announcement details..."
                    className="col-span-3 min-h-[120px]"
                    value={newAnnouncementContent}
                    onChange={(e) => setNewAnnouncementContent(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <Button type="submit" onClick={handlePublish}>
                  Publish
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        )}
      </PageHeader>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {isLoading &&
          Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <CardTitle className="h-6 w-3/4 bg-muted animate-pulse rounded-md" />
                <CardDescription className="h-4 w-1/2 bg-muted animate-pulse rounded-md" />
              </CardHeader>
              <CardContent>
                <p className="h-16 bg-muted animate-pulse rounded-md" />
              </CardContent>
            </Card>
          ))}
        {announcements?.sort((a,b) => new Date(b.datePublished).getTime() - new Date(a.datePublished).getTime()).map((announcement) => (
          <Card
            key={announcement.id}
            className="flex flex-col transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
          >
            <CardHeader>
              <CardTitle className="font-headline">
                {announcement.title}
              </CardTitle>
              <CardDescription>
                {new Date(announcement.datePublished).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-grow">
              <p className="text-sm text-muted-foreground">
                {announcement.content}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
