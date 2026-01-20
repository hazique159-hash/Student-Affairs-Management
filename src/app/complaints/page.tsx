'use client';
import { MessageSquareWarning, Loader2 } from 'lucide-react';
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
import type { Complaint } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { collection, query, orderBy, writeBatch, doc, getDocs, where } from 'firebase/firestore';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

export default function ComplaintsPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const complaintsRef = useMemoFirebase(
    () =>
      firestore
        ? query(collection(firestore, 'complaints'), orderBy('dateSubmitted', 'desc'))
        : null,
    [firestore]
  );
  const { data: complaints, isLoading: isLoadingComplaints } = useCollection<Complaint>(complaintsRef);

  const isLoading = isUserLoading || isLoadingComplaints;

  const isAdmin = user?.email?.endsWith('@admin.com');

  useEffect(() => {
    if (!isUserLoading && !isAdmin) {
      router.push('/announcements');
    }
  }, [isUserLoading, user, isAdmin, router]);

  const handleStatusUpdate = async (complaint: Complaint, newStatus: 'Approved' | 'Rejected') => {
    if (!firestore || !isAdmin) return;
    setUpdatingId(complaint.id);

    try {
        const batch = writeBatch(firestore);

        // 1. Update the master complaint in /complaints
        const masterComplaintRef = doc(firestore, 'complaints', complaint.id);
        batch.update(masterComplaintRef, { status: newStatus });

        // 2. Update the filer's copy in /users/{filedById}/complaints
        const filerComplaintRef = doc(firestore, `users/${complaint.filedById}/complaints`, complaint.id);
        batch.update(filerComplaintRef, { status: newStatus });
        
        // 3. If approved, create a copy for the student
        if (newStatus === 'Approved') {
            const studentUserQuery = query(collection(firestore, 'users'), where('studentId', '==', complaint.studentId));
            const studentUserSnapshot = await getDocs(studentUserQuery);
            if (!studentUserSnapshot.empty) {
                const studentUserDoc = studentUserSnapshot.docs[0];
                const studentComplaintRef = doc(firestore, `users/${studentUserDoc.id}/complaints`, complaint.id);
                batch.set(studentComplaintRef, {
                    ...complaint,
                    status: newStatus,
                    dateSubmitted: complaint.dateSubmitted,
                });
            } else {
                console.warn(`Could not find user account for student ID: ${complaint.studentId}. Complaint will not be visible to student.`);
            }
        }

        await batch.commit();
        toast({
            title: `Complaint ${newStatus}`,
            description: `The complaint against ${complaint.studentName} has been ${newStatus.toLowerCase()}.`
        });

    } catch (error: any) {
        toast({
            variant: 'destructive',
            title: 'Update Failed',
            description: error.message || 'Could not update the complaint status.'
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
        title="Student Complaints"
        icon={MessageSquareWarning}
        description="Review and manage all submitted student complaints."
      />

      <Card>
        <CardHeader>
          <CardTitle>Complaint Inbox</CardTitle>
          <CardDescription>
            All active and resolved complaints are listed below.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Student ID</TableHead>
                <TableHead>Student Name</TableHead>
                <TableHead>Filed By</TableHead>
                <TableHead>Title</TableHead>
                <TableHead className="text-right">Status / Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading &&
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-48" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-8 w-40 ml-auto" /></TableCell>
                  </TableRow>
                ))}
              {!isLoading && complaints && complaints.length > 0 ? (
                complaints.map((complaint) => (
                  <TableRow key={complaint.id}>
                    <TableCell>{complaint.dateSubmitted?.seconds ? format(new Date(complaint.dateSubmitted.seconds * 1000), 'PPP') : 'N/A'}</TableCell>
                    <TableCell>{complaint.studentId}</TableCell>
                    <TableCell>{complaint.studentName}</TableCell>
                    <TableCell>{complaint.filedByName}</TableCell>
                    <TableCell>{complaint.title}</TableCell>
                    <TableCell className="text-right">
                       {isAdmin && (complaint.status === 'Pending' || complaint.status === 'Open') ? (
                          <div className="flex gap-2 justify-end">
                              <Button size="sm" onClick={() => handleStatusUpdate(complaint, 'Approved')} disabled={updatingId === complaint.id}>
                                 {updatingId === complaint.id ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Approve'}
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => handleStatusUpdate(complaint, 'Rejected')} disabled={updatingId === complaint.id}>
                                 Reject
                              </Button>
                          </div>
                        ) : (
                          <Badge
                            variant={
                              complaint.status === 'Rejected' || complaint.status === 'Resolved'
                                ? 'secondary'
                                : complaint.status === 'Approved'
                                ? 'default'
                                : 'destructive'
                            }
                          >
                            {complaint.status}
                          </Badge>
                        )}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                !isLoading && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center h-24">
                      There are no complaints at this time.
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
