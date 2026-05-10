'use client';
import { MessageSquareHeart, Plus, Loader2, CircleDollarSign, Upload, X, ShieldAlert, MessageSquareText } from 'lucide-react';
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
import type { Complaint } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { collection, query, orderBy, doc, writeBatch } from 'firebase/firestore';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import Image from 'next/image';

const MAX_RECEIPT_SIZE = 500 * 1024; // 500KB

export default function MyComplaintsPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  
  const [payingComplaint, setPayingComplaint] = useState<Complaint | null>(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [isUserLoading, user, router]);

  const complaintsRef = useMemoFirebase(
    () =>
      firestore && user
        ? query(collection(firestore, `users/${user.uid}/complaints`), orderBy('dateSubmitted', 'desc'))
        : null,
    [firestore, user]
  );
  const { data: complaints, isLoading: isLoadingComplaints } = useCollection<Complaint>(complaintsRef);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_RECEIPT_SIZE) {
      toast({
        variant: 'destructive',
        title: 'File too large',
        description: 'Receipt must be smaller than 500KB.',
      });
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setReceiptPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const clearReceipt = () => {
    setReceiptPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handlePaymentSubmit = async () => {
    if (!firestore || !user || !payingComplaint || !receiptPreview) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please upload a payment receipt.',
      });
      return;
    }

    setIsProcessingPayment(true);

    try {
        const batch = writeBatch(firestore);
        
        const personalRef = doc(firestore, `users/${user.uid}/complaints`, payingComplaint.id);
        batch.update(personalRef, { 
            paymentStatus: 'Submitted',
            paymentReceiptUrl: receiptPreview 
        });
        
        const masterRef = doc(firestore, 'complaints', payingComplaint.id);
        batch.update(masterRef, { 
            paymentStatus: 'Submitted',
            paymentReceiptUrl: receiptPreview
        });

        await batch.commit();
        
        toast({
            title: 'Receipt Submitted',
            description: 'Your payment proof has been sent to Admin for verification.',
        });
        
        setPayingComplaint(null);
        setReceiptPreview(null);
    } catch (error: any) {
        toast({
            variant: 'destructive',
            title: 'Submission Failed',
            description: error.message || 'Could not upload payment proof.',
        });
    } finally {
        setIsProcessingPayment(false);
    }
  };

  const isLoading = isUserLoading || isLoadingComplaints;
  const isStudent = user?.email?.endsWith('@student.com');

  const pageTitle = isStudent ? "Personal Portal" : "Complaint Center";
  const pageDescription = isStudent
    ? "Review your reported issues and settle any misconduct fines."
    : "Track the status of violation reports you have filed.";

  return (
    <div className="space-y-8 pb-10">
      <PageHeader
        title={pageTitle}
        icon={MessageSquareHeart}
        description={pageDescription}
      >
        <Button size="sm" onClick={() => router.push('/register-complaint')} className="w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          File New Complaint
        </Button>
      </PageHeader>

      <Card>
        <CardHeader>
          <CardTitle>History Feed</CardTitle>
          <CardDescription>
            {isStudent 
              ? "Disciplinary fines must be settled via Easypaisa. General concerns are for tracking only." 
              : "List of all reports submitted by you for review."}
          </CardDescription>
        </CardHeader>
        <CardContent className="px-0 sm:px-6">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">Type</TableHead>
                  <TableHead className="min-w-[120px]">Date</TableHead>
                  <TableHead className="min-w-[150px]">Subject</TableHead>
                  <TableHead className="min-w-[100px]">Payment</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-48" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                      <TableCell className="text-right"><Skeleton className="h-8 w-24 ml-auto" /></TableCell>
                    </TableRow>
                  ))
                ) : complaints && complaints.length > 0 ? (
                  complaints.map((complaint) => {
                    const isViolation = !complaint.complaintType || complaint.complaintType === 'violation';
                    
                    return (
                      <TableRow key={complaint.id}>
                        <TableCell>
                          {isViolation ? (
                            <Badge variant="outline" className="text-[10px] text-destructive border-destructive">
                              <ShieldAlert className="mr-1 h-3 w-3" /> Violation
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-[10px] text-primary border-primary">
                              <MessageSquareText className="mr-1 h-3 w-3" /> Issue
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-xs">{complaint.dateSubmitted?.seconds ? format(new Date(complaint.dateSubmitted.seconds * 1000), 'MMM d, yyyy') : 'N/A'}</TableCell>
                        <TableCell className="truncate max-w-[200px] font-medium text-sm">{complaint.title}</TableCell>
                        <TableCell>
                           {isViolation && complaint.status === 'Approved' ? (
                              <Badge variant={complaint.paymentStatus === 'Submitted' ? 'secondary' : 'outline'} className="text-[10px]">
                                 {complaint.paymentStatus === 'Submitted' ? 'Receipt Uploaded' : 'Fine Pending'}
                              </Badge>
                           ) : isViolation && complaint.status === 'Resolved' ? (
                              <Badge className="bg-green-100 text-green-700 text-[10px]">Settled</Badge>
                           ) : (
                              <span className="text-[10px] text-muted-foreground italic">N/A</span>
                           )}
                        </TableCell>
                        <TableCell>
                           <Badge
                            className="text-[10px]"
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
                           {isStudent && isViolation && complaint.status === 'Approved' && complaint.paymentStatus !== 'Submitted' ? (
                             <Button 
                                size="sm" 
                                onClick={() => setPayingComplaint(complaint)} 
                                className="bg-green-600 hover:bg-green-700 h-7 px-2 text-[10px]"
                             >
                                <CircleDollarSign className="mr-1 h-3 w-3" />
                                Pay Rs. 1000
                             </Button>
                           ) : (
                             <span className="text-[10px] text-muted-foreground">
                                {complaint.status === 'Resolved' ? 'Record Verified' : 
                                 complaint.paymentStatus === 'Submitted' ? 'Under Review' : '-'}
                             </span>
                           )}
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center h-24 text-muted-foreground text-xs italic">
                      No complaints or violations recorded.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!payingComplaint} onOpenChange={(open) => {
        if (!open) {
            setPayingComplaint(null);
            setReceiptPreview(null);
        }
      }}>
        <DialogContent className="sm:max-w-[450px] w-[95vw] rounded-lg">
          <DialogHeader>
            <DialogTitle>Fine Settlement</DialogTitle>
            <DialogDescription>
              Disciplinary fine for: <strong>{payingComplaint?.title}</strong>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="bg-muted p-4 rounded-lg space-y-2 text-sm border">
                <div className="flex justify-between font-bold">
                    <span>Amount Due:</span>
                    <span className="text-primary">Rs. 1000</span>
                </div>
                <div className="border-t pt-2 mt-2">
                    <p className="font-bold text-center mb-2 text-[10px] uppercase tracking-wider text-muted-foreground">Easypaisa Payment Details</p>
                    <div className="flex justify-between">
                        <span>Account Number:</span>
                        <span className="font-bold text-primary">03140500595</span>
                    </div>
                    <div className="flex justify-between">
                        <span>Account Name:</span>
                        <span className="font-semibold">Muhammad Hazique</span>
                    </div>
                </div>
            </div>

            <div className="space-y-2">
                <Label htmlFor="receipt" className="text-sm font-bold">Upload Transaction Screenshot</Label>
                {!receiptPreview ? (
                    <div className="flex items-center justify-center w-full">
                        <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-muted/30 hover:bg-muted/50 border-muted-foreground/20 transition-colors">
                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                <Upload className="w-8 h-8 mb-2 text-muted-foreground" />
                                <p className="text-xs text-muted-foreground">
                                    <span className="font-semibold text-primary">Click to upload receipt</span>
                                </p>
                                <p className="text-[10px] text-muted-foreground mt-1">PNG, JPG (Max 500KB)</p>
                            </div>
                            <input 
                                id="receipt" 
                                type="file" 
                                className="hidden" 
                                accept="image/*" 
                                ref={fileInputRef}
                                onChange={handleFileChange}
                            />
                        </label>
                    </div>
                ) : (
                    <div className="relative border rounded-lg p-2 bg-muted/20">
                        <Button
                            variant="destructive"
                            size="icon"
                            className="absolute top-1 right-1 h-6 w-6 z-10 rounded-full"
                            onClick={clearReceipt}
                        >
                            <X className="h-3 w-3" />
                        </Button>
                        <div className="relative aspect-video w-full overflow-hidden rounded-md">
                            <Image
                                src={receiptPreview}
                                alt="Receipt Preview"
                                fill
                                className="object-contain bg-black"
                            />
                        </div>
                    </div>
                )}
            </div>
          </div>
          <DialogFooter className="flex-row gap-2">
            <Button variant="outline" onClick={() => setPayingComplaint(null)} className="flex-1">Cancel</Button>
            <Button 
                onClick={handlePaymentSubmit} 
                disabled={isProcessingPayment || !receiptPreview}
                className="flex-1"
            >
                {isProcessingPayment && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Submit Proof
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
