'use client';
import { Users, Plus } from 'lucide-react';
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
import { collection } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { useRouter } from 'next/navigation';

export default function StudentsPage() {
  const firestore = useFirestore();
  const { user } = useUser();
  const router = useRouter();

  const studentsRef = useMemoFirebase(
    () => (firestore ? collection(firestore, 'students') : null),
    [firestore]
  );
  const { data: students, isLoading } = useCollection<Student>(studentsRef);

  const isAdmin = user?.email?.endsWith('@admin.com');

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
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Department</TableHead>
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
                    {isAdmin && (
                        <TableCell className="text-right">
                            <Skeleton className="h-8 w-16 ml-auto" />
                        </TableCell>
                    )}
                  </TableRow>
                ))}
              {!isLoading &&
                students?.map((student) => (
                  <TableRow key={student.id}>
                    <TableCell className="font-medium">{student.id}</TableCell>
                    <TableCell>{`${student.firstName} ${student.lastName}`}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          student.department === 'CS'
                            ? 'default'
                            : student.department === 'SE'
                            ? 'secondary'
                            : 'outline'
                        }
                        className={
                          student.department === 'CS'
                            ? 'bg-blue-100 text-blue-800'
                            : student.department === 'SE'
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-green-100 text-green-800'
                        }
                      >
                        {student.department}
                      </Badge>
                    </TableCell>
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
