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
import { useCollection, useFirestore, useUser, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import type { Fine } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function MyFinesPage() {
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();
  const router = useRouter();

  const finesRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return collection(firestore, `users/${user.uid}/fines`);
  }, [firestore, user]);

  const { data: fines, isLoading } = useCollection<Fine>(finesRef);

  useEffect(() => {
      if (!isUserLoading && !user) {
          router.push('/login');
      }
  }, [isUserLoading, user, router]);

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
                <TableRow>
                  <TableCell colSpan={5} className="text-center h-24">
                    You have no fines. Great job!
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
