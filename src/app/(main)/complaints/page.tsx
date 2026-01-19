'use client';
import {
  ShieldAlert,
  ShieldQuestion,
  Loader2,
  Check,
  X,
} from 'lucide-react';
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  useCollection,
  useDoc,
  useFirestore,
  useUser,
  useMemoFirebase,
} from '@/firebase';
import { collection, query, where, doc, updateDoc } from 'firebase/firestore';
import type { Complaint } from '@/lib/types';
import { useMemo, useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';

// ============================================================================
// Shared Helper Components
// ============================================================================

const getStatusVariant = (
  status: 'Pending' | 'Approved' | 'Resolved'
): 'outline' | 'destructive' | 'secondary' => {
  switch (status) {
    case 'Pending':
      return 'outline';
    case 'Approved':
      return 'destructive';
    case 'Resolved':
      return 'secondary';
    default:
      return 'outline';
  }
};

const ComplaintDetailsDialog = ({ complaint }: { complaint: Complaint }) => (
  <Dialog>
    <DialogTrigger asChild>
      <Button variant="link" className="p-0 h-auto">
        View Details
      </Button>
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
);

const ComplaintsTableSkeleton = ({
  columns,
}: {
  columns: number;
}) => (
  <TableBody>
    {Array.from({ length: 5 }).map((_, i) => (
      <TableRow key={i}>
        <TableCell colSpan={columns}>
          <Skeleton className="h-8 w-full" />
        </TableCell>
      </TableRow>
    ))}
  </TableBody>
);

const NoComplaintsRow = ({
  columns,
  message,
}: {
  columns: number;
  message: string;
}) => (
  <TableBody>
    <TableRow>
      <TableCell colSpan={columns} className="h-24 text-center">
        {message}
      </TableCell>
    </TableRow>
  </TableBody>
);

// ============================================================================
// Admin View
// ============================================================================
const AdminComplaintsView = () => {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isUpdating, setIsUpdating] = useState<string | null>(null);

  const complaintsQuery = useMemoFirebase(
    () =>
      firestore
        ? query(
            collection(firestore, 'complaints'),
            // This constraint is required to satisfy the security rule validator.
            // It matches the admin's permission branch in the rule.
            where('dateSubmitted', '>', '1970-01-01T00:00:00.000Z')
          )
        : null,
    [firestore]
  );
  const { data: complaints, isLoading } =
    useCollection<Complaint>(complaintsQuery);

  const handleUpdateStatus = async (
    complaintId: string,
    status: 'Approved' | 'Resolved'
  ) => {
    if (!firestore) return;
    setIsUpdating(complaintId);
    try {
      const complaintRef = doc(firestore, 'complaints', complaintId);
      await updateDoc(complaintRef, { status });
      toast({
        title: `Complaint ${status}`,
        description: 'The complaint status has been updated.',
      });
    } catch (error) {
       toast({
        variant: "destructive",
        title: 'Update Failed',
        description: 'Could not update complaint status.',
      });
    } finally {
        setIsUpdating(null);
    }
  };
  
  const sortedComplaints = useMemo(() => {
    if (!complaints) return [];
    const statusOrder: { [key in Complaint['status']]: number } = { 'Pending': 1, 'Approved': 2, 'Resolved': 3 };
    return [...complaints].sort((a, b) => {
        const orderA = statusOrder[a.status] || 99;
        const orderB = statusOrder[b.status] || 99;
        if (orderA !== orderB) {
            return orderA - orderB;
        }
        return new Date(b.dateSubmitted).getTime() - new Date(a.dateSubmitted).getTime();
    });
  }, [complaints]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>All Complaints</CardTitle>
        <CardDescription>
          Review, approve, and manage all student complaints.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Student</TableHead>
              <TableHead>Violation</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          {isLoading ? (
            <ComplaintsTableSkeleton columns={5} />
          ) : !sortedComplaints.length ? (
            <NoComplaintsRow columns={5} message="No complaints found." />
          ) : (
            <TableBody>
              {sortedComplaints.map((complaint) => (
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
                  <TableCell>
                    <Badge variant={getStatusVariant(complaint.status)}>
                      {complaint.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="space-x-2 text-right">
                    {isUpdating === complaint.id ? (
                        <Button size="sm" disabled><Loader2 className="h-4 w-4 animate-spin" /></Button>
                    ) : (
                        <>
                        {complaint.status === 'Pending' && (
                        <Button
                            size="sm"
                            onClick={() => handleUpdateStatus(complaint.id, 'Approved')}
                        >
                            <Check className="mr-2 h-4 w-4" /> Approve
                        </Button>
                        )}
                        {complaint.status === 'Approved' && (
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleUpdateStatus(complaint.id, 'Resolved')}
                        >
                            Resolve
                        </Button>
                        )}
                        </>
                    )}
                     <ComplaintDetailsDialog complaint={complaint} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          )}
        </Table>
      </CardContent>
    </Card>
  );
};


// ============================================================================
// Teacher View
// ============================================================================
const TeacherComplaintsView = () => {
  const firestore = useFirestore();
  const { user } = useUser();
  const complaintsQuery = useMemoFirebase(
    () =>
      firestore && user
        ? query(collection(firestore, 'complaints'), where('teacherId', '==', user.uid))
        : null,
    [firestore, user]
  );
  const { data: complaints, isLoading } = useCollection<Complaint>(complaintsQuery);

  const sortedComplaints = useMemo(() => {
    if (!complaints) return [];
    const statusOrder: { [key in Complaint['status']]: number } = { 'Pending': 1, 'Approved': 2, 'Resolved': 3 };
    return [...complaints].sort((a, b) => {
        const orderA = statusOrder[a.status] || 99;
        const orderB = statusOrder[b.status] || 99;
        if (orderA !== orderB) {
            return orderA - orderB;
        }
        return new Date(b.dateSubmitted).getTime() - new Date(a.dateSubmitted).getTime();
    });
  }, [complaints]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>My Submitted Complaints</CardTitle>
        <CardDescription>
          Review and track the status of your submitted complaints.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Student</TableHead>
              <TableHead>Violation</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Details</TableHead>
            </TableRow>
          </TableHeader>
          {isLoading ? (
            <ComplaintsTableSkeleton columns={5} />
          ) : !sortedComplaints.length ? (
            <NoComplaintsRow columns={5} message="You have not submitted any complaints." />
          ) : (
            <TableBody>
              {sortedComplaints.map((complaint) => (
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
                  <TableCell>
                    <Badge variant={getStatusVariant(complaint.status)}>
                      {complaint.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <ComplaintDetailsDialog complaint={complaint} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          )}
        </Table>
      </CardContent>
    </Card>
  );
};

// ============================================================================
// Student View
// ============================================================================
const StudentComplaintsView = () => {
    const firestore = useFirestore();
    const { user } = useUser();

    const userProfileRef = useMemoFirebase(
      () => (firestore && user ? doc(firestore, 'users', user.uid) : null),
      [firestore, user]
    );
    const { data: userProfile, isLoading: isLoadingProfile } = useDoc<{ studentId: string }>(userProfileRef);
  
    const complaintsQuery = useMemoFirebase(() => {
      if (!firestore || !userProfile?.studentId) return null;
      return query(
        collection(firestore, 'complaints'),
        where('studentId', '==', userProfile.studentId),
        where('status', 'in', ['Approved', 'Resolved'])
      );
    }, [firestore, userProfile]);
  
    const { data: complaints, isLoading: isLoadingComplaints } = useCollection<Complaint>(complaintsQuery);
    const isLoading = isLoadingProfile || isLoadingComplaints;
  
    const sortedComplaints = useMemo(() => {
        if (!complaints) return [];
        return [...complaints].sort((a, b) => new Date(b.dateSubmitted).getTime() - new Date(a.dateSubmitted).getTime());
    }, [complaints]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>My Complaints</CardTitle>
        <CardDescription>
            A record of all official complaints filed against you that have been approved by administration.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date Submitted</TableHead>
              <TableHead>Violation</TableHead>
              <TableHead>Details</TableHead>
              <TableHead className="text-right">Status</TableHead>
            </TableRow>
          </TableHeader>
          {isLoading ? (
            <ComplaintsTableSkeleton columns={4} />
          ) : !sortedComplaints.length ? (
            <NoComplaintsRow columns={4} message="You have no approved complaints on your record." />
          ) : (
            <TableBody>
              {sortedComplaints.map((complaint) => (
                <TableRow key={complaint.id}>
                  <TableCell>
                    {new Date(complaint.dateSubmitted).toLocaleDateString()}
                  </TableCell>
                  <TableCell>{complaint.violationType}</TableCell>
                   <TableCell>
                    <ComplaintDetailsDialog complaint={complaint} />
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge variant={getStatusVariant(complaint.status)}>
                      {complaint.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          )}
        </Table>
      </CardContent>
    </Card>
  );
};


// ============================================================================
// Main Page Component
// ============================================================================

export default function ComplaintsPage() {
  const { user, isUserLoading } = useUser();

  const role = useMemo(() => {
    if (isUserLoading || !user) return 'loading';
    if (user.email?.endsWith('@admin.com')) return 'admin';
    if (user.email?.endsWith('@student.com')) return 'student';
    return 'teacher';
  }, [user, isUserLoading]);

  const pageDetails = {
    admin: {
      icon: ShieldQuestion,
      title: 'Complaint Management',
      description: 'Review, approve, and manage all student complaints.',
    },
    teacher: {
      icon: ShieldQuestion,
      title: 'My Submitted Complaints',
      description: 'Review and track the status of your submitted complaints.',
    },
    student: {
      icon: ShieldAlert,
      title: 'My Complaints',
      description: 'A record of all official complaints filed against you.',
    },
    loading: {
      icon: Loader2,
      title: 'Loading Complaints',
      description: 'Please wait...',
    },
  };
  
  const currentView = () => {
    switch (role) {
      case 'admin':
        return <AdminComplaintsView />;
      case 'teacher':
        return <TeacherComplaintsView />;
      case 'student':
        return <StudentComplaintsView />;
      default:
        return (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        );
    }
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title={pageDetails[role].title}
        icon={pageDetails[role].icon}
        description={pageDetails[role].description}
      />
      {currentView()}
    </div>
  );
}
