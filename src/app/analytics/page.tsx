'use client';

import { useState, useMemo } from 'react';
import { BarChart2, Users, UserCheck, Loader2, MessageSquareWarning, Clock, Activity, Filter, Calendar } from 'lucide-react';
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
import { format, subDays, isAfter, startOfDay } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const DEPARTMENTS = [
  'All Departments',
  'Computer Science',
  'Software Engineering',
  'Mathematics',
  'Electrical Engineering',
  'Mechanical Engineering',
  'Civil Engineering',
  'Management Sciences',
  'Accounting & Finance',
  'Psychology',
  'English',
  'Bioinformatics & Biosciences',
  'Pharmacy',
  'Law',
] as const;

const TIME_RANGES = [
  'Today',
  'Last 7 Days',
  'Last 30 Days',
  'Last 90 Days',
  'Last 180 Days',
  'Last 365 Days',
  'All Time',
] as const;

export default function AnalyticsPage() {
  const firestore = useFirestore();
  const [deptFilter, setDeptFilter] = useState<string>('All Departments');
  const [timeFilter, setTimeFilter] = useState<string>('All Time');

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

  const { data: studentsData, isLoading: isLoadingStudents } = useCollection<Student>(studentsRef);
  const { data: teachersData, isLoading: isLoadingTeachers } = useCollection<Teacher>(teachersRef);
  const { data: complaintsData, isLoading: isLoadingComplaints } = useCollection<Complaint>(complaintsRef);
  const { data: recentComplaints, isLoading: isLoadingRecent } = useCollection<Complaint>(recentComplaintsRef);

  const filteredData = useMemo(() => {
    if (!studentsData || !teachersData || !complaintsData) return null;

    let students = [...studentsData];
    let teachers = [...teachersData];
    let complaints = [...complaintsData];

    // Dept Filtering
    if (deptFilter !== 'All Departments') {
      students = students.filter(s => s.department === deptFilter);
      teachers = teachers.filter(t => t.department === deptFilter);
      const deptStudentIds = new Set(students.map(s => s.id));
      complaints = complaints.filter(c => deptStudentIds.has(c.studentId));
    }

    // Time Filtering
    if (timeFilter !== 'All Time') {
      let cutoff: Date;
      const now = new Date();
      
      switch (timeFilter) {
        case 'Today': cutoff = startOfDay(now); break;
        case 'Last 7 Days': cutoff = subDays(now, 7); break;
        case 'Last 30 Days': cutoff = subDays(now, 30); break;
        case 'Last 90 Days': cutoff = subDays(now, 90); break;
        case 'Last 180 Days': cutoff = subDays(now, 180); break;
        case 'Last 365 Days': cutoff = subDays(now, 365); break;
        default: cutoff = new Date(0);
      }

      complaints = complaints.filter(c => {
        if (!c.dateSubmitted?.seconds) return false;
        return isAfter(new Date(c.dateSubmitted.seconds * 1000), cutoff);
      });
    }

    return { students, teachers, complaints };
  }, [studentsData, teachersData, complaintsData, deptFilter, timeFilter]);

  const isLoading = isLoadingStudents || isLoadingTeachers || isLoadingComplaints;

  return (
    <div className="space-y-6 pb-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <PageHeader
          title="Dashboard Overview"
          icon={BarChart2}
          description="Real-time institutional metrics and activity."
        />
        <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 bg-white/80 backdrop-blur-sm border rounded-lg px-3 py-1.5 shadow-sm">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <Select value={deptFilter} onValueChange={setDeptFilter}>
                    <SelectTrigger className="w-[180px] border-none shadow-none focus:ring-0 h-8 text-xs bg-transparent">
                        <SelectValue placeholder="Department" />
                    </SelectTrigger>
                    <SelectContent>
                        {DEPARTMENTS.map(d => <SelectItem key={d} value={d} className="text-xs">{d}</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>
            <div className="flex items-center gap-2 bg-white/80 backdrop-blur-sm border rounded-lg px-3 py-1.5 shadow-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <Select value={timeFilter} onValueChange={setTimeFilter}>
                    <SelectTrigger className="w-[140px] border-none shadow-none focus:ring-0 h-8 text-xs bg-transparent">
                        <SelectValue placeholder="Time Range" />
                    </SelectTrigger>
                    <SelectContent>
                        {TIME_RANGES.map(range => (
                          <SelectItem key={range} value={range} className="text-xs">{range}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-md border-l-4 border-l-[#4F46E5] bg-white dark:bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Students</CardTitle>
            <Users className="h-4 w-4 text-[#4F46E5]" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold tracking-tight">
                {isLoadingStudents ? <Loader2 className="h-6 w-6 animate-spin" /> : filteredData?.students.length ?? 0}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-md border-l-4 border-l-[#A855F7] bg-white dark:bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Faculty</CardTitle>
            <UserCheck className="h-4 w-4 text-[#A855F7]" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold tracking-tight">
                {isLoadingTeachers ? <Loader2 className="h-6 w-6 animate-spin" /> : filteredData?.teachers.length ?? 0}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-md border-l-4 border-l-[#2563EB] bg-white dark:bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Reports</CardTitle>
            <MessageSquareWarning className="h-4 w-4 text-[#2563EB]" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold tracking-tight">
                {isLoadingComplaints ? <Loader2 className="h-6 w-6 animate-spin" /> : filteredData?.complaints.length ?? 0}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-md border-l-4 border-l-[#EF4444] bg-white dark:bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-[10px] font-bold text-[#EF4444] uppercase tracking-widest">Pending</CardTitle>
            <Clock className="h-4 w-4 text-[#EF4444]" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold tracking-tight text-[#EF4444]">
                {isLoadingComplaints ? <Loader2 className="h-6 w-6 animate-spin" /> : filteredData?.complaints.filter(c => c.status === 'Pending').length ?? 0}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-4 items-stretch">
        <div className="lg:col-span-3">
          <AnalyticsChart 
            students={filteredData?.students || []} 
            teachers={filteredData?.teachers || []} 
            complaints={filteredData?.complaints || []}
            isLoading={isLoading}
            deptLabel={deptFilter}
          />
        </div>

        <Card className="flex flex-col shadow-lg bg-white dark:bg-card h-full min-h-[400px]">
          <CardHeader className="border-b bg-muted/20 p-4">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-[#4F46E5]" />
              <CardTitle className="text-sm font-bold tracking-tight">Recent Activity</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-0 flex-1 overflow-hidden">
            <ScrollArea className="h-[450px]">
              <div className="divide-y divide-border/40">
                {isLoadingRecent ? (
                  <div className="flex justify-center p-8"><Loader2 className="animate-spin h-6 w-6 text-muted-foreground" /></div>
                ) : recentComplaints && recentComplaints.length > 0 ? (
                  recentComplaints.map((c) => (
                    <div key={c.id} className="p-4 hover:bg-muted/10 transition-colors group">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-sm truncate max-w-[140px] text-foreground">{c.studentName}</span>
                        <Badge variant={c.status === 'Pending' ? 'destructive' : 'secondary'} className="text-[9px] h-4 px-1.5 font-bold uppercase">
                          {c.status}
                        </Badge>
                      </div>
                      <p className="text-[11px] text-muted-foreground line-clamp-1 mb-2 italic">"{c.title}"</p>
                      <div className="flex items-center justify-between text-[10px] text-muted-foreground/80 font-mono">
                        <span>{c.studentId}</span>
                        <span>
                          {c.dateSubmitted?.seconds 
                            ? format(new Date(c.dateSubmitted.seconds * 1000), 'MMM d, h:mm a') 
                            : 'Just now'}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-12 text-center text-xs text-muted-foreground italic">No recent logs available.</div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
