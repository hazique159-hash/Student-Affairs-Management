'use client';

import { BarChart2, Users, UserCheck, Loader2, MessageSquareWarning, Clock, Activity } from 'lucide-react';
import { PageHeader } from '@/components/page-header';
import { AnalyticsChart } from '@/components/analytics-chart';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
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
    () => (firestore ? query(collection(firestore, 'complaints'), orderBy('dateSubmitted', 'desc'), limit(5)) : null),
    [firestore]
  );

  const { data: students, isLoading: isLoadingStudents } = useCollection<Student>(studentsRef);
  const { data: teachers, isLoading: isLoadingTeachers } = useCollection<Teacher>(teachersRef);
  const { data: complaints, isLoading: isLoadingComplaints } = useCollection<Complaint>(complaintsRef);
  const { data: recentComplaints, isLoading: isLoadingRecent } = useCollection<Complaint>(recentComplaintsRef);

  const pendingComplaintsCount = complaints?.filter(c => c.status === 'Pending').length ?? 0;
  const isLoading = isLoadingStudents || isLoadingTeachers || isLoadingComplaints;

  return (
    <div className="space-y-6 pb-10">
      <PageHeader
        title="Institutional Analytics"
        icon={BarChart2}
        description="Comprehensive overview of student affairs, department metrics, and resolution status."
      />

      {/* Top Stats Row */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-sm border-l-4 border-l-primary">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              Enrolled Students
            </CardTitle>
            <Users className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            {isLoadingStudents ? (
               <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              <div className="text-3xl font-bold">{students?.length ?? 0}</div>
            )}
            <p className="text-xs text-muted-foreground mt-1">Active registrations</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-l-4 border-l-accent">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              Faculty Members
            </CardTitle>
            <UserCheck className="h-5 w-5 text-accent" />
          </CardHeader>
          <CardContent>
            {isLoadingTeachers ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              <div className="text-3xl font-bold">{teachers?.length ?? 0}</div>
            )}
            <p className="text-xs text-muted-foreground mt-1">Verified educators</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              Total Reports
            </CardTitle>
            <MessageSquareWarning className="h-5 w-5 text-blue-500" />
          </CardHeader>
          <CardContent>
            {isLoadingComplaints ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              <div className="text-3xl font-bold">{complaints?.length ?? 0}</div>
            )}
            <p className="text-xs text-muted-foreground mt-1">Historical violations</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-l-4 border-l-destructive bg-destructive/5">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-destructive uppercase tracking-wider">
              Critical Actions
            </CardTitle>
            <Clock className="h-5 w-5 text-destructive" />
          </CardHeader>
          <CardContent>
            {isLoadingComplaints ? (
              <Loader2 className="h-6 w-6 animate-spin text-destructive" />
            ) : (
              <div className="text-3xl font-bold text-destructive">{pendingComplaintsCount}</div>
            )}
            <p className="text-xs text-destructive/70 mt-1">Awaiting review</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Charts Section */}
        <div className="lg:col-span-2 space-y-6">
          <AnalyticsChart 
            students={students || []} 
            teachers={teachers || []} 
            complaints={complaints || []}
            isLoading={isLoading}
          />
        </div>

        {/* Sidebar Activity Section */}
        <Card className="flex flex-col h-full shadow-sm">
          <CardHeader className="border-b bg-muted/30">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              <div>
                <CardTitle className="text-lg">Recent Activity</CardTitle>
                <CardDescription>Latest violation reports</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0 flex-1">
            <ScrollArea className="h-[450px]">
              <div className="divide-y">
                {isLoadingRecent ? (
                  <div className="flex justify-center p-8"><Loader2 className="animate-spin h-8 w-8 text-muted-foreground" /></div>
                ) : recentComplaints && recentComplaints.length > 0 ? (
                  recentComplaints.map((c) => (
                    <div key={c.id} className="p-4 hover:bg-muted/40 transition-colors">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-sm truncate max-w-[150px]">{c.studentName}</span>
                        <Badge variant={c.status === 'Pending' ? 'destructive' : 'secondary'} className="text-[10px]">
                          {c.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-1 mb-2">{c.title}</p>
                      <div className="flex items-center justify-between text-[10px] text-muted-foreground italic">
                        <span>{c.studentId}</span>
                        <span>
                          {c.dateSubmitted?.seconds 
                            ? format(new Date(c.dateSubmitted.seconds * 1000), 'MMM d, h:mm a') 
                            : 'Recently'}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center text-sm text-muted-foreground">No recent activity recorded.</div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
