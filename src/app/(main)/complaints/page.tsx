'use client';
import { ShieldAlert, ShieldQuestion, Loader2 } from 'lucide-react';
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
import { collection, query, where, doc } from 'firebase/firestore';
import type { Complaint } from '@/lib/types';
import { useMemo } from 'react';
import { updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { Skeleton } from '@/components/ui/skeleton';

// ============================================================================
// Shared Components
// ============================================================================

const getStatusVariant = (status: 'Approved' | 'Resolved' | 'Pending') => {
  switch (status) {
    case 'Pending':
      return 'outline';
    case 'Approved':
      return 'destructive';
    case 'Resolved':
      return 'secondary';
    default:
      return 'default';
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

const ComplaintsTable = ({
  complaints,
  isLoading,
  role,
}: {
  complaints: Complaint[];
  isLoading: boolean;
  role: 'admin' | 'teacher' | 'student';
}) => {
  const firestore = useFirestore();

  const handleApprove = (complaintId: string) => {
    if (!firestore) return;
    const complaintRef = doc(firestore, `complaints/${complaintId}`);
    updateDocumentNonBlocking(complaintRef, { status: 'Approved' });
  };

  const handleResolve = (complaintId: string) => {
    if (!firestore) return;
    const complaintRef = doc(firestore, `complaints/${complaintId}`);
    updateDocumentNonBlocking(complaintRef, { status: 'Resolved' });
  };

  const tableHeaders = {
    admin: ['Student', 'Violation', 'Submitted By', 'Date', 'Status', 'Actions'],
    teacher: ['Student', 'Violation', 'Date', 'Status', 'Actions'],
    student: ['Date Submitted', 'Violation', 'Details', 'Status'],
  };

  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              {tableHeaders[role].map((header) => (
                <TableHead key={header}>{header}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading &&
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={tableHeaders[role].length}>
                    <Skeleton className="h-8 w-full" />
                  </TableCell>
                </TableRow>
              ))}
            {!isLoading && complaints.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={tableHeaders[role].length}
                  className="h-24 text-center"
                >
                  No complaints to display.
                </TableCell>
              </TableRow>
            )}
            {!isLoading &&
              complaints.map((complaint) => (
                <TableRow key={complaint.id}>
                  {/* Student View */}
                  {role === 'student' && (
                    <>
                      <TableCell>
                        {new Date(complaint.dateSubmitted).toLocaleDateString()}
                      </TableCell>
                      <TableCell>{complaint.violationType}</TableCell>
                      <TableCell>
                        <ComplaintDetailsDialog complaint={complaint} />
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusVariant(complaint.status)}>
                          {complaint.status}
                        </Badge>
                      </TableCell>
                    </>
                  )}
                  {/* Admin/Teacher View */}
                  {role !== 'student' && (
                    <>
                      <TableCell>
                        <div className="font-medium">
                          {complaint.studentName}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {complaint.studentId}
                        </div>
                      </TableCell>
                      <TableCell>{complaint.violationType}</TableCell>
                      {role === 'admin' && (
                        <TableCell>{complaint.teacherId}</TableCell>
                      )}
                      <TableCell>
                        {new Date(complaint.dateSubmitted).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusVariant(complaint.status)}>
                          {complaint.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="space-x-2 text-right">
                        {role === 'admin' &&
                          complaint.status === 'Pending' && (
                            <Button
                              size="sm"
                              onClick={() => handleApprove(complaint.id)}
                            >
                              Approve
                            </Button>
                          )}
                        {role === 'admin' &&
                          complaint.status === 'Approved' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleResolve(complaint.id)}
                            >
                              Resolve
                            </Button>
                          )}
                        <ComplaintDetailsDialog complaint={complaint} />
                      </TableCell>
                    </>
                  )}
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

// ============================================================================
// Main Page Component
// ============================================================================

export default function ComplaintsPage() {
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();

  const role: 'admin' | 'teacher' | 'student' | 'loading' = useMemo(() => {
    if (isUserLoading) return 'loading';
    if (user?.email?.endsWith('@admin.com')) return 'admin';
    if (user?.email?.endsWith('@student.com')) return 'student';
    return 'teacher';
  }, [user, isUserLoading]);

  // For students, we need to get their student ID from the `users` collection first.
  const userProfileRef = useMemoFirebase(
    () => (firestore && user && role === 'student' ? doc(firestore, 'users', user.uid) : null),
    [firestore, user, role]
  );
  const { data: userProfile, isLoading: isLoadingProfile } = useDoc<{ studentId: string }>(userProfileRef);


  const complaintsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    const complaintsCollection = collection(firestore, 'complaints');
    
    switch (role) {
      case 'admin':
        // Admins see all complaints. Sorting is done client-side.
        return query(complaintsCollection);
      case 'teacher':
        // Teachers see complaints they submitted
        return query(complaintsCollection, where('teacherId', '==', user.uid));
      case 'student':
        // Students see approved/resolved complaints against them
        if (!userProfile?.studentId) return null; // Wait for profile to load
        return query(
          complaintsCollection,
          where('studentId', '==', userProfile.studentId),
          where('status', 'in', ['Approved', 'Resolved'])
        );
      default:
        return null;
    }
  }, [firestore, user, role, userProfile]);

  const { data: complaints, isLoading: isLoadingComplaints } = useCollection<Complaint>(complaintsQuery);

  const isLoading = isUserLoading || (role === 'student' && isLoadingProfile) || isLoadingComplaints;
  
  const pageDetails = {
      admin: {
        icon: ShieldQuestion,
        title: "Complaint Management",
        description: "Review, approve, and manage all student complaints.",
      },
      teacher: {
        icon: ShieldQuestion,
        title: "My Submitted Complaints",
        description: "Review and track the status of your submitted complaints.",
      },
      student: {
          icon: ShieldAlert,
          title: "My Complaints",
          description: "A record of all official complaints filed against you."
      },
      loading: {
          icon: Loader2,
          title: "Loading Complaints",
          description: "Please wait..."
      }
  }

  // Admin and Teacher view with a single table, sorted by status
  const AdminTeacherView = () => {
    const statusOrder: { [key in Complaint['status']]: number } = { 'Pending': 1, 'Approved': 2, 'Resolved': 3 };

    const sortedComplaints = useMemo(() => {
        if (!complaints) return [];
        return [...complaints].sort((a, b) => {
            const orderA = statusOrder[a.status] || 99;
            const orderB = statusOrder[b.status] || 99;
            if (orderA !== orderB) {
                return orderA - orderB;
            }
            // if status is same, sort by date descending
            return new Date(b.dateSubmitted).getTime() - new Date(a.dateSubmitted).getTime();
        });
    }, [complaints]);

    return (
      <Card>
        <CardHeader>
            <CardTitle>All Complaints</CardTitle>
            <CardDescription>
                All submitted complaints, ordered by status.
            </CardDescription>
        </CardHeader>
        <CardContent>
            <ComplaintsTable complaints={sortedComplaints} isLoading={isLoading} role={role as 'admin' | 'teacher'} />
        </CardContent>
      </Card>
    )
  }

  // Student view, simple table
  const StudentView = () => {
    const sortedComplaints = useMemo(() => {
      if (!complaints) return [];
      return [...complaints].sort((a, b) => new Date(b.dateSubmitted).getTime() - new Date(a.dateSubmitted).getTime());
    }, [complaints]);

    return (
      <Card>
          <CardHeader>
              <CardTitle>Complaint History</CardTitle>
              <CardDescription>
                  These are the official complaints that have been reviewed and approved by the administration.
              </CardDescription>
          </CardHeader>
          <CardContent>
              <ComplaintsTable complaints={sortedComplaints} isLoading={isLoading} role="student" />
          </CardContent>
      </Card>
    )
  }


  if (role === 'loading') {
      return (
          <div className="flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 animate-spin" />
          </div>
      );
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title={pageDetails[role].title}
        icon={pageDetails[role].icon}
        description={pageDetails[role].description}
      />

      {(role === 'admin' || role === 'teacher') ? <AdminTeacherView /> : <StudentView />}
    </div>
  );
}
