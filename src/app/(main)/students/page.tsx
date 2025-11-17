import { Users, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";
import { students } from "@/lib/data";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export default function StudentsPage() {
  return (
    <div className="space-y-8">
      <PageHeader title="Student Records" icon={Users} description="Manage student records and track volunteer service hours.">
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Student
        </Button>
      </PageHeader>
      
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Department</TableHead>
                <TableHead className="text-right">Volunteer Hours</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {students.map((student) => (
                <TableRow key={student.id}>
                  <TableCell className="font-medium">{student.id}</TableCell>
                  <TableCell>{student.name}</TableCell>
                  <TableCell>
                    <Badge variant={
                      student.department === 'CS' ? 'default' : student.department === 'SE' ? 'secondary' : 'outline'
                    } className={
                      student.department === 'CS' ? 'bg-blue-100 text-blue-800' :
                      student.department === 'SE' ? 'bg-purple-100 text-purple-800' :
                      'bg-green-100 text-green-800'
                    }>{student.department}</Badge>
                  </TableCell>
                  <TableCell className="text-right">{student.volunteerHours}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm">Edit</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
