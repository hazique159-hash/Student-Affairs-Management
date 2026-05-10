
'use client';

import { PageHeader } from '@/components/page-header';
import { AlertCircle, Loader2, Search, Trash2, CheckCircle2, XCircle, Eye, MessageCircle } from 'lucide-react';
import { useUser, useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useMemo } from 'react';
import { collection, query, orderBy, doc, deleteDoc, updateDoc, where, getDocs } from 'firebase/firestore';
import type { Complaint } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function StudentIssuePage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  const [searchTerm, setSearchTerm] = useState('');
  const [viewingIssue, setViewingIssue] = useState<Complaint | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const isAdmin = user?.email === 'studentaffairs316@gmail.com' || user?.email?.endsWith('@admin.com');

  useEffect(() => {
    if (!isUserLoading && !isAdmin) {
      router.push('/announcements');
    }
  }, [isUserLoading, isAdmin, router]);

  const issuesRef = useMemoFirebase(
    () => (firestore && isAdmin ? query(collection(firestore, 'complaints'), orderBy('dateSubmitted', 'desc')) : null),
    [firestore, isAdmin]
  );
  const { data: issues, isLoading } = useCollection<Complaint>(issuesRef);

  const filteredIssues = useMemo(() => {
    if (!issues) return [];
    // Only show complaints filed by STUDENTS (student_issue)
    return issues.filter(issue => {
      const isStudentIssue = issue.complaintType === 'student_issue';
      const matchesSearch = 
        issue.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        issue.title.toLowerCase().includes(searchTerm.toLowerCase());
      return isStudentIssue && matchesSearch;
    });
  }, [issues, searchTerm]);

  const handleStatusUpdate = async (issueId: string, newStatus: 'Approved' | 'Rejected' | 'Resolved') => {
    if (!firestore || !isAdmin) return;
    setProcessingId(issueId);

    try {
      const issue = issues?.find(i => i.id === issueId);
      if (!issue) return;

      const issueRef = doc(firestore, 'complaints', issueId);
      await updateDoc(issueRef, { status: newStatus });

      // Update in student's personal portal subcollection
      const studentUserQuery = query(collection(firestore, 'users'), where('studentId', '==', issue.studentId));
      const studentSnapshot = await getDocs(studentUserQuery);
      if (!studentSnapshot.empty) {
        const studentUid = studentSnapshot.docs[0].id;
        await updateDoc(doc(firestore, `users/${studentUid}/complaints`, issueId), { status: newStatus });
      }

      toast({ title: `Issue ${newStatus}`, description: `The student issue status has been updated to ${newStatus}.` });
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Update Failed', description: error.message });
    } finally {
      setProcessingId(null);
    }
  };

  const handleDelete = async (issueId: string) => {
    if (!firestore || !isAdmin) return;
    try {
        const issue = issues?.find(i => i.id === issueId);
        if (!issue) return;

        await deleteDoc(doc(firestore, 'complaints', issueId));
        
        const studentUserQuery = query(collection(firestore, 'users'), where('studentId', '==', issue.studentId));
        const studentSnapshot = await getDocs(studentUserQuery);
        if (!studentSnapshot.empty) {
            const studentUid = studentSnapshot.docs[0].id;
            await deleteDoc(doc(firestore, `users/${studentUid}/complaints`, issueId));
        }

        toast({ title: 'Issue Deleted' });
    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Delete Failed', description: error.message });
    }
  };

  if (isUserLoading || !isAdmin) {
    return <div className="flex items-center justify-center h-full"><Loader2 className="animate-spin" /></div>;
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Student Issues"
        icon={AlertCircle}
        description="Monitor and manage concerns reported by students directly."
      />

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
                <CardTitle>Internal Student Concerns</CardTitle>
                <CardDescription>Filtering complaints filed by students about campus issues.</CardDescription>
            </div>
            <div className="relative w-full md:w-72">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input 
                    placeholder="Search by student or title..."
                    className="pl-8"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Issue Title</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={5}><div className="h-8 w-full bg-muted animate-pulse rounded" /></TableCell>
                    </TableRow>
                  ))
                ) : filteredIssues.length > 0 ? (
                  filteredIssues.map((issue) => (
                    <TableRow key={issue.id}>
                      <TableCell>
                        <div className="font-bold text-sm">{issue.studentName}</div>
                        <div className="text-[10px] text-muted-foreground uppercase">{issue.studentId}</div>
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate text-sm font-medium">{issue.title}</TableCell>
                      <TableCell className="text-xs">
                        {issue.dateSubmitted?.seconds ? format(new Date(issue.dateSubmitted.seconds * 1000), 'MMM d, p') : 'N/A'}
                      </TableCell>
                      <TableCell>
                        <Badge variant={issue.status === 'Pending' ? 'outline' : issue.status === 'Rejected' ? 'destructive' : 'default'} className="text-[10px]">
                            {issue.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                            {issue.status === 'Pending' && (
                                <>
                                    <Button size="icon" variant="ghost" className="h-8 w-8 text-green-600" onClick={() => handleStatusUpdate(issue.id, 'Approved')} disabled={processingId === issue.id}>
                                        <CheckCircle2 className="h-4 w-4" />
                                    </Button>
                                    <Button size="icon" variant="ghost" className="h-8 w-8 text-red-600" onClick={() => handleStatusUpdate(issue.id, 'Rejected')} disabled={processingId === issue.id}>
                                        <XCircle className="h-4 w-4" />
                                    </Button>
                                </>
                            )}
                            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setViewingIssue(issue)}>
                                <Eye className="h-4 w-4" />
                            </Button>
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive">
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Delete Issue Record?</AlertDialogTitle>
                                        <AlertDialogDescription>This will remove the student concern permanently.</AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => handleDelete(issue.id)}>Delete</AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-20 text-muted-foreground italic">
                      No active student issues found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Details View */}
      {viewingIssue && (
        <Dialog open={!!viewingIssue} onOpenChange={() => setViewingIssue(null)}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>{viewingIssue.title}</DialogTitle>
                </DialogHeader>
                <ScrollArea className="max-h-[60vh]">
                    <div className="space-y-4 py-4 text-sm">
                        <div className="bg-muted/30 p-3 rounded-lg border">
                            <p className="font-bold text-xs uppercase tracking-wider text-muted-foreground mb-1">Student Description</p>
                            <p className="italic leading-relaxed">"{viewingIssue.description}"</p>
                        </div>
                        {viewingIssue.evidenceUrl && (
                            <div className="space-y-2">
                                <p className="font-bold text-xs uppercase tracking-wider text-muted-foreground">Evidence Provided</p>
                                {viewingIssue.evidenceUrl.startsWith('data:video/') ? (
                                    <video src={viewingIssue.evidenceUrl} controls className="w-full rounded-md border" />
                                ) : (
                                    <div className="relative aspect-video w-full">
                                        <img src={viewingIssue.evidenceUrl} alt="Student Evidence" className="w-full h-full object-contain bg-black rounded-md" />
                                    </div>
                                )}
                            </div>
                        )}
                        <div className="flex justify-between items-center pt-4 border-t">
                            <span className="text-xs text-muted-foreground">Reference ID: {viewingIssue.id}</span>
                            <Badge>{viewingIssue.status}</Badge>
                        </div>
                    </div>
                </ScrollArea>
                <DialogFooter>
                    <Button onClick={() => setViewingIssue(null)}>Close</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
