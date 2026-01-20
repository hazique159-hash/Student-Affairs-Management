'use client';

import { BarChart2, Users, UserCheck, Loader2 } from 'lucide-react';
import { PageHeader } from '@/components/page-header';
import { AnalyticsChart } from '@/components/analytics-chart';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';
import type { Student, Teacher } from '@/lib/types';

export default function AnalyticsPage() {
  const firestore = useFirestore();

  const studentsRef = useMemoFirebase(
    () => (firestore ? collection(firestore, 'students') : null),
    [firestore]
  );
  const teachersRef = useMemoFirebase(
    () => (firestore ? collection(firestore, 'teachers') : null),
    [firestore]
  );

  const { data: students, isLoading: isLoadingStudents } =
    useCollection<Student>(studentsRef);
  const { data: teachers, isLoading: isLoadingTeachers } =
    useCollection<Teacher>(teachersRef);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Analytics Dashboard"
        icon={BarChart2}
        description="Visual representations of student affairs data."
      />

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Students
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoadingStudents ? (
               <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              <div className="text-2xl font-bold">{students?.length ?? 0}</div>
            )}
            <p className="text-xs text-muted-foreground">
              Total number of students enrolled.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Teachers
            </CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoadingTeachers ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              <div className="text-2xl font-bold">{teachers?.length ?? 0}</div>
            )}
            <p className="text-xs text-muted-foreground">
              Total number of teachers on staff.
            </p>
          </CardContent>
        </Card>
      </div>

      <AnalyticsChart />
    </div>
  );
}

    