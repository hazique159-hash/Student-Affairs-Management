'use client';
import { ShieldQuestion, Loader2, Trash2, Search, Download } from 'lucide-react';
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
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function ComplaintsPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [viewingComplaint, setViewingComplaint] = useState<Complaint | null>(null);
  
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

  const studentComplaintCounts = useMemo(() => {
    if (!students) return {};
    return students.reduce((acc, student) => {
      acc[student.id] = student.complaintCount ?? 0;
      return acc;
    }, {} as Record<string, number>);
  }, [students]);

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
  }, [isUserLoading, isAdmin, router]);

  const handleStatusUpdate = async (complaint: Complaint, newStatus: 'Approved' | 'Rejected' | 'Resolved') => {
    if (!firestore || !isAdmin) return;
    setUpdatingId(complaint.id);

    try {
        const batch = writeBatch(firestore);
        const regId = complaint.studentId.toUpperCase();

        const masterComplaintRef = doc(firestore, 'complaints', complaint.id);
        batch.update(masterComplaintRef, { status: newStatus });

        if (newStatus === 'Approved') {
            const studentRef = doc(firestore, 'students', regId);
            batch.update(studentRef, { complaintCount: increment(1) });
        }

        const studentUserQuery = query(collection(firestore, 'users'), where('studentId', '==', regId));
        const studentUserSnapshot = await getDocs(studentUserQuery);
        if (!studentUserSnapshot.empty) {
            const studentUid = studentUserSnapshot.docs[0].id;
            const studentComplaintRef = doc(firestore, `users/${studentUid}/complaints`, complaint.id);
            batch.update(studentComplaintRef, { status: newStatus });
        }

        if (complaint.filedById) {
            const filerComplaintRef = doc(firestore, `users/${complaint.filedById}/complaints`, complaint.id);
            batch.update(filerComplaintRef, { status: newStatus });
        }
        
        await batch.commit();
        toast({ title: `Status updated: ${newStatus}` });
    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Update Failed', description: error.message });
    } finally {
        setUpdatingId(null);
    }
  };

  const handleDelete = async (complaint: Complaint) => {
    if (!firestore || !isAdmin) return;
    setDeletingId(complaint.id);
    try {
      const batch = writeBatch(firestore);
      batch.delete(doc(firestore, 'complaints', complaint.id));
      if (complaint.filedById) {
        batch.delete(doc(firestore, `users/${complaint.filedById}/complaints`, complaint.id));
      }
      const studentUserQuery = query(collection(firestore, 'users'), where('studentId', '==', complaint.studentId.toUpperCase()));
      const studentUserSnapshot = await getDocs(studentUserQuery);
      if (!studentUserSnapshot.empty) {
          batch.delete(doc(firestore, `users/${studentUserSnapshot.docs[0].id}/complaints`, complaint.id));
      }
      if (complaint.status === 'Approved' || complaint.status === 'Resolved') {
          batch.update(doc(firestore, 'students', complaint.studentId.toUpperCase()), { complaintCount: increment(-1) });
      }
      await batch.commit();
      toast({ title: 'Complaint Deleted' });
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Delete Failed', description: error.message });
    } finally {
      setDeletingId(null);
    }
  };

  const handleDownloadPDF = () => {
    if (!filteredComplaints.length) return;
    const pdf = new jsPDF();
    pdf.text('AffairsConnect - Complaints Report', 14, 15);
    autoTable(pdf, {
      startY: 25,
      head: [['Student', 'ID', 'Violation', 'Status', 'Date']],
      body: filteredComplaints.map(c => [
        c.studentName, c.studentId, c.title, c.status, 
        c.dateSubmitted?.seconds ? format(new Date(c.dateSubmitted.seconds * 1000), 'PPP') : 'N/A'
      ]),
    });
    pdf.save(`complaints-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
  };

  if (isUserLoading || !isAdmin) {
    return <div className="flex items-center justify-center h-full"><Loader2 className="animate-spin" /></div>;
  }

  return (
    <div className="space-y-8">
      <PageHeader title="Complaint Management" icon={ShieldQuestion} description="Review and approve student violations.">
        <Button variant="outline" onClick={handleDownloadPDF} disabled={!filteredComplaints.length}>
            <Download className="mr-2 h-4 w-4" /> Download PDF
        </Button>
      </PageHeader>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
                <CardTitle>Complaint Inbox</CardTitle>
                <CardDescription>View and manage all incoming violation reports.</CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-2">
                <div className="relative w-full md:w-64">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Search..." className="pl-8" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full md:w-[150px]"><SelectValue placeholder="Status" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        <SelectItem value="Pending">Pending</SelectItem>
                        <SelectItem value="Approved">Approved</SelectItem>
                        <SelectItem value="Rejected">Rejected</SelectItem>
                        <SelectItem value="Resolved">Resolved</SelectItem>
                    </SelectContent>
                </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Violations</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredComplaints.map((c) => (
                <TableRow key={c.id}>
                  <TableCell>
                    <div className="font-medium">{c.studentName}</div>
                    <div className="text-xs text-muted-foreground">{c.studentId}</div>
                  </TableCell>
                  <TableCell><Badge variant={(studentComplaintCounts[c.studentId] || 0) > 2 ? 'destructive' : 'outline'}>{studentComplaintCounts[c.studentId] || 0}</Badge></TableCell>
                  <TableCell>{c.title}</TableCell>
                  <TableCell>{c.dateSubmitted?.seconds ? format(new Date(c.dateSubmitted.seconds * 1000), 'PP') : '...'}</TableCell>
                  <TableCell><Badge variant={c.status === 'Rejected' ? 'destructive' : c.status === 'Approved' ? 'default' : 'secondary'}>{c.status}</Badge></TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                        {c.status === 'Pending' && (
                            <>
                                <Button size="sm" onClick={() => handleStatusUpdate(c, 'Approved')} disabled={updatingId === c.id}>Approve</Button>
                                <Button size="sm" variant="outline" onClick={() => handleStatusUpdate(c, 'Rejected')} disabled={updatingId === c.id}>Reject</Button>
                            </>
                        )}
                        <Button variant="ghost" size="sm" onClick={() => setViewingComplaint(c)}>View</Button>
                        <AlertDialog>
                            <AlertDialogTrigger asChild><Button variant="ghost" size="icon" className="text-destructive"><Trash2 className="h-4 w-4"/></Button></AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader><AlertDialogTitle>Delete Complaint?</AlertDialogTitle><AlertDialogDescription>This will remove the record permanently.</AlertDialogDescription></AlertDialogHeader>
                                <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => handleDelete(c)}>Delete</AlertDialogAction></AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {viewingComplaint && (
        <Dialog open={!!viewingComplaint} onOpenChange={() => setViewingComplaint(null)}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader><DialogTitle>{viewingComplaint.title}</DialogTitle></DialogHeader>
                <ScrollArea className="max-h-[60vh] pr-4">
                  <div className="space-y-4 py-4 text-sm">
                      <p><strong>Student:</strong> {viewingComplaint.studentName} ({viewingComplaint.studentId})</p>
                      <p><strong>Description:</strong> {viewingComplaint.description}</p>
                      {viewingComplaint.evidenceUrl && (
                        <div className="space-y-2">
                            <p><strong>Evidence:</strong></p>
                            {viewingComplaint.evidenceUrl.startsWith('data:video/') ? (
                                <video src={viewingComplaint.evidenceUrl} controls className="w-full rounded border" />
                            ) : (
                                <div className="relative aspect-video w-full"><Image src={viewingComplaint.evidenceUrl} alt="Evidence" fill className="object-contain" /></div>
                            )}
                        </div>
                      )}
                  </div>
                </ScrollArea>
                <DialogFooter><Button onClick={() => setViewingComplaint(null)}>Close</Button></DialogFooter>
            </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
