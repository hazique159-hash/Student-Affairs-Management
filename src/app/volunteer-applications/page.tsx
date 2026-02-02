'use client';
import { ClipboardList, Loader2 } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { PageHeader } from '@/components/page-header';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useUser, useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import type { VolunteerApplication } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { collection, query, orderBy, writeBatch, doc, getDocs, where } from 'firebase/firestore';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

export default function VolunteerApplicationsPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const applicationsRef = useMemoFirebase(
    () =>
      firestore
        ? query(collection(firestore, 'volunteerApplications'), orderBy('dateApplied', 'desc'))
        : null,
    [firestore]
  );
  const { data: applications, isLoading: isLoadingApplications } = useCollection<VolunteerApplication>(applicationsRef);

  const isLoading = isUserLoading || isLoadingApplications;

  const isAdmin = user?.email?.endsWith('@admin.com');
  
  useEffect(() => {
    if (!isUserLoading && !isAdmin) {
      router.push('/announcements');
    }
  }, [isUserLoading, user, isAdmin, router]);

  const handleStatusUpdate = async (application: VolunteerApplication, newStatus: 'Approved' | 'Rejected') => {
    if (!firestore || !isAdmin) return;
    setUpdatingId(application.id);

    try {
        const batch = writeBatch(firestore);

        // 1. Update master application
        const masterAppRef = doc(firestore, 'volunteerApplications', application.id);
        batch.update(masterAppRef, { status: newStatus });

        // 2. Find student's user account to update their personal copy
        const studentUserQuery = query(collection(firestore, 'users'), where('studentId', '==', application.studentId));
        const studentUserSnapshot = await getDocs(studentUserQuery);

        if (!studentUserSnapshot.empty) {
            const studentUserDoc = studentUserSnapshot.docs[0];
            const studentAppRef = doc(firestore, `users/${studentUserDoc.id}/volunteerApplications`, application.id);
            batch.update(studentAppRef, { status: newStatus });
        } else {
            console.warn(`Could not find user account for student ID: ${application.studentId}.`);
        }
        
        await batch.commit();
        toast({
            title: `Application ${newStatus}`,
            description: `The application has been marked as ${newStatus.toLowerCase()}.`
        });

    } catch (error: any) {
        toast({
            variant: 'destructive',
            title: 'Update Failed',
            description: error.message || 'Could not update the application status.'
        });
    } finally {
        setUpdatingId(null);
    }
  };


  if (isLoading || !isAdmin) {
    return <div className="flex items-center justify-center h-full"><Loader2 className="animate-spin" /></div>;
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Volunteer Applications"
        icon={ClipboardList}
        description="Review and manage all student volunteer applications."
      />

      <Card>
        <CardHeader>
          <CardTitle>All Applications</CardTitle>
          <CardDescription>
            Approve or reject applications from students for various events.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Event</TableHead>
                <TableHead>Date Applied</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading &&
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-40" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-8 w-40 ml-auto" /></TableCell>
                  </TableRow>
                ))}
              {!isLoading && applications && applications.length > 0 ? (
                applications.map((app) => (
                  <TableRow key={app.id}>
                    <TableCell>
                      <div className="font-medium">{app.studentName}</div>
                      <div className="text-sm text-muted-foreground">{app.studentId}</div>
                    </TableCell>
                    <TableCell>{app.eventName}</TableCell>
                    <TableCell>{app.dateApplied?.seconds ? format(new Date(app.dateApplied.seconds * 1000), 'PPP') : 'N/A'}</TableCell>
                    <TableCell className="max-w-xs truncate">{app.reason}</TableCell>
                    <TableCell>
                        <Badge
                            variant={
                            app.status === 'Rejected'
                                ? 'destructive'
                                : app.status === 'Approved'
                                ? 'default'
                                : 'outline'
                            }
                        >
                            {app.status}
                        </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                       <div className="flex items-center justify-end gap-2">
                        {app.status === 'Pending' && isAdmin && (
                            <>
                                <Button size="sm" onClick={() => handleStatusUpdate(app, 'Approved')} disabled={updatingId === app.id}>
                                   {updatingId === app.id ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Approve'}
                                </Button>
                                <Button size="sm" variant="outline" onClick={() => handleStatusUpdate(app, 'Rejected')} disabled={updatingId === app.id}>
                                   Reject
                                </Button>
                            </>
                          )}
                       </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                !isLoading && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center h-24">
                      There are no volunteer applications at this time.
                    </TableCell>
                  </TableRow>
                )
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
