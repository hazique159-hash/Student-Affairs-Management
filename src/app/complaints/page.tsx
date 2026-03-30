'use client';
import { ShieldQuestion, Loader2, Trash2, Image as ImageIcon, Film, Download, Search, FilterX } from 'lucide-react';
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
import { Badge } from '@/components/ui/badge';
import { useUser, useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import type { Complaint, Student } from '@/lib/types';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useMemo } from 'react';
import { collection, query, orderBy, writeBatch, doc, getDocs, where, increment } from 'firebase/firestore';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import Image from 'next/image';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function ComplaintsPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [viewingComplaint, setViewingComplaint] = useState<Complaint | null>(null);
  
  // Filter States
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  const isAdmin = user?.email === 'studentaffairs316@gmail.com' || user?.email?.endsWith('@admin.com');

  const complaintsRef = useMemoFirebase(
    () =>
      firestore && isAdmin
        ? query(collection(firestore, 'complaints'), orderBy('dateSubmitted', 'desc'))
        : null,
    [firestore, isAdmin]
  );
  const { data: complaints, isLoading: isLoadingComplaints } = useCollection<Complaint>(complaintsRef);

  const studentsRef = useMemoFirebase(
    () => (firestore && isAdmin ? collection(firestore, 'students') : null),
    [firestore, isAdmin]
  );
  const { data: students, isLoading: isLoadingStudents } = useCollection<Student>(studentsRef);

  const isLoading = isUserLoading || isLoadingComplaints || isLoadingStudents;

  const studentComplaintCounts = useMemo(() => {
    if (!students) return {};
    return students.reduce((acc, student) => {
      acc[student.id] = student.complaintCount ?? 0;
      return acc;
    }, {} as Record<string, number>);
  }, [students]);

  // Filtered Data Logic
  const filteredComplaints = useMemo(() => {
    if (!complaints) return [];
    return complaints.filter((c) => {
      const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
      const matchesSearch = 
        c.studentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.title.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesStatus && matchesSearch;
    });
  }, [complaints, statusFilter, searchTerm]);

  useEffect(() => {
    if (!isUserLoading && !isAdmin) {
      router.push('/announcements');
    }
  }, [isUserLoading, user, isAdmin, router]);

  const handleStatusUpdate = async (complaint: Complaint, newStatus: 'Approved' | 'Rejected' | 'Resolved') => {
    if (!firestore || !isAdmin) return;
    setUpdatingId(complaint.id);

    try {
        const batch = writeBatch(firestore);

        const masterComplaintRef = doc(firestore, 'complaints', complaint.id);
        batch.update(masterComplaintRef, { status: newStatus });

        const filerComplaintRef = doc(firestore, `users/${complaint.filedById}/complaints`, complaint.id);
        batch.update(filerComplaintRef, { status: newStatus });

        if (newStatus === 'Approved' && complaint.status !== 'Approved') {
            const studentRef = doc(firestore, 'students', complaint.studentId);
            batch.update(studentRef, { complaintCount: increment(1) });
        }
        
        const studentUserQuery = query(collection(firestore, 'users'), where('studentId', '==', complaint.studentId));
        const studentUserSnapshot = await getDocs(studentUserQuery);

        if (!studentUserSnapshot.empty) {
            const studentUserDoc = studentUserSnapshot.docs[0];
            const studentComplaintRef = doc(firestore, `users/${studentUserDoc.id}/complaints`, complaint.id);

            if (newStatus === 'Approved') {
                batch.set(studentComplaintRef, {
                    ...complaint,
                    status: newStatus,
                    dateSubmitted: complaint.dateSubmitted,
                });
            } else if (newStatus === 'Resolved' && complaint.status === 'Approved') {
                batch.update(studentComplaintRef, { status: newStatus });
            }
        }
        
        await batch.commit();
        toast({
            title: `Complaint ${newStatus}`,
            description: `The complaint has been marked as ${newStatus.toLowerCase()}.`
        });

    } catch (error: any) {
        toast({
            variant: 'destructive',
            title: 'Update Failed',
            description: error.message || 'Could not update the complaint status.'
        });
    } finally {
        setUpdatingId(null);
    }
  };

  const handleDelete = async (complaint: Complaint) => {
    if (!firestore || !isAdmin) return;
    setDeletingId(complaint.id);

    try {
      const batch = writeBatch(firestore);

      const masterComplaintRef = doc(firestore, 'complaints', complaint.id);
      batch.delete(masterComplaintRef);

      const filerComplaintRef = doc(firestore, `users/${complaint.filedById}/complaints`, complaint.id);
      batch.delete(filerComplaintRef);

      const studentUserQuery = query(collection(firestore, 'users'), where('studentId', '==', complaint.studentId));
      const studentUserSnapshot = await getDocs(studentUserQuery);
      if (!studentUserSnapshot.empty) {
          const studentUserDoc = studentUserSnapshot.docs[0];
          const studentComplaintRef = doc(firestore, `users/${studentUserDoc.id}/complaints`, complaint.id);
          batch.delete(studentComplaintRef);
      }
      
      if (complaint.status === 'Approved' || complaint.status === 'Resolved') {
          const studentRef = doc(firestore, 'students', complaint.studentId);
          batch.update(studentRef, { complaintCount: increment(-1) });
      }

      await batch.commit();
      toast({
          title: 'Complaint Deleted',
          description: `The complaint against ${complaint.studentName} has been permanently deleted.`
      });

    } catch (error: any) {
      toast({
          variant: 'destructive',
          title: 'Delete Failed',
          description: error.message || 'Could not delete the complaint.'
      });
    } finally {
      setDeletingId(null);
    }
  };

  const handleDownloadPDF = () => {
    if (!filteredComplaints || filteredComplaints.length === 0) return;

    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(20);
    doc.setTextColor(40, 40, 40);
    doc.text('AffairsConnect - Student Complaints Report', 14, 15);
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Generated on: ${format(new Date(), 'PPP p')}`, 14, 22);
    doc.text(`Filters: Status: ${statusFilter}, Search: ${searchTerm || 'None'}`, 14, 27);

    const tableData = filteredComplaints.map((c) => [
      c.studentName,
      c.studentId,
      c.title,
      c.filedByName,
      c.status,
      c.dateSubmitted?.seconds ? format(new Date(c.dateSubmitted.seconds * 1000), 'PPP') : 'N/A'
    ]);

    autoTable(doc, {
      startY: 35,
      head: [['Student Name', 'Reg No', 'Violation', 'Teacher', 'Status', 'Date Submitted']],
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: [59, 130, 246] }, // Primary color
      styles: { fontSize: 8 },
    });

    doc.save(`complaints-report-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
    
    toast({
      title: 'PDF Generated',
      description: 'Your report has been downloaded.',
    });
  };

  const isVideo = (url?: string) => {
    if (!url) return false;
    return url.startsWith('data:video/') || url.match(/\.(mp4|webm|ogg)$/i);
  };

  const resetFilters = () => {
    setStatusFilter('all');
    setSearchTerm('');
  };

  if (isLoading || !isAdmin) {
    return <div className="flex items-center justify-center h-full"><Loader2 className="animate-spin" /></div>;
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Complaint Management"
        icon={ShieldQuestion}
        description="Review, approve, and manage all student complaints."
      >
        <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleDownloadPDF} disabled={filteredComplaints.length === 0}>
                <Download className="mr-2 h-4 w-4" />
                Download PDF
            </Button>
        </div>
      </PageHeader>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
                <CardTitle>Complaint Inbox</CardTitle>
                <CardDescription>
                    Filter and manage incoming student complaints.
                </CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-2">
                <div className="relative w-full md:w-64">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input 
                        placeholder="Search student or title..." 
                        className="pl-8" 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full md:w-[150px]">
                        <SelectValue placeholder="All Statuses" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        <SelectItem value="Pending">Pending</SelectItem>
                        <SelectItem value="Approved">Approved</SelectItem>
                        <SelectItem value="Rejected">Rejected</SelectItem>
                        <SelectItem value="Resolved">Resolved</SelectItem>
                    </SelectContent>
                </Select>
                {(statusFilter !== 'all' || searchTerm !== '') && (
                    <Button variant="ghost" size="icon" onClick={resetFilters} title="Clear Filters">
                        <FilterX className="h-4 w-4" />
                    </Button>
                )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Complaint No.</TableHead>
                <TableHead>Teacher</TableHead>
                <TableHead>Violation</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredComplaints && filteredComplaints.length > 0 ? (
                filteredComplaints.map((complaint) => (
                  <TableRow key={complaint.id}>
                    <TableCell>
                      <div className="font-medium">{complaint.studentName}</div>
                      <div className="text-sm text-muted-foreground">{complaint.studentId}</div>
                    </TableCell>
                    <TableCell>
                        <Badge variant={(studentComplaintCounts[complaint.studentId] ?? 0) > 2 ? 'destructive' : (studentComplaintCounts[complaint.studentId] ?? 0) > 0 ? 'secondary' : 'outline'}>
                            {studentComplaintCounts[complaint.studentId] ?? 0}
                        </Badge>
                    </TableCell>
                    <TableCell>{complaint.filedByName}</TableCell>
                    <TableCell>{complaint.title}</TableCell>
                    <TableCell>{complaint.dateSubmitted?.seconds ? format(new Date(complaint.dateSubmitted.seconds * 1000), 'PPP') : 'N/A'}</TableCell>
                    <TableCell>
                        <Badge
                            variant={
                            complaint.status === 'Rejected'
                                ? 'destructive'
                                : complaint.status === 'Resolved'
                                ? 'secondary'
                                : complaint.status === 'Approved'
                                ? 'default'
                                : 'outline'
                            }
                        >
                            {complaint.status}
                        </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                       <div className="flex items-center justify-end gap-2">
                        {complaint.status === 'Pending' && isAdmin && (
                            <>
                                <Button size="sm" onClick={() => handleStatusUpdate(complaint, 'Approved')} disabled={updatingId === complaint.id}>
                                   {updatingId === complaint.id ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Approve'}
                                </Button>
                                <Button size="sm" variant="outline" onClick={() => handleStatusUpdate(complaint, 'Rejected')} disabled={updatingId === complaint.id}>
                                   Reject
                                </Button>
                            </>
                          )}
                          {complaint.status === 'Approved' && isAdmin && (
                            <Button size="sm" variant="outline" onClick={() => handleStatusUpdate(complaint, 'Resolved')} disabled={updatingId === complaint.id}>
                                {updatingId === complaint.id ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Resolve'}
                            </Button>
                          )}
                          
                          <Button variant="ghost" size="sm" onClick={() => setViewingComplaint(complaint)}>View Details</Button>
                          
                          {isAdmin && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" disabled={deletingId === complaint.id}>
                                  {deletingId === complaint.id ? <Loader2 className="h-4 w-4 animate-spin"/> :<Trash2 className="h-4 w-4" />}
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This action cannot be undone. This will permanently delete the complaint regarding "{complaint.title}".
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDelete(complaint)} disabled={deletingId === complaint.id}>
                                    {deletingId === complaint.id && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Delete Complaint
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                       </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                    <TableCell colSpan={7} className="text-center h-24">
                        {searchTerm || statusFilter !== 'all' ? 'No complaints match your filters.' : 'There are no complaints at this time.'}
                    </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {viewingComplaint && (
        <Dialog open={!!viewingComplaint} onOpenChange={(isOpen) => !isOpen && setViewingComplaint(null)}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>{viewingComplaint.title}</DialogTitle>
                    <DialogDescription>
                        Details for the complaint filed on {viewingComplaint.dateSubmitted?.seconds ? format(new Date(viewingComplaint.dateSubmitted.seconds * 1000), 'PPP') : 'N/A'}.
                    </DialogDescription>
                </DialogHeader>
                <Separator />
                <ScrollArea className="max-h-[60vh] pr-4">
                  <div className="grid gap-4 py-4 text-sm">
                      <div className="grid grid-cols-3 items-center gap-4">
                          <span className="font-semibold text-muted-foreground">Student</span>
                          <span className="col-span-2">{viewingComplaint.studentName} ({viewingComplaint.studentId})</span>
                      </div>
                      <div className="grid grid-cols-3 items-center gap-4">
                          <span className="font-semibold text-muted-foreground">Filed By</span>
                          <span className="col-span-2">{viewingComplaint.filedByName}</span>
                      </div>
                      <div className="grid grid-cols-3 items-center gap-4">
                          <span className="font-semibold text-muted-foreground">Status</span>
                          <span className="col-span-2"><Badge variant={viewingComplaint.status === 'Rejected' ? 'destructive' : viewingComplaint.status === 'Resolved' ? 'secondary' : viewingComplaint.status === 'Approved' ? 'default' : 'outline'}>{viewingComplaint.status}</Badge></span>
                      </div>
                      
                      <Separator />
                      
                      <div>
                          <p className="font-semibold mb-2 text-muted-foreground">Description</p>
                          <p className="whitespace-pre-wrap">{viewingComplaint.description}</p>
                      </div>

                      {viewingComplaint.evidenceUrl && (
                        <>
                          <Separator />
                          <div>
                            <p className="font-semibold mb-3 text-muted-foreground flex items-center gap-2">
                              {isVideo(viewingComplaint.evidenceUrl) ? <Film className="h-4 w-4" /> : <ImageIcon className="h-4 w-4" />}
                              Attached Evidence
                            </p>
                            <div className="relative border rounded-lg overflow-hidden bg-black flex items-center justify-center">
                              {isVideo(viewingComplaint.evidenceUrl) ? (
                                <video 
                                  src={viewingComplaint.evidenceUrl} 
                                  controls 
                                  className="max-h-[300px] w-full"
                                />
                              ) : (
                                <div className="relative aspect-video w-full h-[250px]">
                                  <Image
                                    src={viewingComplaint.evidenceUrl}
                                    alt="Complaint Evidence"
                                    fill
                                    className="object-contain"
                                  />
                                </div>
                              )}
                            </div>
                          </div>
                        </>
                      )}
                  </div>
                </ScrollArea>
                <DialogFooter>
                    <Button onClick={() => setViewingComplaint(null)}>Close</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
      )}

    </div>
  );
}
