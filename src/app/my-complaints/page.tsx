'use client';
import { MessageSquareHeart, Plus, Loader2 } from 'lucide-react';
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
import { useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { collection, query, orderBy } from 'firebase/firestore';
import { format } from 'date-fns';

export default function MyComplaintsPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();

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

  const isLoading = isUserLoading || isLoadingComplaints;

  return (
    <div className="space-y-8">
      <PageHeader
        title="My Complaints"
        icon={MessageSquareHeart}
        description="A record of all complaints you have filed."
      >
        <Button onClick={() => router.push('/register-complaint')}>
          <Plus className="mr-2 h-4 w-4" />
          File New Complaint
        </Button>
      </PageHeader>

      <Card>
        <CardHeader>
          <CardTitle>Complaint History</CardTitle>
          <CardDescription>
            You can view the status of your submitted complaints here.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date Submitted</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading &&
                Array.from({ length: 2 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-48" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-64" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-6 w-20 ml-auto" /></TableCell>
                  </TableRow>
                ))}
              {!isLoading && complaints && complaints.length > 0 ? (
                complaints.map((complaint) => (
                  <TableRow key={complaint.id}>
                    <TableCell>{complaint.dateSubmitted ? format(new Date(complaint.dateSubmitted.seconds * 1000), 'PPP') : 'N/A'}</TableCell>
                    <TableCell>{complaint.title}</TableCell>
                    <TableCell className="max-w-xs truncate">{complaint.description}</TableCell>
                    <TableCell className="text-right">
                       <Badge
                        variant={
                          complaint.status === 'Resolved'
                            ? 'secondary'
                            : complaint.status === 'In Progress'
                            ? 'default'
                            : 'destructive'
                        }
                      >
                        {complaint.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                !isLoading && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center h-24">
                      You have not filed any complaints.
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