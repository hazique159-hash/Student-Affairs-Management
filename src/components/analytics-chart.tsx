"use client";

import { useState, useMemo } from "react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, Cell, PieChart, Pie } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { ChartConfig } from "@/components/ui/chart";
import type { Student, Teacher, Complaint } from "@/lib/types";
import { Loader2, PieChart as PieIcon, BarChart3 } from "lucide-react";

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
  students: {
    label: "Students",
    color: "hsl(var(--primary))",
  },
  teachers: {
    label: "Teachers",
    color: "hsl(var(--accent))",
  },
  complaints: {
    label: "Complaints",
    color: "hsl(var(--chart-3))",
  },
} satisfies ChartConfig;

const STATUS_COLORS = {
  Pending: "hsl(var(--destructive))",
  Approved: "hsl(var(--chart-1))",
  Resolved: "hsl(var(--chart-2))",
  Rejected: "hsl(var(--muted-foreground))",
  Open: "hsl(var(--chart-5))",
};

interface AnalyticsChartProps {
  students: Student[];
  teachers: Teacher[];
  complaints: Complaint[];
  isLoading: boolean;
}

export function AnalyticsChart({ students, teachers, complaints, isLoading }: AnalyticsChartProps) {
  const [selectedDepartment, setSelectedDepartment] = useState<string>("Computer Science");

  const deptData = useMemo(() => {
    if (isLoading) return [];

    const deptStudents = students.filter(s => s.department === selectedDepartment);
    const deptTeachers = teachers.filter(t => t.department === selectedDepartment);
    const deptStudentIds = new Set(deptStudents.map(s => s.id));
    const deptComplaints = complaints.filter(c => deptStudentIds.has(c.studentId));

    return [
      {
        name: selectedDepartment,
        students: deptStudents.length,
        teachers: deptTeachers.length,
        complaints: deptComplaints.length,
      }
    ];
  }, [selectedDepartment, students, teachers, complaints, isLoading]);

  const statusData = useMemo(() => {
    if (isLoading) return [];
    
    const statusCounts: Record<string, number> = {};
    complaints.forEach(c => {
      statusCounts[c.status] = (statusCounts[c.status] || 0) + 1;
    });

    return Object.entries(statusCounts).map(([name, value]) => ({
      name,
      value,
    }));
  }, [complaints, isLoading]);

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {/* Department Comparison Bar Chart */}
      <Card className="shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-4 pt-4 px-4">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-primary" />
            <CardTitle className="text-sm">Dept. Comparison</CardTitle>
          </div>
          <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
            <SelectTrigger className="w-[140px] h-7 text-xs">
              <SelectValue placeholder="Dept." />
            </SelectTrigger>
            <SelectContent>
              {DEPARTMENTS.map((dept) => (
                <SelectItem key={dept} value={dept} className="text-xs">
                  {dept}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent className="p-2">
          {isLoading ? (
            <div className="flex h-[200px] items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <ChartContainer config={chartConfig} className="h-[200px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={deptData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.1} />
                  <XAxis dataKey="name" hide />
                  <YAxis fontSize={10} axisLine={false} tickLine={false} />
                  <Tooltip content={<ChartTooltipContent />} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} />
                  <Bar name="Students" dataKey="students" fill="var(--color-students)" radius={[4, 4, 0, 0]} barSize={40} />
                  <Bar name="Teachers" dataKey="teachers" fill="var(--color-teachers)" radius={[4, 4, 0, 0]} barSize={40} />
                  <Bar name="Complaints" dataKey="complaints" fill="var(--color-complaints)" radius={[4, 4, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          )}
        </CardContent>
      </Card>

      {/* Complaint Status Distribution */}
      <Card className="shadow-sm">
        <CardHeader className="p-4 pb-2">
          <div className="flex items-center gap-2">
            <PieIcon className="h-4 w-4 text-primary" />
            <CardTitle className="text-sm">Resolution Mix</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-2">
          {isLoading ? (
            <div className="flex h-[200px] items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="h-[200px] w-full flex flex-col items-center justify-center">
               <div className="h-full w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                    <Pie
                        data={statusData}
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={65}
                        paddingAngle={5}
                        dataKey="value"
                    >
                        {statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.name as keyof typeof STATUS_COLORS] || "hsl(var(--primary))"} />
                        ))}
                    </Pie>
                    <Tooltip />
                    </PieChart>
                </ResponsiveContainer>
               </div>
               <div className="flex flex-wrap justify-center gap-x-3 gap-y-1 text-[9px] text-muted-foreground mt-1">
                  {statusData.map((entry, index) => (
                    <div key={index} className="flex items-center gap-1">
                        <div 
                          className="h-2 w-2 rounded-full" 
                          style={{ backgroundColor: STATUS_COLORS[entry.name as keyof typeof STATUS_COLORS] }} 
                        />
                        <span>{entry.name}: {entry.value}</span>
                    </div>
                  ))}
               </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
