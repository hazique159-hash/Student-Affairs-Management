"use client";

import { useState, useMemo } from "react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { ChartConfig } from "@/components/ui/chart";
import type { Student, Teacher, Complaint } from "@/lib/types";
import { Loader2 } from "lucide-react";

const chartConfig = {
  count: {
    label: "Count",
  },
  students: {
    label: "Students",
    color: "hsl(var(--chart-1))",
  },
  teachers: {
    label: "Teachers",
    color: "hsl(var(--chart-2))",
  },
  complaints: {
    label: "Complaints",
    color: "hsl(var(--chart-3))",
  },
} satisfies ChartConfig;

interface AnalyticsChartProps {
  students: Student[];
  teachers: Teacher[];
  complaints: Complaint[];
  isLoading: boolean;
}

export function AnalyticsChart({ students, teachers, complaints, isLoading }: AnalyticsChartProps) {
  const [selectedDepartment, setSelectedDepartment] = useState<string>("CS");

  const chartData = useMemo(() => {
    if (isLoading) return [];

    // Filter students by department
    const deptStudents = students.filter(s => s.department === selectedDepartment);
    
    // Filter teachers by department
    const deptTeachers = teachers.filter(t => t.department === selectedDepartment);
    
    // Create a set of student IDs for this department for quick lookup
    const deptStudentIds = new Set(deptStudents.map(s => s.id));
    
    // Filter complaints based on whether the student involved belongs to the selected department
    const deptComplaints = complaints.filter(c => deptStudentIds.has(c.studentId));

    return [
      {
        category: "Total Records",
        students: deptStudents.length,
        teachers: deptTeachers.length,
        complaints: deptComplaints.length,
      }
    ];
  }, [selectedDepartment, students, teachers, complaints, isLoading]);

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <CardTitle>Department Insights</CardTitle>
            <CardDescription>Metrics comparison for the selected department.</CardDescription>
          </div>
          <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select Department" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="CS">Computer Science (CS)</SelectItem>
              <SelectItem value="SE">Software Engineering (SE)</SelectItem>
              <SelectItem value="BBA">Business Administration (BBA)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        {isLoading ? (
          <div className="flex h-[300px] items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <ChartContainer config={chartConfig} className="min-h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis 
                  dataKey="category" 
                  hide 
                />
                <YAxis />
                <Tooltip content={<ChartTooltipContent />} />
                <Legend />
                <Bar 
                  name="Students Enrolled"
                  dataKey="students" 
                  fill="var(--color-students)" 
                  radius={[4, 4, 0, 0]} 
                  barSize={60}
                />
                <Bar 
                  name="Total Teachers"
                  dataKey="teachers" 
                  fill="var(--color-teachers)" 
                  radius={[4, 4, 0, 0]} 
                  barSize={60}
                />
                <Bar 
                  name="Department Complaints"
                  dataKey="complaints" 
                  fill="var(--color-complaints)" 
                  radius={[4, 4, 0, 0]} 
                  barSize={60}
                />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
