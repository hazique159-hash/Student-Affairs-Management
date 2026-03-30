'use client';

import { BarChart2, Users, UserCheck, Loader2, MessageSquareWarning, Clock } from 'lucide-react';
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

  const pendingComplaintsCount = complaints?.filter(c => c.status === 'Pending').length ?? 0;

  const isLoading = isLoadingStudents || isLoadingTeachers || isLoadingComplaints;

  return (
    <div className="flex flex-col gap-4 h-full md:max-h-[calc(100vh-4rem)] overflow-y-auto md:overflow-hidden pb-10 md:pb-0">
      <PageHeader
        title="Analytics Dashboard"
        icon={BarChart2}
        className="shrink-0"
      />

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 shrink-0">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 pt-4">
            <CardTitle className="text-sm font-medium">
              Total Students
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="pb-4">
            {isLoadingStudents ? (
               <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              <div className="text-xl font-bold">{students?.length ?? 0}</div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 pt-4">
            <CardTitle className="text-sm font-medium">
              Total Teachers
            </CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="pb-4">
            {isLoadingTeachers ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              <div className="text-xl font-bold">{teachers?.length ?? 0}</div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 pt-4">
            <CardTitle className="text-sm font-medium">
              Total Complaints
            </CardTitle>
            <MessageSquareWarning className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="pb-4">
            {isLoadingComplaints ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              <div className="text-xl font-bold">{complaints?.length ?? 0}</div>
            )}
          </CardContent>
        </Card>
        <Card className="bg-red-200 border-red-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 pt-4">
            <CardTitle className="text-sm font-medium text-black">
              Pending Complaints
            </CardTitle>
            <Clock className="h-4 w-4 text-black" />
          </CardHeader>
          <CardContent className="pb-4">
            {isLoadingComplaints ? (
              <Loader2 className="h-6 w-6 animate-spin text-black" />
            ) : (
              <div className="text-xl font-bold text-black">{pendingComplaintsCount}</div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="flex-1 min-h-[300px] md:min-h-0">
        <AnalyticsChart 
          students={students || []} 
          teachers={teachers || []} 
          complaints={complaints || []}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}
