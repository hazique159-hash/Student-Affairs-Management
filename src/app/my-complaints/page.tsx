'use client';
import { MessageSquareHeart, Plus, Loader2, CircleDollarSign, Upload, X } from 'lucide-react';
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
import { collection, query, orderBy, doc, writeBatch, where, getDocs } from 'firebase/firestore';
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
import { Input } from '@/components/ui/input';
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
        
        // 1. Update personal complaint status and attach receipt
        const personalRef = doc(firestore, `users/${user.uid}/complaints`, payingComplaint.id);
        batch.update(personalRef, { 
            status: 'Resolved',
            paymentReceiptUrl: receiptPreview 
        });
        
        // 2. Update master complaint status
        const masterRef = doc(firestore, 'complaints', payingComplaint.id);
        batch.update(masterRef, { 
            status: 'Resolved',
            paymentReceiptUrl: receiptPreview
        });

        // 3. Update filer's record
        if (payingComplaint.filedById && payingComplaint.filedById !== 'system') {
            const filerComplaintRef = doc(firestore, `users/${payingComplaint.filedById}/complaints`, payingComplaint.id);
            batch.update(filerComplaintRef, { 
                status: 'Resolved',
                paymentReceiptUrl: receiptPreview
            });
        }

        await batch.commit();
        
        toast({
            title: 'Payment Submitted',
            description: 'Your fine has been paid and the record is resolved.',
        });
        
        setPayingComplaint(null);
        setReceiptPreview(null);
    } catch (error: any) {
        toast({
            variant: 'destructive',
            title: 'Payment Failed',
            description: error.message || 'Could not process the fine payment.',
        });
    } finally {
        setIsProcessingPayment(false);
    }
  };

  const isLoading = isUserLoading || isLoadingComplaints;
  const isStudent = user?.email?.endsWith('@student.com');
  const isTeacher = user?.email && !user.email.endsWith('@student.com') && !user.email.endsWith('@admin.com');

  const pageTitle = isStudent ? "Complaint Records" : "My Complaints";
  const pageDescription = isStudent
    ? "A record of all complaints filed against you."
    : "A record of all complaints you have filed.";

  return (
    <div className="space-y-8">
      <PageHeader
        title={pageTitle}
        icon={MessageSquareHeart}
        description={pageDescription}
      >
        {!isStudent && (
          <Button onClick={() => router.push('/register-complaint')}>
            <Plus className="mr-2 h-4 w-4" />
            File New Complaint
          </Button>
        )}
      </PageHeader>

      <Card>
        <CardHeader>
          <CardTitle>Complaint History</CardTitle>
          <CardDescription>
            {isStudent ? "View details of complaints filed against you and settle fines." : "View the status of complaints you've submitted."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                {isStudent && <TableHead>Filed By</TableHead>}
                {isTeacher && <TableHead>Student</TableHead>}
                <TableHead>Violation Title</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-48" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-8 w-24 ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : complaints && complaints.length > 0 ? (
                complaints.map((complaint) => (
                  <TableRow key={complaint.id}>
                    <TableCell>{complaint.dateSubmitted?.seconds ? format(new Date(complaint.dateSubmitted.seconds * 1000), 'PPP') : 'N/A'}</TableCell>
                    {isStudent && <TableCell>{complaint.filedByName}</TableCell>}
                    {isTeacher && <TableCell>{complaint.studentName}</TableCell>}
                    <TableCell>{complaint.title}</TableCell>
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
                       {isStudent && complaint.status === 'Approved' ? (
                         <Button 
                            size="sm" 
                            onClick={() => setPayingComplaint(complaint)} 
                            className="bg-green-600 hover:bg-green-700"
                         >
                            <CircleDollarSign className="mr-2 h-4 w-4" />
                            Pay Fine
                         </Button>
                       ) : (
                         <span className="text-xs text-muted-foreground italic">
                            {complaint.status === 'Resolved' ? 'Paid' : 'No action'}
                         </span>
                       )}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={isStudent || isTeacher ? 5 : 4} className="text-center h-24 text-muted-foreground">
                    {isStudent ? "No complaints found against you." : "You have not filed any complaints."}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Payment Dialog */}
      <Dialog open={!!payingComplaint} onOpenChange={(open) => {
        if (!open) {
            setPayingComplaint(null);
            setReceiptPreview(null);
        }
      }}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle>Fine Payment</DialogTitle>
            <DialogDescription>
              Complete your payment via Easypaisa to resolve this complaint.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="bg-muted p-4 rounded-lg space-y-2 text-sm border">
                <div className="flex justify-between">
                    <span className="font-medium">Fine Amount:</span>
                    <span className="text-primary font-bold">Rs. 1000</span>
                </div>
                <div className="flex justify-between">
                    <span className="font-medium">Violation:</span>
                    <span className="truncate max-w-[200px]">{payingComplaint?.title}</span>
                </div>
                <div className="border-t pt-2 mt-2">
                    <p className="font-bold text-center mb-1">Payment Details</p>
                    <div className="flex justify-between">
                        <span>Method:</span>
                        <span className="font-semibold">Easypaisa</span>
                    </div>
                    <div className="flex justify-between">
                        <span>Account No:</span>
                        <span className="font-semibold text-primary">03140500595</span>
                    </div>
                    <div className="flex justify-between">
                        <span>Account Name:</span>
                        <span className="font-semibold">Muhammad Hazique</span>
                    </div>
                </div>
            </div>

            <div className="space-y-2">
                <Label htmlFor="receipt">Upload Payment Receipt</Label>
                {!receiptPreview ? (
                    <div className="flex items-center justify-center w-full">
                        <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-muted/30 hover:bg-muted/50 border-muted-foreground/20 transition-colors">
                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                <Upload className="w-8 h-8 mb-3 text-muted-foreground" />
                                <p className="mb-2 text-sm text-muted-foreground">
                                    <span className="font-semibold">Click to upload</span> or drag and drop
                                </p>
                                <p className="text-xs text-muted-foreground">PNG, JPG or PDF (MAX. 500KB)</p>
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
                            className="absolute top-1 right-1 h-6 w-6 z-10"
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
          <DialogFooter>
            <Button variant="outline" onClick={() => setPayingComplaint(null)}>Cancel</Button>
            <Button 
                onClick={handlePaymentSubmit} 
                disabled={isProcessingPayment || !receiptPreview}
            >
                {isProcessingPayment && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Confirm Payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
