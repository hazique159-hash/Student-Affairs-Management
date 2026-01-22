'use client';
import { CircleDollarSign, Loader2 } from 'lucide-react';
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
import { Button } from '@/components/ui/button';
import { useUser } from '@/firebase';
import type { Fine } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { fines as allFines } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';

export default function MyFinesPage() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const { toast } = useToast();

  const [fines, setFines] = useState<Fine[]>([]);
  const [payingFineId, setPayingFineId] = useState<string | null>(null);

  useEffect(() => {
      if (!isUserLoading && !user) {
          router.push('/login');
      }
  }, [isUserLoading, user, router]);

  const studentId = useMemo(() => {
    if (!user?.email) return null;
    return user.email.split('@')[0].toUpperCase();
  }, [user]);

  useEffect(() => {
    if (studentId) {
      const studentFines = allFines.filter(fine => fine.studentId === studentId);
      setFines(studentFines);
    }
  }, [studentId]);

  const handlePayFine = (fineId: string) => {
    setPayingFineId(fineId);
    // Simulate payment processing
    setTimeout(() => {
      setFines(prevFines =>
        prevFines.map(fine =>
          fine.id === fineId ? { ...fine, isPaid: true } : fine
        )
      );
      setPayingFineId(null);
      toast({
        title: 'Payment Successful',
        description: 'Your fine has been marked as paid.',
      });
    }, 1500);
  };

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
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
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
                    <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-8 w-24 ml-auto" /></TableCell>
                  </TableRow>
                ))}
              {!isLoading && fines && fines.length > 0 ? (
                fines.map((fine) => (
                  <TableRow key={fine.id}>
                    <TableCell>{new Date(fine.dateIssued).toLocaleDateString()}</TableCell>
                    <TableCell>{fine.reason}</TableCell>
                    <TableCell>PKR {fine.amount.toFixed(2)}</TableCell>
                    <TableCell>{new Date(fine.dateDue).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Badge variant={fine.isPaid ? 'secondary' : 'destructive'}>
                        {fine.isPaid ? 'Paid' : 'Unpaid'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {fine.isPaid ? (
                        <span className="text-sm text-muted-foreground">Cleared</span>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => handlePayFine(fine.id)}
                          disabled={payingFineId === fine.id}
                        >
                          {payingFineId === fine.id ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : null}
                          Pay Fine
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                !isLoading && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center h-24">
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
