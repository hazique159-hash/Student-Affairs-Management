'use client';

import { BarChart2, Users, UserCheck, Loader2, MessageSquareWarning, Clock, Activity } from 'lucide-react';
import { PageHeader } from '@/components/page-header';
import { AnalyticsChart } from '@/components/analytics-chart';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, limit } from 'firebase/firestore';
import type { Student, Teacher, Complaint } from '@/lib/types';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

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
  const recentComplaintsRef = useMemoFirebase(
    () => (firestore ? query(collection(firestore, 'complaints'), orderBy('dateSubmitted', 'desc'), limit(10)) : null),
    [firestore]
  );

  const { data: students, isLoading: isLoadingStudents } = useCollection<Student>(studentsRef);
  const { data: teachers, isLoading: isLoadingTeachers } = useCollection<Teacher>(teachersRef);
  const { data: complaints, isLoading: isLoadingComplaints } = useCollection<Complaint>(complaintsRef);
  const { data: recentComplaints, isLoading: isLoadingRecent } = useCollection<Complaint>(recentComplaintsRef);

  const pendingComplaintsCount = complaints?.filter(c => c.status === 'Pending').length ?? 0;
  const isLoading = isLoadingStudents || isLoadingTeachers || isLoadingComplaints;

  return (
    <div className="space-y-4 pb-4">
      <PageHeader
        title="Dashboard Overview"
        icon={BarChart2}
        description="Real-time institutional metrics and activity."
      />

      {/* Top Stats Row - Compact */}
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-sm border-l-4 border-l-primary">
          <CardHeader className="flex flex-row items-center justify-between pb-1 pt-4">
            <CardTitle className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              Students
            </CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent className="pb-4">
            {isLoadingStudents ? (
               <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <div className="text-xl font-bold">{students?.length ?? 0}</div>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-sm border-l-4 border-l-accent">
          <CardHeader className="flex flex-row items-center justify-between pb-1 pt-4">
            <CardTitle className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              Faculty
            </CardTitle>
            <UserCheck className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent className="pb-4">
            {isLoadingTeachers ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <div className="text-xl font-bold">{teachers?.length ?? 0}</div>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-sm border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between pb-1 pt-4">
            <CardTitle className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              Total Reports
            </CardTitle>
            <MessageSquareWarning className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent className="pb-4">
            {isLoadingComplaints ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <div className="text-xl font-bold">{complaints?.length ?? 0}</div>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-sm border-l-4 border-l-destructive bg-destructive/5">
          <CardHeader className="flex flex-row items-center justify-between pb-1 pt-4">
            <CardTitle className="text-[10px] font-bold text-destructive uppercase tracking-wider">
              Pending
            </CardTitle>
            <Clock className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent className="pb-4">
            {isLoadingComplaints ? (
              <Loader2 className="h-4 w-4 animate-spin text-destructive" />
            ) : (
              <div className="text-xl font-bold text-destructive">{pendingComplaintsCount}</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid - Optimized for single page height */}
      <div className="grid gap-4 lg:grid-cols-4">
        {/* Charts Section */}
        <div className="lg:col-span-3 space-y-4">
          <AnalyticsChart 
            students={students || []} 
            teachers={teachers || []} 
            complaints={complaints || []}
            isLoading={isLoading}
          />
        </div>

        {/* Sidebar Activity Section */}
        <Card className="flex flex-col h-full shadow-sm max-h-[600px]">
          <CardHeader className="border-b bg-muted/30 p-4">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" />
              <CardTitle className="text-sm">Recent Activity</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-0 flex-1 overflow-hidden">
            <ScrollArea className="h-full">
              <div className="divide-y">
                {isLoadingRecent ? (
                  <div className="flex justify-center p-8"><Loader2 className="animate-spin h-6 w-6 text-muted-foreground" /></div>
                ) : recentComplaints && recentComplaints.length > 0 ? (
                  recentComplaints.map((c) => (
                    <div key={c.id} className="p-3 hover:bg-muted/40 transition-colors">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-xs truncate max-w-[100px]">{c.studentName}</span>
                        <Badge variant={c.status === 'Pending' ? 'destructive' : 'secondary'} className="text-[8px] h-4 px-1">
                          {c.status}
                        </Badge>
                      </div>
                      <p className="text-[10px] text-muted-foreground line-clamp-1 mb-1">{c.title}</p>
                      <div className="flex items-center justify-between text-[8px] text-muted-foreground italic">
                        <span>{c.studentId}</span>
                        <span>
                          {c.dateSubmitted?.seconds 
                            ? format(new Date(c.dateSubmitted.seconds * 1000), 'MMM d') 
                            : 'Just now'}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center text-xs text-muted-foreground">No recent records.</div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
