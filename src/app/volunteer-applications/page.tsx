'use client';
import { ClipboardList, Loader2, Phone, Briefcase, MessageSquare, Download } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { PageHeader } from '@/components/page-header';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useUser, useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import type { VolunteerApplication } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { collection, query, orderBy } from 'firebase/firestore';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function VolunteerApplicationsPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();

  const applicationsRef = useMemoFirebase(
    () =>
      firestore
        ? query(collection(firestore, 'volunteerApplications'), orderBy('dateApplied', 'desc'))
        : null,
    [firestore]
  );
  const { data: applications, isLoading: isLoadingApplications } = useCollection<VolunteerApplication>(applicationsRef);

  const isLoading = isUserLoading || isLoadingApplications;

  const isAdmin = user?.email === 'studentaffairs316@gmail.com' || user?.email?.endsWith('@admin.com');
  
  useEffect(() => {
    if (!isUserLoading && !isAdmin) {
      router.push('/announcements');
    }
  }, [isUserLoading, user, isAdmin, router]);

  const handleDownloadPDF = () => {
    if (!applications || applications.length === 0) return;

    const pdf = new jsPDF();
    pdf.text('AffairsConnect - Volunteer Applications Report', 14, 15);
    
    const tableData = applications.map(app => [
      app.studentName,
      app.studentId,
      app.department || 'N/A',
      app.semester ? `${app.semester} Sem` : 'N/A',
      app.eventName,
      app.whatsappNumber || app.phoneNumber || 'N/A',
      app.dateApplied?.seconds ? format(new Date(app.dateApplied.seconds * 1000), 'MMM d, yyyy') : 'N/A'
    ]);

    autoTable(pdf, {
      startY: 25,
      head: [['Student', 'ID', 'Dept', 'Sem', 'Event', 'Contact', 'Applied On']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillStyle: 'DF', fillColor: [79, 70, 229] }, // Primary color
    });

    pdf.save(`volunteer-applications-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
  };

  if (isLoading || !isAdmin) {
    return <div className="flex items-center justify-center h-full"><Loader2 className="animate-spin" /></div>;
  }

  return (
    <div className="space-y-8 pb-10">
      <PageHeader
        title="Volunteer Applications"
        icon={ClipboardList}
        description="Review student volunteer applications for upcoming events."
      >
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleDownloadPDF} 
          disabled={!applications || applications.length === 0}
          className="w-full sm:w-auto"
        >
          <Download className="mr-2 h-4 w-4" />
          Download List
        </Button>
      </PageHeader>

      <Card>
        <CardHeader>
          <CardTitle>Applicant List</CardTitle>
          <CardDescription>
            A comprehensive list of students who have applied for volunteer roles.
          </CardDescription>
        </CardHeader>
        <CardContent className="px-0 sm:px-6">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[150px]">Student Info</TableHead>
                  <TableHead className="min-w-[120px]">Event</TableHead>
                  <TableHead className="min-w-[100px]">Applied On</TableHead>
                  <TableHead className="min-w-[200px]">Reason & Contact</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading &&
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-40" /></TableCell>
                    </TableRow>
                  ))}
                {!isLoading && applications && applications.length > 0 ? (
                  applications.map((app) => (
                    <TableRow key={app.id}>
                      <TableCell>
                        <div className="space-y-1">
                            <div className="font-bold text-sm">{app.studentName}</div>
                            <div className="flex gap-2 items-center">
                              <div className="text-[10px] text-muted-foreground uppercase font-mono">{app.studentId}</div>
                              {app.semester && <div className="text-[10px] bg-secondary px-1 rounded">{app.semester} Sem</div>}
                            </div>
                            <div className="flex flex-col gap-1 mt-1">
                                {app.department && (
                                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                                        <Briefcase className="h-3 w-3" />
                                        {app.department}
                                    </div>
                                )}
                            </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm font-medium">{app.eventName}</TableCell>
                      <TableCell className="text-xs">
                          {app.dateApplied?.seconds ? format(new Date(app.dateApplied.seconds * 1000), 'MMM d, yyyy') : 'N/A'}
                      </TableCell>
                      <TableCell>
                          <div className="space-y-2">
                            <p className="text-xs leading-relaxed italic text-muted-foreground max-w-[300px]">
                                "{app.reason}"
                            </p>
                            <div className="flex flex-wrap gap-2">
                                {app.whatsappNumber && (
                                    <div className="flex items-center gap-1 text-[10px] text-green-600 font-bold bg-green-50 px-2 py-0.5 rounded-full border border-green-200">
                                        <MessageSquare className="h-3 w-3" />
                                        {app.whatsappNumber}
                                    </div>
                                )}
                                {app.phoneNumber && (
                                    <div className="flex items-center gap-1 text-[10px] text-blue-600 font-bold bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                                        <Phone className="h-3 w-3" />
                                        {app.phoneNumber}
                                    </div>
                                )}
                            </div>
                          </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  !isLoading && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center h-32 text-muted-foreground italic">
                        No applications found.
                      </TableCell>
                    </TableRow>
                  )
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
