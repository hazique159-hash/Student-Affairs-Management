'use client';
import { PenSquare, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { PageHeader } from '@/components/page-header';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useFirebase, useCollection, useMemoFirebase } from '@/firebase';
import { useRouter } from 'next/navigation';
import { collection, writeBatch, doc, getDoc, serverTimestamp } from 'firebase/firestore';
import type { Student, Teacher } from '@/lib/types';
import { useState } from 'react';


const complaintSchema = z.object({
  title: z.string().min(5, { message: 'Title must be at least 5 characters.' }),
  description: z.string().min(20, { message: 'Description must be at least 20 characters.' }),
  studentId: z.string().optional(),
});

export default function RegisterComplaintPage() {
  const { firestore, user } = useFirebase();
  const { toast } = useToast();
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');

  const isTeacher = user?.email && !user.email.endsWith('@student.com') && !user.email.endsWith('@admin.com');
  const isStudent = user?.email?.endsWith('@student.com');

  const studentsRef = useMemoFirebase(() => (firestore && isTeacher ? collection(firestore, 'students') : null), [firestore, isTeacher]);
  const { data: students, isLoading: isLoadingStudents } = useCollection<Student>(studentsRef);

  const filteredStudents = students?.filter(student =>
    `${student.firstName} ${student.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const form = useForm<z.infer<typeof complaintSchema>>({
    resolver: zodResolver(complaintSchema.refine(data => !isTeacher || (isTeacher && data.studentId), {
      message: "Please select a student.",
      path: ["studentId"],
    })),
    defaultValues: {
      title: '',
      description: '',
      studentId: undefined,
    },
  });

  const onSubmit = async (values: z.infer<typeof complaintSchema>) => {
    if (!firestore || !user) {
      toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in to file a complaint.' });
      return;
    }

    try {
        const batch = writeBatch(firestore);
        const complaintId = doc(collection(firestore, 'id_generator')).id;
        
        let studentRegId: string;
        let studentName: string;
        let filedByName: string;
        const filedById = user.uid;

        if (isTeacher) {
            if (!values.studentId) {
                toast({ variant: 'destructive', title: 'Error', description: 'Please select a student.' });
                return;
            }
            studentRegId = values.studentId;
            const selectedStudent = students?.find(s => s.id === studentRegId);
            if (!selectedStudent) {
                 toast({ variant: 'destructive', title: 'Error', description: 'Selected student not found.' });
                return;
            }
            studentName = `${selectedStudent.firstName} ${selectedStudent.lastName}`;
            
            const teacherDocRef = doc(firestore, 'teachers', filedById);
            const teacherDoc = await getDoc(teacherDocRef);
            if (teacherDoc.exists()) {
                const teacherData = teacherDoc.data() as Teacher;
                filedByName = `${teacherData.firstName} ${teacherData.lastName}`;
            } else {
                filedByName = user.email!;
            }

        } else if (isStudent) {
            studentRegId = user.email!.split('@')[0].toUpperCase();
            const studentDocRef = doc(firestore, 'students', studentRegId);
            const studentDoc = await getDoc(studentDocRef);
            if(studentDoc.exists()){
                const studentData = studentDoc.data() as Student;
                studentName = `${studentData.firstName} ${studentData.lastName}`;
                filedByName = studentName;
            } else {
                studentName = 'Student'; // fallback
                filedByName = user.email!;
            }
        } else {
             toast({ variant: 'destructive', title: 'Error', description: 'You do not have permission to file a complaint.' });
            return;
        }

        const complaintData = {
            id: complaintId,
            title: values.title,
            description: values.description,
            studentId: studentRegId,
            studentName: studentName,
            filedById: filedById,
            filedByName: filedByName,
            status: 'Pending' as const,
            dateSubmitted: serverTimestamp(),
        };

        // 1. Write to the global collection for admin/teacher review
        const topLevelComplaintRef = doc(firestore, 'complaints', complaintId);
        batch.set(topLevelComplaintRef, complaintData);

        // 2. Write to the filer's own subcollection for their "My Complaints" history
        const userComplaintRef = doc(firestore, `users/${filedById}/complaints`, complaintId);
        batch.set(userComplaintRef, complaintData);

        await batch.commit();

        toast({
            title: 'Complaint Submitted',
            description: 'Your complaint has been filed and is pending review.',
        });
        
        router.push('/my-complaints');

    } catch (error: any) {
        toast({
            variant: 'destructive',
            title: 'Submission Failed',
            description: error.message || 'An unexpected error occurred.',
        });
    }
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="File a New Complaint"
        icon={PenSquare}
        description="Provide details about your issue below. Please be as specific as possible."
      />

      <Card className="max-w-2xl mx-auto">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardHeader>
              <CardTitle>Complaint Form</CardTitle>
              <CardDescription>
                Your submission will be reviewed by an administrator.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6">
                {isTeacher && (
                    <>
                        <Input
                            placeholder="Search student by name or registration no..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <FormField
                        control={form.control}
                        name="studentId"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Student</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                <SelectTrigger disabled={isLoadingStudents}>
                                    <SelectValue placeholder={isLoadingStudents ? "Loading students..." : "Select a student"} />
                                </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {filteredStudents?.map(student => (
                                        <SelectItem key={student.id} value={student.id}>
                                            {student.firstName} {student.lastName} ({student.id})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                    </>
                )}
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Complaint Title</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Issue with Cafeteria Service" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Detailed Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Please describe the issue in detail, including dates, times, and any individuals involved..."
                        className="min-h-[150px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Submit Complaint
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  );
}
