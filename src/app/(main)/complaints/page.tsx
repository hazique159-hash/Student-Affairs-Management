import { ShieldQuestion } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";
import { complaints } from "@/lib/data";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Complaint } from "@/lib/types";

const ComplaintTable = ({ complaints }: { complaints: Complaint[] }) => (
  <Card>
    <CardContent className="p-0">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Student</TableHead>
            <TableHead>Violation</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Submitted By</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {complaints.map((complaint) => (
            <TableRow key={complaint.id}>
              <TableCell>
                <div className="font-medium">{complaint.studentName}</div>
                <div className="text-sm text-muted-foreground">{complaint.studentId}</div>
              </TableCell>
              <TableCell>{complaint.violation}</TableCell>
              <TableCell>{new Date(complaint.date).toLocaleDateString()}</TableCell>
              <TableCell>{complaint.submittedBy}</TableCell>
              <TableCell className="text-right space-x-2">
                {complaint.status === 'Pending' && <Button size="sm">Approve</Button>}
                {complaint.status === 'Approved' && <Button size="sm" variant="outline">Resolve</Button>}
                <Button variant="ghost" size="sm">Details</Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </CardContent>
  </Card>
);

export default function ComplaintsPage() {
  const pendingComplaints = complaints.filter(c => c.status === 'Pending');
  const approvedComplaints = complaints.filter(c => c.status === 'Approved');
  const resolvedComplaints = complaints.filter(c => c.status === 'Resolved');

  return (
    <div className="space-y-8">
      <PageHeader title="Complaint Management" icon={ShieldQuestion} description="Review, approve, and manage student complaints submitted by teachers." />

      <Tabs defaultValue="pending">
        <TabsList className="grid w-full grid-cols-3 md:w-auto md:inline-flex">
          <TabsTrigger value="pending">
            Pending <Badge className="ml-2">{pendingComplaints.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="approved">
            Approved <Badge className="ml-2">{approvedComplaints.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="resolved">Resolved</TabsTrigger>
        </TabsList>
        <TabsContent value="pending">
          <ComplaintTable complaints={pendingComplaints} />
        </TabsContent>
        <TabsContent value="approved">
          <ComplaintTable complaints={approvedComplaints} />
        </TabsContent>
        <TabsContent value="resolved">
          <ComplaintTable complaints={resolvedComplaints} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
