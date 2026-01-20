'use client';
import { CircleDollarSign } from 'lucide-react';
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
import type { Fine } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo } from 'react';
import { fines as allFines } from '@/lib/data';

export default function MyFinesPage() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
      if (!isUserLoading && !user) {
          router.push('/login');
      }
  }, [isUserLoading, user, router]);

  const studentId = useMemo(() => {
    if (!user?.email) return null;
    // Assuming student ID is the part of the email before the '@'
    return user.email.split('@')[0].toUpperCase();
  }, [user]);

  const fines = useMemo(() => {
    if (!studentId) return [];
    return allFines.filter(fine => fine.studentId === studentId);
  }, [studentId]);

  const isLoading = isUserLoading;

  return (
    <div className="space-y-8">
      <PageHeader
        title="My Fines"
        icon={CircleDollarSign}
        description="A record of all fines issued to you."
      />

      <Card>
        <CardHeader>
          <CardTitle>Fine History</CardTitle>
          <CardDescription>
            Please settle any outstanding fines at your earliest convenience.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date Issued</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead className="text-right">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading &&
                Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-48" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-6 w-20 ml-auto" /></TableCell>
                  </TableRow>
                ))}
              {!isLoading && fines && fines.length > 0 ? (
                fines.map((fine) => (
                  <TableRow key={fine.id}>
                    <TableCell>{new Date(fine.dateIssued).toLocaleDateString()}</TableCell>
                    <TableCell>{fine.reason}</TableCell>
                    <TableCell>PKR {fine.amount.toFixed(2)}</TableCell>
                    <TableCell>{new Date(fine.dateDue).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                      <Badge variant={fine.isPaid ? 'secondary' : 'destructive'}>
                        {fine.isPaid ? 'Paid' : 'Unpaid'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                !isLoading && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center h-24">
                      You have no fines. Great job!
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
