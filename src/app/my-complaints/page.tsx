'use client';
import { MessageSquareHeart, Plus, Loader2, CircleDollarSign } from 'lucide-react';
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
import { Button } from '@/components/ui/button';
import { collection, query, orderBy, doc, writeBatch } from 'firebase/firestore';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

export default function MyComplaintsPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  const [payingId, setPayingId] = useState<string | null>(null);

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [isUserLoading, user, router]);

  const complaintsRef = useMemoFirebase(
    () =>
      firestore && user
        ? query(collection(firestore, `users/${user.uid}/complaints`), orderBy('dateSubmitted', 'desc'))
        : null,
    [firestore, user]
  );
  const { data: complaints, isLoading: isLoadingComplaints } = useCollection<Complaint>(complaintsRef);

  const handlePayFine = async (complaint: Complaint) => {
    if (!firestore || !user) return;
    setPayingId(complaint.id);

    try {
        const batch = writeBatch(firestore);
        
        // 1. Update personal complaint status
        const personalRef = doc(firestore, `users/${user.uid}/complaints`, complaint.id);
        batch.update(personalRef, { status: 'Resolved' });
        
        // 2. Update master complaint status
        const masterRef = doc(firestore, 'complaints', complaint.id);
        batch.update(masterRef, { status: 'Resolved' });

        // 3. Update filer's record if they are not system
        if (complaint.filedById && complaint.filedById !== 'system') {
            const filerComplaintRef = doc(firestore, `users/${complaint.filedById}/complaints`, complaint.id);
            batch.update(filerComplaintRef, { status: 'Resolved' });
        }

        await batch.commit();
        toast({
            title: 'Fine Paid Successfully',
            description: 'The complaint has been marked as resolved.',
        });
    } catch (error: any) {
        toast({
            variant: 'destructive',
            title: 'Payment Failed',
            description: error.message || 'Could not process the fine payment.',
        });
    } finally {
        setPayingId(null);
    }
  };

  const isLoading = isUserLoading || isLoadingComplaints;
  const isStudent = user?.email?.endsWith('@student.com');
  const isTeacher = user?.email && !user.email.endsWith('@student.com') && !user.email.endsWith('@admin.com');

  const pageTitle = isStudent ? "Complaint Records" : "My Complaints";
  const pageDescription = isStudent
    ? "A record of all complaints filed against you."
    : "A record of all complaints you have filed.";

  return (
    <div className="space-y-8">
      <PageHeader
        title={pageTitle}
        icon={MessageSquareHeart}
        description={pageDescription}
      >
        {!isStudent && (
          <Button onClick={() => router.push('/register-complaint')}>
            <Plus className="mr-2 h-4 w-4" />
            File New Complaint
          </Button>
        )}
      </PageHeader>

      <Card>
        <CardHeader>
          <CardTitle>Complaint History</CardTitle>
          <CardDescription>
            {isStudent ? "View details of complaints filed against you and settle fines." : "View the status of complaints you've submitted."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                {isStudent && <TableHead>Filed By</TableHead>}
                {isTeacher && <TableHead>Student</TableHead>}
                <TableHead>Violation Title</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-48" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-8 w-24 ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : complaints && complaints.length > 0 ? (
                complaints.map((complaint) => (
                  <TableRow key={complaint.id}>
                    <TableCell>{complaint.dateSubmitted?.seconds ? format(new Date(complaint.dateSubmitted.seconds * 1000), 'PPP') : 'N/A'}</TableCell>
                    {isStudent && <TableCell>{complaint.filedByName}</TableCell>}
                    {isTeacher && <TableCell>{complaint.studentName}</TableCell>}
                    <TableCell>{complaint.title}</TableCell>
                    <TableCell>
                       <Badge
                        variant={
                          complaint.status === 'Rejected'
                            ? 'destructive'
                            : complaint.status === 'Resolved'
                            ? 'secondary'
                            : complaint.status === 'Approved'
                            ? 'default'
                            : 'outline'
                        }
                      >
                        {complaint.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                       {isStudent && complaint.status === 'Approved' ? (
                         <Button 
                            size="sm" 
                            onClick={() => handlePayFine(complaint)} 
                            disabled={payingId === complaint.id}
                            className="bg-green-600 hover:bg-green-700"
                         >
                            {payingId === complaint.id ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <CircleDollarSign className="mr-2 h-4 w-4" />
                            )}
                            Pay Fine
                         </Button>
                       ) : (
                         <span className="text-xs text-muted-foreground italic">No action needed</span>
                       )}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={isStudent || isTeacher ? 5 : 4} className="text-center h-24 text-muted-foreground">
                    {isStudent ? "No complaints found against you." : "You have not filed any complaints."}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
