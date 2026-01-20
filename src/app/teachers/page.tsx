'use client';
import { Briefcase, Plus, Loader2 } from 'lucide-react';
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
import { useCollection, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import type { Teacher } from '@/lib/types';
import { collection } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

export default function TeachersPage() {
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const { toast } = useToast();

  const teachersRef = useMemoFirebase(
    () => (firestore && user?.email?.endsWith('@admin.com') ? collection(firestore, 'teachers') : null),
    [firestore, user]
  );
  const { data: teachers, isLoading: isLoadingTeachers } = useCollection<Teacher>(teachersRef);
  
  const isLoading = isUserLoading || isLoadingTeachers;
  const isAdmin = user?.email?.endsWith('@admin.com');

  useEffect(() => {
    if (!isUserLoading && !isAdmin) {
      toast({
        variant: 'destructive',
        title: 'Access Denied',
        description: 'You do not have permission to view this page.',
      });
      router.push('/announcements');
    }
  }, [isAdmin, isUserLoading, router, toast]);

  if (isUserLoading || !isAdmin) {
    return <div className="flex items-center justify-center h-full"><Loader2 className="animate-spin" /></div>;
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Teacher Records"
        icon={Briefcase}
        description="View and manage teacher records."
      >
        {isAdmin && (
          <Button onClick={() => router.push('/add-teacher')}>
            <Plus className="mr-2 h-4 w-4" />
            Add Teacher
          </Button>
        )}
      </PageHeader>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                {isAdmin && <TableHead className="text-right">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading &&
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <Skeleton className="h-5 w-32" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-5 w-40" />
                    </TableCell>
                    {isAdmin && (
                        <TableCell className="text-right">
                            <Skeleton className="h-8 w-16 ml-auto" />
                        </TableCell>
                    )}
                  </TableRow>
                ))}
              {!isLoading &&
                teachers?.map((teacher) => (
                  <TableRow key={teacher.id}>
                    <TableCell className="font-medium">{`${teacher.firstName} ${teacher.lastName}`}</TableCell>
                    <TableCell>{teacher.email}</TableCell>
                    {isAdmin && (
                        <TableCell className="text-right">
                        <Button variant="ghost" size="sm">
                            Edit
                        </Button>
                        </TableCell>
                    )}
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
