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
import { useUser } from '@/firebase';
import type { Complaint } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo } from 'react';
import { complaints as allComplaints } from '@/lib/data';

export default function ComplaintsPage() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();

  const complaints = allComplaints;
  const isLoading = isUserLoading;

  const isAdmin = user?.email?.endsWith('@admin.com');
  const isTeacher = user?.email && !isAdmin && !user.email.endsWith('@student.com');

  useEffect(() => {
    if (!isUserLoading && !isAdmin && !isTeacher) {
      router.push('/announcements');
    }
  }, [isUserLoading, user, isAdmin, isTeacher, router]);

  if (isLoading || (!isAdmin && !isTeacher)) {
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
                <TableHead>Title</TableHead>
                <TableHead className="text-right">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading &&
                Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-48" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-6 w-20 ml-auto" /></TableCell>
                  </TableRow>
                ))}
              {!isLoading && complaints && complaints.length > 0 ? (
                complaints.map((complaint) => (
                  <TableRow key={complaint.id}>
                    <TableCell>{new Date(complaint.dateSubmitted).toLocaleDateString()}</TableCell>
                    <TableCell>{complaint.studentId}</TableCell>
                    <TableCell>{complaint.studentName}</TableCell>
                    <TableCell>{complaint.title}</TableCell>
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
                    <TableCell colSpan={5} className="text-center h-24">
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

    