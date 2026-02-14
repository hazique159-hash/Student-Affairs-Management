'use client';
import { Users, Plus, Loader2, Search } from 'lucide-react';
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
import type { Student } from '@/lib/types';
import { collection, deleteDoc, doc, getDocs, query, where } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { useRouter } from 'next/navigation';
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
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import { Input } from '@/components/ui/input';

export default function StudentsPage() {
  const firestore = useFirestore();
  const { user } = useUser();
  const router = useRouter();
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const studentsRef = useMemoFirebase(
    () => (firestore ? collection(firestore, 'students') : null),
    [firestore]
  );
  const { data: students, isLoading } = useCollection<Student>(studentsRef);

  const isAdmin = user?.email?.endsWith('@admin.com');

  const filteredStudents = students?.filter(student =>
    student.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = async (studentToDelete: Student) => {
    if (!firestore || !isAdmin) return;

    setIsDeleting(studentToDelete.id);

    try {
      // 1. Delete from 'students' collection
      await deleteDoc(doc(firestore, 'students', studentToDelete.id));

      // 2. Find and delete from 'users' collection
      const usersQuery = query(collection(firestore, 'users'), where('studentId', '==', studentToDelete.id));
      const querySnapshot = await getDocs(usersQuery);
      
      const deletePromises: Promise<void>[] = [];
      querySnapshot.forEach((userDoc) => {
        deletePromises.push(deleteDoc(userDoc.ref));
      });
      await Promise.all(deletePromises);

      toast({
        title: 'Student Deleted',
        description: `The record for ${studentToDelete.firstName} ${studentToDelete.lastName} has been deleted.`,
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Deletion Failed',
        description: error.message || 'Could not delete student record.',
      });
    } finally {
      setIsDeleting(null);
    }
  };


  return (
    <div className="space-y-8">
      <PageHeader
        title="Student Records"
        icon={Users}
        description="Manage student records."
      >
        {isAdmin && (
          <Button onClick={() => router.push('/add-student')}>
            <Plus className="mr-2 h-4 w-4" />
            Add Student
          </Button>
        )}
      </PageHeader>

      <Card>
        <div className="border-b p-4">
            <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input 
                    placeholder="Search by Registration No..."
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
                <TableHead>Student ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Complaints</TableHead>
                {isAdmin && <TableHead className="text-right">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading &&
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <Skeleton className="h-5 w-24" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-5 w-32" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-6 w-16" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-6 w-12" />
                    </TableCell>
                    {isAdmin && (
                        <TableCell className="text-right">
                            <Skeleton className="h-8 w-32 ml-auto" />
                        </TableCell>
                    )}
                  </TableRow>
                ))}
              {!isLoading &&
                filteredStudents
                  ?.sort((a, b) => (b.complaintCount ?? 0) - (a.complaintCount ?? 0))
                  .map((student) => (
                    <TableRow key={student.id}>
                      <TableCell className="font-medium">{student.id}</TableCell>
                      <TableCell>{`${student.firstName} ${student.lastName}`}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {student.department}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={(student.complaintCount ?? 0) > 2 ? 'destructive' : (student.complaintCount ?? 0) > 0 ? 'secondary' : 'outline'}>
                          {student.complaintCount ?? 0}
                        </Badge>
                      </TableCell>
                      {isAdmin && (
                          <TableCell className="text-right">
                            <Button variant="ghost" size="sm" onClick={() => router.push(`/edit-student/${student.id}`)}>
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
                                            This action cannot be undone. This will permanently delete the student record for {student.firstName} {student.lastName}.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => handleDelete(student)} disabled={isDeleting === student.id}>
                                          {isDeleting === student.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                          Continue
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                          </TableCell>
                      )}
                    </TableRow>
                  ))}
               {!isLoading && filteredStudents?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={isAdmin ? 5 : 4} className="h-24 text-center">
                    No students found.
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
