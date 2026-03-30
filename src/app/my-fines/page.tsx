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
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import type { Fine } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { collection, doc, updateDoc } from 'firebase/firestore';

export default function MyFinesPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  const [payingFineId, setPayingFineId] = useState<string | null>(null);

  useEffect(() => {
      if (!isUserLoading && !user) {
          router.push('/login');
      }
  }, [isUserLoading, user, router]);

  const finesRef = useMemoFirebase(
    () => (firestore && user ? collection(firestore, 'users', user.uid, 'fines') : null),
    [firestore, user]
  );
  const { data: fines, isLoading: isLoadingFines } = useCollection<Fine>(finesRef);

  const handlePayFine = async (fine: Fine) => {
    if (!firestore || !user) return;
    setPayingFineId(fine.id);
    
    try {
      const fineRef = doc(firestore, 'users', user.uid, 'fines', fine.id);
      await updateDoc(fineRef, { isPaid: true });
      
      toast({
        title: 'Payment Successful',
        description: 'Fine has been marked as paid.',
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Payment Failed',
        description: error.message || 'Could not process payment.',
      });
    } finally {
      setPayingFineId(null);
    }
  };

  const isLoading = isUserLoading || isLoadingFines;

  return (
    <div className="space-y-8">
      <PageHeader
        title="My Fines"
        icon={CircleDollarSign}
        description="View and settle outstanding fines issued to your account."
      />

      <Card>
        <CardHeader>
          <CardTitle>Fine History</CardTitle>
          <CardDescription>
            New fines of Rs. 1000 are automatically generated when a complaint against you is approved by the Student Affairs department.
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
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-48" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-8 w-24 ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : fines && fines.length > 0 ? (
                fines
                  .sort((a, b) => new Date(b.dateIssued).getTime() - new Date(a.dateIssued).getTime())
                  .map((fine) => (
                  <TableRow key={fine.id}>
                    <TableCell>{new Date(fine.dateIssued).toLocaleDateString('en-GB')}</TableCell>
                    <TableCell>{fine.reason}</TableCell>
                    <TableCell className="font-semibold text-primary">Rs. {fine.amount}</TableCell>
                    <TableCell>{new Date(fine.dateDue).toLocaleDateString('en-GB')}</TableCell>
                    <TableCell>
                      <Badge variant={fine.isPaid ? 'secondary' : 'destructive'}>
                        {fine.isPaid ? 'Paid' : 'Unpaid'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {fine.isPaid ? (
                        <span className="text-xs text-muted-foreground italic">Cleared</span>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => handlePayFine(fine)}
                          disabled={payingFineId === fine.id}
                        >
                          {payingFineId === fine.id && (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          )}
                          Pay Now
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                    You have no outstanding fines.
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
