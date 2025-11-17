'use client';
import { ShieldQuestion } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { Complaint } from '@/lib/types';
import { useCollection, useFirestore, useUser } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import { useMemo } from 'react';
import { updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { doc } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';

const ComplaintTable = ({
  complaints,
  isLoading,
  isAdmin,
}: {
  complaints: Complaint[];
  isLoading: boolean;
  isAdmin: boolean;
}) => {
  const firestore = useFirestore();

  const handleApprove = (teacherId: string, complaintId: string) => {
    if (!firestore) return;
    const complaintRef = doc(
      firestore,
      `teachers/${teacherId}/complaints/${complaintId}`
    );
    updateDocumentNonBlocking(complaintRef, { status: 'Approved' });
  };

  const handleResolve = (teacherId: string, complaintId: string) => {
    if (!firestore) return;
    const complaintRef = doc(
      firestore,
      `teachers/${teacherId}/complaints/${complaintId}`
    );
    updateDocumentNonBlocking(complaintRef, { status: 'Resolved' });
  };

  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Student</TableHead>
              <TableHead>Violation</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Submitted By</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading &&
              Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <Skeleton className="h-5 w-24" />
                    <Skeleton className="h-4 w-32 mt-1" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-28" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-20" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-24" />
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Skeleton className="h-8 w-20 inline-block" />
                  </TableCell>
                </TableRow>
              ))}
            {!isLoading &&
              complaints.map((complaint) => (
                <TableRow key={complaint.id}>
                  <TableCell>
                    <div className="font-medium">{complaint.studentName}</div>
                    <div className="text-sm text-muted-foreground">
                      {complaint.studentId}
                    </div>
                  </TableCell>
                  <TableCell>{complaint.violationType}</TableCell>
                  <TableCell>
                    {new Date(complaint.dateSubmitted).toLocaleDateString()}
                  </TableCell>
                  <TableCell>{complaint.teacherId}</TableCell>
                  <TableCell className="text-right space-x-2">
                    {isAdmin && complaint.status === 'Pending' && (
                      <Button
                        size="sm"
                        onClick={() =>
                          handleApprove(complaint.teacherId, complaint.id)
                        }
                      >
                        Approve
                      </Button>
                    )}
                    {isAdmin && complaint.status === 'Approved' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          handleResolve(complaint.teacherId, complaint.id)
                        }
                      >
                        Resolve
                      </Button>
                    )}
                    <Button variant="ghost" size="sm">
                      Details
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default function ComplaintsPage() {
  const firestore = useFirestore();
  const { user } = useUser();
  const isAdmin = user?.email?.includes('admin') ?? false;

  // This is not efficient. In a real app, you'd have a single collection
  // for complaints with teacherId as a field to query against.
  // For now, we'll fetch all complaints if admin, or only for the current teacher.
  const complaintsRef = useMemo(() => {
    if (!firestore || !user) return null;
    if (isAdmin) {
      return collection(firestore, 'complaints'); // Assumes a root 'complaints' collection for admins
    }
    return collection(firestore, `teachers/${user.uid}/complaints`);
  }, [firestore, user, isAdmin]);

  const { data: complaints, isLoading } = useCollection<Complaint>(
    complaintsRef as any
  ); // We cast to any because the root collection doesn't match the path structure perfectly

  const pendingComplaints = useMemo(
    () => complaints?.filter((c) => c.status === 'Pending') ?? [],
    [complaints]
  );
  const approvedComplaints = useMemo(
    () => complaints?.filter((c) => c.status === 'Approved') ?? [],
    [complaints]
  );
  const resolvedComplaints = useMemo(
    () => complaints?.filter((c) => c.status === 'Resolved') ?? [],
    [complaints]
  );

  return (
    <div className="space-y-8">
      <PageHeader
        title="Complaint Management"
        icon={ShieldQuestion}
        description="Review, approve, and manage student complaints."
      />

      <Tabs defaultValue="pending">
        <TabsList className="grid w-full grid-cols-3 md:w-auto md:inline-flex">
          <TabsTrigger value="pending">
            Pending <Badge className="ml-2">{pendingComplaints.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="approved">
            Approved <Badge className="ml-2">{approvedComplaints.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="resolved">Resolved</TabsTrigger>
        </TabsList>
        <TabsContent value="pending">
          <ComplaintTable
            complaints={pendingComplaints}
            isLoading={isLoading}
            isAdmin={isAdmin}
          />
        </TabsContent>
        <TabsContent value="approved">
          <ComplaintTable
            complaints={approvedComplaints}
            isLoading={isLoading}
            isAdmin={isAdmin}
          />
        </TabsContent>
        <TabsContent value="resolved">
          <ComplaintTable
            complaints={resolvedComplaints}
            isLoading={isLoading}
            isAdmin={isAdmin}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
