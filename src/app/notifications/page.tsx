"use client";

import { Bell, Bot, Loader2 } from "lucide-react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";
import { getParentalNotificationSuggestion } from "./actions";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import type { NotifyParentOutput } from "@/ai/flows/parental-notification";
import { students } from "@/lib/data";

const formSchema = z.object({
  studentId: z.string().min(1, "Please select a student."),
  notificationType: z.enum(['counseling', 'fine', 'blockage'], {
    required_error: "Please select a notification type.",
  }),
});

type FormValues = z.infer<typeof formSchema>;

export default function NotificationsPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<NotifyParentOutput | null>(null);
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      studentId: "",
      notificationType: undefined,
    },
  });

  async function onSubmit(data: FormValues) {
    setLoading(true);
    setResult(null);

    const selectedStudent = students.find(s => s.id === data.studentId);
    if (!selectedStudent) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Selected student not found.",
      });
      setLoading(false);
      return;
    }

    const input = {
      ...data,
      studentEmail: selectedStudent.email,
      studentPhoneNumber: selectedStudent.phone,
      parentEmail: selectedStudent.parentEmail,
      parentPhoneNumber: selectedStudent.parentPhone,
    };

    const response = await getParentalNotificationSuggestion(input);
    
    if ('error' in response) {
      toast({
        variant: "destructive",
        title: "AI Error",
        description: response.error,
      });
    } else {
      setResult(response);
    }
    
    setLoading(false);
  }

  return (
    <div className="space-y-8">
      <PageHeader title="Automated Notifications" icon={Bell} description="Use AI to determine if parental notification is required based on institutional policy." />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Trigger Notification</CardTitle>
            <CardDescription>Simulate an event to see the AI's recommendation.</CardDescription>
          </CardHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <CardContent className="space-y-6">
                <FormField
                  control={form.control}
                  name="studentId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Student</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a student" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {students.map(student => (
                            <SelectItem key={student.id} value={student.id}>
                              {student.name} ({student.id})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="notificationType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notification Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a notification type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="counseling">Counseling Session</SelectItem>
                          <SelectItem value="fine">Fine Issued</SelectItem>
                          <SelectItem value="blockage">Portal Blockage</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
              <CardFooter>
                <Button type="submit" disabled={loading}>
                  {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Bot className="mr-2 h-4 w-4" />}
                  Get AI Suggestion
                </Button>
              </CardFooter>
            </form>
          </Form>
        </Card>

        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle>AI Recommendation</CardTitle>
            <CardDescription>The AI's decision on parental notification will appear here.</CardDescription>
          </CardHeader>
          <CardContent className="flex-grow flex items-center justify-center">
            {loading && <Loader2 className="h-8 w-8 animate-spin text-primary" />}
            {!loading && !result && <div className="text-center text-muted-foreground">Submit the form to see results.</div>}
            {result && (
              <div className="space-y-4 text-center">
                <div className={`text-2xl font-bold ${result.shouldNotifyParent ? 'text-green-600' : 'text-amber-600'}`}>
                  {result.shouldNotifyParent ? "Parental Notification Required" : "Parental Notification Not Required"}
                </div>
                {result.notificationDetails && (
                  <div className="p-4 bg-muted rounded-lg">
                    <h4 className="font-semibold mb-2">Generated Notification Message:</h4>
                    <p className="text-sm text-muted-foreground italic">"{result.notificationDetails}"</p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

    