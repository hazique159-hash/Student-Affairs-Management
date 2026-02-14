'use client';
import { Briefcase, Plus, Loader2, Search } from 'lucide-react';
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
import { useCollection, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import type { Teacher } from '@/lib/types';
import { collection, deleteDoc, doc } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';

export default function TeachersPage() {
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const teachersRef = useMemoFirebase(
    () => (firestore && user?.email?.endsWith('@admin.com') ? collection(firestore, 'teachers') : null),
    [firestore, user]
  );
  const { data: teachers, isLoading: isLoadingTeachers } = useCollection<Teacher>(teachersRef);
  
  const isLoading = isUserLoading || isLoadingTeachers;
  const isAdmin = user?.email?.endsWith('@admin.com');

  const filteredTeachers = teachers?.filter(
    (teacher) =>
      teacher.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      teacher.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      teacher.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

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

  const handleDelete = async (teacher: Teacher) => {
    if (!firestore || !isAdmin) return;
    setIsDeleting(teacher.id);

    try {
      await deleteDoc(doc(firestore, 'teachers', teacher.id));
      toast({
        title: 'Teacher Deleted',
        description: `The record for ${teacher.firstName} ${teacher.lastName} has been deleted.`,
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Deletion Failed',
        description: error.message || 'Could not delete teacher record.',
      });
    } finally {
      setIsDeleting(null);
    }
  };


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
        <div className="border-b p-4">
            <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input 
                    placeholder="Search by name or email..."
                    className="pl-8 w-full max-w-sm"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
        </div>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Department</TableHead>
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
                    <TableCell>
                      <Skeleton className="h-6 w-16" />
                    </TableCell>
                    {isAdmin && (
                        <TableCell className="text-right">
                            <Skeleton className="h-8 w-32 ml-auto" />
                        </TableCell>
                    )}
                  </TableRow>
                ))}
              {!isLoading &&
                filteredTeachers?.map((teacher) => (
                  <TableRow key={teacher.id}>
                    <TableCell className="font-medium">{`${teacher.firstName} ${teacher.lastName}`}</TableCell>
                    <TableCell>{teacher.email}</TableCell>
                    <TableCell>
                        <Badge variant="outline">
                          {teacher.department}
                        </Badge>
                      </TableCell>
                    {isAdmin && (
                        <TableCell className="text-right space-x-2">
                          <Button variant="ghost" size="sm" onClick={() => router.push(`/edit-teacher/${teacher.id}`)}>
                            Edit
                          </Button>
                          <AlertDialog>
                              <AlertDialogTrigger asChild>
                                  <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                                      Delete
                                  </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                  <AlertDialogHeader>
                                      <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                      <AlertDialogDescription>
                                          This action cannot be undone. This will permanently delete the teacher record for {teacher.firstName} {teacher.lastName}.
                                      </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                                      <AlertDialogAction onClick={() => handleDelete(teacher)} disabled={isDeleting === teacher.id}>
                                        {isDeleting === teacher.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                        Continue
                                      </AlertDialogAction>
                                  </AlertDialogFooter>
                              </AlertDialogContent>
                          </AlertDialog>
                        </TableCell>
                    )}
                  </TableRow>
                ))}
                {!isLoading && filteredTeachers?.length === 0 && (
                    <TableRow>
                        <TableCell colSpan={isAdmin ? 4 : 3} className="h-24 text-center">
                        No teachers found.
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
