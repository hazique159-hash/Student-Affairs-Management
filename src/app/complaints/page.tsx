
'use client';
import { ShieldQuestion, Loader2, Trash2, Search, Download, Eye, MessageCircle } from 'lucide-react';
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
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { sendTargetedNotification } from '../notifications/actions';

export default function ComplaintsPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [viewingComplaint, setViewingComplaint] = useState<Complaint | null>(null);
  const [viewingReceipt, setViewingReceipt] = useState<string | null>(null);
  
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

  const studentMap = useMemo(() => {
    if (!students) return new Map<string, Student>();
    return new Map(students.map(s => [s.id, s]));
  }, [students]);

  const filteredComplaints = useMemo(() => {
    if (!complaints) return [];
    // Filter to only show TEACHER filed violations (misconduct)
    // Legacy complaints (without type) are assumed violations for transition
    return complaints.filter((c) => {
      const isViolation = !c.complaintType || c.complaintType === 'violation';
      if (!isViolation) return false;

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
        const student = studentMap.get(regId);

        const updateData: Partial<Complaint> = { status: newStatus };
        if (newStatus === 'Resolved') {
            updateData.paymentStatus = 'Verified';
        }

        const masterComplaintRef = doc(firestore, 'complaints', complaint.id);
        batch.update(masterComplaintRef, updateData);

        if (newStatus === 'Approved') {
            const studentRef = doc(firestore, 'students', regId);
            batch.update(studentRef, { complaintCount: increment(1) });

            // AUTOMATED EMAIL NOTIFICATION
            if (student) {
                const studentEmail = student.email || `${student.id}@student.com`;
                await sendTargetedNotification(
                    studentEmail,
                    'Fine Issued - AffairsConnect',
                    'Disciplinary Fine Notification',
                    `Dear ${student.firstName},\n\nA violation report filed against you has been Approved.\n\nViolation: ${complaint.title}\nFine Amount: Rs. 1000\n\nPlease log in to the Student Portal (Violation Portal) to view details and upload your payment receipt via Easypaisa to avoid further disciplinary action.`
                );
            }
        }

        const studentUserQuery = query(collection(firestore, 'users'), where('studentId', '==', regId));
        const studentUserSnapshot = await getDocs(studentUserQuery);
        if (!studentUserSnapshot.empty) {
            const studentUid = studentUserSnapshot.docs[0].id;
            const studentComplaintRef = doc(firestore, `users/${studentUid}/complaints`, complaint.id);
            batch.update(studentComplaintRef, updateData);
        }

        if (complaint.filedById) {
            const filerComplaintRef = doc(firestore, `users/${complaint.filedById}/complaints`, complaint.id);
            batch.update(filerComplaintRef, updateData);
        }
        
        await batch.commit();
        toast({ title: `Status updated: ${newStatus}`, description: newStatus === 'Approved' ? 'Student has been notified via email.' : '' });
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

  const openWhatsApp = (complaint: Complaint) => {
    const student = studentMap.get(complaint.studentId.toUpperCase());
    const phone = student?.phoneNumber || student?.phone;
    if (!phone) {
        toast({ variant: 'destructive', title: 'No phone number', description: 'Student contact not found.' });
        return;
    }
    const message = encodeURIComponent(`Hi ${complaint.studentName}, AffairsConnect here. A disciplinary fine has been issued for: ${complaint.title}. Please check your portal to settle the payment.`);
    window.open(`https://wa.me/${phone.replace(/\D/g, '')}?text=${message}`, '_blank');
  };

  const handleDownloadPDF = () => {
    if (!filteredComplaints.length) return;
    const pdf = new jsPDF();
    pdf.text('AffairsConnect - Misconduct Violations Report', 14, 15);
    autoTable(pdf, {
      startY: 25,
      head: [['Student', 'ID', 'Violation', 'Status', 'Date']],
      body: filteredComplaints.map(c => [
        c.studentName, c.studentId, c.title, c.status, 
        c.dateSubmitted?.seconds ? format(new Date(c.dateSubmitted.seconds * 1000), 'PPP') : 'N/A'
      ]),
    });
    pdf.save(`violations-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
  };

  if (isUserLoading || !isAdmin) {
    return <div className="flex items-center justify-center h-full"><Loader2 className="animate-spin" /></div>;
  }

  return (
    <div className="space-y-4 pb-10">
      <PageHeader title="Violation Inbox" icon={ShieldQuestion} description="Review misconduct reports filed by teachers and issue fines.">
        <Button variant="outline" size="sm" onClick={handleDownloadPDF} disabled={!filteredComplaints.length} className="w-full sm:w-auto">
            <Download className="mr-2 h-4 w-4" /> Download PDF
        </Button>
      </PageHeader>

      <Card>
        <CardHeader className="p-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
                <CardTitle className="text-lg">Teacher Reports Feed</CardTitle>
                <CardDescription className="text-[10px]">Filtering only misconduct violations.</CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <div className="relative w-full sm:w-64">
                    <Search className="absolute left-2 top-2 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Search..." className="pl-8 h-8 text-xs" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full sm:w-[130px] h-8 text-xs"><SelectValue placeholder="Status" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all" className="text-xs">All</SelectItem>
                        <SelectItem value="Pending" className="text-xs">Pending</SelectItem>
                        <SelectItem value="Approved" className="text-xs">Approved</SelectItem>
                        <SelectItem value="Rejected" className="text-xs">Rejected</SelectItem>
                        <SelectItem value="Resolved" className="text-xs">Resolved</SelectItem>
                    </SelectContent>
                </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-0 sm:px-4 pb-4">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[120px] text-xs">Student</TableHead>
                  <TableHead className="text-xs">Count</TableHead>
                  <TableHead className="min-w-[150px] text-xs">Violation</TableHead>
                  <TableHead className="min-w-[120px] text-xs">Fine Status</TableHead>
                  <TableHead className="text-xs">Review</TableHead>
                  <TableHead className="text-right text-xs">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredComplaints.length > 0 ? (
                    filteredComplaints.map((c) => (
                    <TableRow key={c.id}>
                        <TableCell>
                        <div className="font-medium text-xs truncate max-w-[100px]">{c.studentName}</div>
                        <div className="text-[10px] text-muted-foreground">{c.studentId}</div>
                        </TableCell>
                        <TableCell><Badge variant={(studentMap.get(c.studentId.toUpperCase())?.complaintCount || 0) > 2 ? 'destructive' : 'outline'} className="text-[10px]">{studentMap.get(c.studentId.toUpperCase())?.complaintCount || 0}</Badge></TableCell>
                        <TableCell className="max-w-[150px] truncate text-xs">{c.title}</TableCell>
                        <TableCell>
                        {c.status === 'Approved' && (
                            <div className="flex items-center gap-2">
                                <Badge variant={c.paymentStatus === 'Submitted' ? 'secondary' : 'outline'} className="text-[10px]">
                                    {c.paymentStatus === 'Submitted' ? 'Receipt Uploaded' : 'Unpaid'}
                                </Badge>
                                {c.paymentReceiptUrl && (
                                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setViewingReceipt(c.paymentReceiptUrl!)}>
                                    <Eye className="h-3 w-3" />
                                    </Button>
                                )}
                            </div>
                        )}
                        {c.status === 'Resolved' && <Badge className="bg-green-100 text-green-700 hover:bg-green-100 text-[10px]">Fine Settled</Badge>}
                        </TableCell>
                        <TableCell><Badge variant={c.status === 'Rejected' ? 'destructive' : c.status === 'Approved' ? 'default' : 'secondary'} className="text-[10px]">{c.status}</Badge></TableCell>
                        <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                            {c.status === 'Pending' && (
                                <div className="flex gap-1">
                                    <Button size="sm" className="h-7 px-2 text-[10px]" onClick={() => handleStatusUpdate(c, 'Approved')} disabled={updatingId === c.id}>Approve</Button>
                                    <Button size="sm" variant="outline" className="h-7 px-2 text-[10px]" onClick={() => handleStatusUpdate(c, 'Rejected')} disabled={updatingId === c.id}>Reject</Button>
                                </div>
                            )}
                            {c.status === 'Approved' && c.paymentStatus === 'Submitted' && (
                                <Button size="sm" className="h-7 px-2 bg-green-600 hover:bg-green-700 text-[10px]" onClick={() => handleStatusUpdate(c, 'Resolved')} disabled={updatingId === c.id}>
                                    Verify Payment
                                </Button>
                            )}
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-7 w-7 text-green-600" onClick={() => openWhatsApp(c)}>
                                            <MessageCircle className="h-3.5 w-3.5" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>WhatsApp Student</TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                            <Button variant="ghost" size="sm" className="h-7 px-2 text-[10px]" onClick={() => setViewingComplaint(c)}>Details</Button>
                            <AlertDialog>
                                <AlertDialogTrigger asChild><Button variant="ghost" size="icon" className="text-destructive h-7 w-7"><Trash2 className="h-3.5 w-3.5"/></Button></AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader><AlertDialogTitle>Delete Complaint?</AlertDialogTitle><AlertDialogDescription>This will remove the record permanently.</AlertDialogDescription></AlertDialogHeader>
                                    <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => handleDelete(c)}>Delete</AlertDialogAction></AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </div>
                        </TableCell>
                    </TableRow>
                    ))
                ) : (
                    <TableRow>
                        <TableCell colSpan={6} className="text-center h-24 text-muted-foreground text-xs italic">
                            No violations found matching the criteria.
                        </TableCell>
                    </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Complaint Details Dialog */}
      {viewingComplaint && (
        <Dialog open={!!viewingComplaint} onOpenChange={() => setViewingComplaint(null)}>
            <DialogContent className="sm:max-w-[500px] w-[95vw] rounded-lg">
                <DialogHeader><DialogTitle>{viewingComplaint.title}</DialogTitle></DialogHeader>
                <ScrollArea className="max-h-[60vh] pr-4">
                  <div className="space-y-4 py-4 text-sm">
                      <p><strong>Student:</strong> {viewingComplaint.studentName} ({viewingComplaint.studentId})</p>
                      <p><strong>Description:</strong> {viewingComplaint.description}</p>
                      <p><strong>Filed By:</strong> {viewingComplaint.filedByName}</p>
                      {viewingComplaint.evidenceUrl && (
                        <div className="space-y-2">
                            <p><strong>Evidence:</strong></p>
                            {viewingComplaint.evidenceUrl.startsWith('data:video/') ? (
                                <video src={viewingComplaint.evidenceUrl} controls className="w-full rounded border" />
                            ) : (
                                <div className="relative aspect-video w-full">
                                    <img src={viewingComplaint.evidenceUrl} alt="Evidence" className="w-full h-full object-contain" />
                                </div>
                            )}
                        </div>
                      )}
                  </div>
                </ScrollArea>
                <DialogFooter><Button onClick={() => setViewingComplaint(null)}>Close</Button></DialogFooter>
            </DialogContent>
        </Dialog>
      )}

      {/* Receipt View Dialog */}
      {viewingReceipt && (
        <Dialog open={!!viewingReceipt} onOpenChange={() => setViewingReceipt(null)}>
            <DialogContent className="sm:max-w-[600px] w-[95vw] rounded-lg">
                <DialogHeader><DialogTitle>Payment Receipt</DialogTitle></DialogHeader>
                <div className="relative aspect-[4/3] w-full bg-black rounded-lg overflow-hidden border">
                    <img src={viewingReceipt} alt="Payment Receipt" className="w-full h-full object-contain" />
                </div>
                <DialogFooter><Button onClick={() => setViewingReceipt(null)}>Close</Button></DialogFooter>
            </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
