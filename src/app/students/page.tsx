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

  const isAdmin = user?.email === 'studentaffairs316@gmail.com' || user?.email?.endsWith('@admin.com');

  const studentsRef = useMemoFirebase(
    () => (firestore ? collection(firestore, 'students') : null),
    [firestore]
  );
  const { data: students, isLoading } = useCollection<Student>(studentsRef);

  const filteredStudents = students?.filter(student =>
    student.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = async (studentToDelete: Student) => {
    if (!firestore || !isAdmin) return;

    setIsDeleting(studentToDelete.id);

    try {
      await deleteDoc(doc(firestore, 'students', studentToDelete.id));

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
    <div className="space-y-8 pb-10">
      <PageHeader
        title="Student Records"
        icon={Users}
        description="Manage student records."
      >
        {isAdmin && (
          <Button size="sm" onClick={() => router.push('/add-student')} className="w-full sm:w-auto">
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
                    placeholder="Search by ID..."
                    className="pl-8 w-full max-w-sm"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
        </div>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[100px]">Student ID</TableHead>
                  <TableHead className="min-w-[150px]">Name</TableHead>
                  <TableHead className="min-w-[120px]">Department</TableHead>
                  <TableHead>Complaints</TableHead>
                  {isAdmin && <TableHead className="text-right">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading &&
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-12" /></TableCell>
                      {isAdmin && <TableCell className="text-right"><Skeleton className="h-8 w-32 ml-auto" /></TableCell>}
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
                          <Badge variant="outline" className="text-[10px] sm:text-xs">
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
                              <div className="flex items-center justify-end gap-1">
                                <Button variant="ghost" size="sm" className="h-8 px-2" onClick={() => router.push(`/edit-student/${student.id}`)}>
                                    Edit
                                </Button>
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button variant="ghost" size="sm" className="text-destructive h-8 px-2">
                                            Delete
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent className="w-[95vw] sm:max-w-md rounded-lg">
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                This action will permanently delete the student record for {student.firstName} {student.lastName}.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                            <AlertDialogAction onClick={() => handleDelete(student)} disabled={isDeleting === student.id}>
                                              {isDeleting === student.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                              Delete
                                            </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                              </div>
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
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
