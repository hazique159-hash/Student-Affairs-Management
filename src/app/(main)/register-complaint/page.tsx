import { MessageSquarePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { predefinedViolations } from "@/lib/data";

export default function RegisterComplaintPage() {
  return (
    <div className="space-y-8">
      <PageHeader title="Register Complaint" icon={MessageSquarePlus} description="Submit a new complaint against a student." />

      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>New Complaint Form</CardTitle>
          <CardDescription>
            Please provide all necessary details about the incident.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid gap-6">
            <div className="grid gap-2">
              <Label htmlFor="student-id">Student ID</Label>
              <Input id="student-id" placeholder="e.g., BCS223089" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="violation">Violation Type</Label>
              <Select>
                <SelectTrigger id="violation">
                  <SelectValue placeholder="Select a violation" />
                </SelectTrigger>
                <SelectContent>
                  {predefinedViolations.map((violation) => (
                    <SelectItem key={violation} value={violation.toLowerCase().replace(' ', '-')}>{violation}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="comments">Comments</Label>
              <Textarea id="comments" placeholder="Provide specific details about the incident..." className="min-h-[120px]" />
            </div>
          </form>
        </CardContent>
        <CardFooter className="flex justify-end">
          <Button>Submit Complaint</Button>
        </CardFooter>
      </Card>
    </div>
  );
}
