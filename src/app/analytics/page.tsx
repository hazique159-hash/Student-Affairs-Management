'use client';

import { BarChart2, Users, UserCheck, Loader2, MessageSquareWarning } from 'lucide-react';
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
import type { Student, Teacher, Complaint } from '@/lib/types';

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
  const complaintsRef = useMemoFirebase(
    () => (firestore ? collection(firestore, 'complaints') : null),
    [firestore]
  );

  const { data: students, isLoading: isLoadingStudents } =
    useCollection<Student>(studentsRef);
  const { data: teachers, isLoading: isLoadingTeachers } =
    useCollection<Teacher>(teachersRef);
  const { data: complaints, isLoading: isLoadingComplaints } =
    useCollection<Complaint>(complaintsRef);

  const isLoading = isLoadingStudents || isLoadingTeachers || isLoadingComplaints;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Analytics Dashboard"
        icon={BarChart2}
        description="Visual representations of student affairs data."
      />

      <div className="grid gap-4 md:grid-cols-3">
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
              Total enrolled students.
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
              Total faculty members.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Complaints
            </CardTitle>
            <MessageSquareWarning className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoadingComplaints ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              <div className="text-2xl font-bold">{complaints?.length ?? 0}</div>
            )}
            <p className="text-xs text-muted-foreground">
              Total filed complaints.
            </p>
          </CardContent>
        </Card>
      </div>

      <AnalyticsChart 
        students={students || []} 
        teachers={teachers || []} 
        complaints={complaints || []}
        isLoading={isLoading}
      />
    </div>
  );
}
