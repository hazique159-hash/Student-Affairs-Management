'use client';
import { ShieldAlert } from 'lucide-react';
import { PageHeader } from '@/components/page-header';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  useCollection,
  useDoc,
  useFirestore,
  useUser,
  useMemoFirebase,
} from '@/firebase';
import { collection, query, where, doc } from 'firebase/firestore';
import type { Complaint } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

export default function MyComplaintsPage() {
  const firestore = useFirestore();
  const { user } = useUser();

  // Get the student profile to find the studentId (registration number)
  const userProfileRef = useMemoFirebase(
    () => (firestore && user ? doc(firestore, 'users', user.uid) : null),
    [firestore, user]
  );
  const { data: userProfile, isLoading: isLoadingProfile } =
    useDoc<{ studentId: string }>(userProfileRef);

  // Query for complaints once we have the studentId
  const complaintsQuery = useMemoFirebase(() => {
    if (!firestore || !userProfile?.studentId) return null;
    return query(
      collection(firestore, 'complaints'),
      where('studentId', '==', userProfile.studentId),
      where('status', 'in', ['Approved', 'Resolved'])
    );
  }, [firestore, userProfile]);

  const { data: complaints, isLoading: isLoadingComplaints } =
    useCollection<Complaint>(complaintsQuery);

  const isLoading = isLoadingProfile || isLoadingComplaints;

  const getStatusVariant = (status: 'Approved' | 'Resolved' | 'Pending') => {
    switch (status) {
      case 'Approved':
        return 'destructive';
      case 'Resolved':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="My Complaints"
        icon={ShieldAlert}
        description="A record of all approved complaints filed against you."
      />

      <Card>
        <CardHeader>
          <CardTitle>Complaint History</CardTitle>
          <CardDescription>
            These are the official complaints that have been reviewed and
            approved by administration.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date Submitted</TableHead>
                <TableHead>Violation Type</TableHead>
                <TableHead>Details</TableHead>
                <TableHead className="text-right">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading &&
                Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <Skeleton className="h-5 w-24" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-5 w-32" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-5 w-48" />
                    </TableCell>
                    <TableCell className="text-right">
                      <Skeleton className="h-6 w-20 ml-auto" />
                    </TableCell>
                  </TableRow>
                ))}
              {!isLoading && complaints && complaints.length > 0 ? (
                complaints.map((complaint) => (
                  <TableRow key={complaint.id}>
                    <TableCell>
                      {new Date(complaint.dateSubmitted).toLocaleDateString()}
                    </TableCell>
                    <TableCell>{complaint.violationType}</TableCell>
                    <TableCell>
                       <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="link" className="p-0 h-auto">View Details</Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Complaint Details</DialogTitle>
                            <DialogDescription>
                               Violation: {complaint.violationType}
                            </DialogDescription>
                          </DialogHeader>
                          <p className="py-4 text-sm text-muted-foreground">{complaint.details}</p>
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant={getStatusVariant(complaint.status)}>
                        {complaint.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                !isLoading && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center h-24">
                      You have no approved complaints on your record.
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
    