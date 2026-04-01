
'use client';
import { ClipboardList, Loader2, Phone, Briefcase, MessageSquare } from 'lucide-react';
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

  const isAdmin = user?.email === 'studentaffairs316@gmail.com' || user?.email?.endsWith('@admin.com');
  
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
    <div className="space-y-8 pb-10">
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
        <CardContent className="px-0 sm:px-6">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[150px]">Student Info</TableHead>
                  <TableHead className="min-w-[120px]">Event</TableHead>
                  <TableHead className="min-w-[100px]">Applied On</TableHead>
                  <TableHead className="min-w-[200px]">Reason</TableHead>
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
                        <div className="space-y-1">
                            <div className="font-bold text-sm">{app.studentName}</div>
                            <div className="flex gap-2 items-center">
                              <div className="text-[10px] text-muted-foreground uppercase font-mono">{app.studentId}</div>
                              {app.semester && <Badge variant="secondary" className="text-[8px] h-3 px-1">{app.semester} Sem</Badge>}
                            </div>
                            <div className="flex flex-col gap-1 mt-1">
                                {app.department && (
                                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                                        <Briefcase className="h-3 w-3" />
                                        {app.department}
                                    </div>
                                )}
                                {app.whatsappNumber && (
                                    <div className="flex items-center gap-1 text-[10px] text-primary font-medium">
                                        <MessageSquare className="h-3 w-3" />
                                        {app.whatsappNumber}
                                    </div>
                                )}
                                {app.phoneNumber && !app.whatsappNumber && (
                                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                                        <Phone className="h-3 w-3" />
                                        {app.phoneNumber}
                                    </div>
                                )}
                            </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">{app.eventName}</TableCell>
                      <TableCell className="text-xs">
                          {app.dateApplied?.seconds ? format(new Date(app.dateApplied.seconds * 1000), 'MMM d, yyyy') : 'N/A'}
                      </TableCell>
                      <TableCell className="max-w-[250px] text-xs leading-relaxed italic text-muted-foreground">
                          {app.reason}
                      </TableCell>
                      <TableCell>
                          <Badge
                              className="text-[10px]"
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
                         <div className="flex items-center justify-end gap-1">
                          {app.status === 'Pending' && isAdmin && (
                              <>
                                  <Button size="sm" className="h-7 px-3 text-[10px]" onClick={() => handleStatusUpdate(app, 'Approved')} disabled={updatingId === app.id}>
                                     {updatingId === app.id ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Approve'}
                                  </Button>
                                  <Button size="sm" variant="outline" className="h-7 px-3 text-[10px]" onClick={() => handleStatusUpdate(app, 'Rejected')} disabled={updatingId === app.id}>
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
                      <TableCell colSpan={6} className="text-center h-32 text-muted-foreground italic">
                        No applications found.
                      </TableCell>
                    </TableRow>
                  )
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
