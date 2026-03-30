"use client";

import { useState, useMemo } from "react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { ChartConfig } from "@/components/ui/chart";
import type { Student, Teacher, Complaint } from "@/lib/types";
import { Loader2 } from "lucide-react";

const DEPARTMENTS = [
  'Computer Science',
  'Software Engineering',
  'Mathematics',
  'Electrical Engineering',
  'Mechanical Engineering',
  'Civil Engineering',
  'Management Sciences',
  'Accounting & Finance',
  'Psychology',
  'English',
  'Bioinformatics & Biosciences',
  'Pharmacy',
  'Law',
] as const;

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
  const [selectedDepartment, setSelectedDepartment] = useState<string>("Computer Science");

  const chartData = useMemo(() => {
    if (isLoading) return [];

    const deptStudents = students.filter(s => s.department === selectedDepartment);
    const deptTeachers = teachers.filter(t => t.department === selectedDepartment);
    const deptStudentIds = new Set(deptStudents.map(s => s.id));
    const deptComplaints = complaints.filter(c => deptStudentIds.has(c.studentId));

    return [
      {
        category: selectedDepartment,
        students: deptStudents.length,
        teachers: deptTeachers.length,
        complaints: deptComplaints.length,
      }
    ];
  }, [selectedDepartment, students, teachers, complaints, isLoading]);

  return (
    <Card className="w-full h-full flex flex-col">
      <CardHeader className="py-3">
        <div className="flex flex-row items-center justify-between gap-4">
          <div>
            <CardTitle className="text-lg">Department Insights</CardTitle>
            <CardDescription className="text-xs">Metrics for the selected department.</CardDescription>
          </div>
          <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
            <SelectTrigger className="w-[200px] h-8 text-xs">
              <SelectValue placeholder="Select Department" />
            </SelectTrigger>
            <SelectContent>
              {DEPARTMENTS.map((dept) => (
                <SelectItem key={dept} value={dept} className="text-xs">
                  {dept}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="flex-1 min-h-0 pt-0 pb-4 px-2">
        {isLoading ? (
          <div className="flex h-full items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <ChartContainer config={chartConfig} className="h-full w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis 
                  dataKey="category" 
                  hide 
                />
                <YAxis fontSize={12} width={30} />
                <Tooltip content={<ChartTooltipContent />} />
                <Legend iconSize={10} wrapperStyle={{ fontSize: '12px' }} />
                <Bar 
                  name="Students"
                  dataKey="students" 
                  fill="var(--color-students)" 
                  radius={[4, 4, 0, 0]} 
                  barSize={40}
                />
                <Bar 
                  name="Teachers"
                  dataKey="teachers" 
                  fill="var(--color-teachers)" 
                  radius={[4, 4, 0, 0]} 
                  barSize={40}
                />
                <Bar 
                  name="Complaints"
                  dataKey="complaints" 
                  fill="var(--color-complaints)" 
                  radius={[4, 4, 0, 0]} 
                  barSize={40}
                />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
