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
    <div className="grid gap-6">
      {/* Department Comparison Bar Chart */}
      <Card className="shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-6">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            <div>
              <CardTitle className="text-lg">Department Metrics</CardTitle>
              <CardDescription>Engagement and violation trends by department.</CardDescription>
            </div>
          </div>
          <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
            <SelectTrigger className="w-[180px] h-9">
              <SelectValue placeholder="Select Department" />
            </SelectTrigger>
            <SelectContent>
              {DEPARTMENTS.map((dept) => (
                <SelectItem key={dept} value={dept}>
                  {dept}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex h-[300px] items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <ChartContainer config={chartConfig} className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={deptData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.2} />
                  <XAxis dataKey="name" hide />
                  <YAxis fontSize={12} axisLine={false} tickLine={false} />
                  <Tooltip content={<ChartTooltipContent />} />
                  <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                  <Bar 
                    name="Students"
                    dataKey="students" 
                    fill="var(--color-students)" 
                    radius={[6, 6, 0, 0]} 
                    barSize={60}
                  />
                  <Bar 
                    name="Teachers"
                    dataKey="teachers" 
                    fill="var(--color-teachers)" 
                    radius={[6, 6, 0, 0]} 
                    barSize={60}
                  />
                  <Bar 
                    name="Complaints"
                    dataKey="complaints" 
                    fill="var(--color-complaints)" 
                    radius={[6, 6, 0, 0]} 
                    barSize={60}
                  />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          )}
        </CardContent>
      </Card>

      {/* Complaint Status Distribution */}
      <Card className="shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-2">
            <PieIcon className="h-5 w-5 text-primary" />
            <div>
              <CardTitle className="text-lg">Resolution Status</CardTitle>
              <CardDescription>Global breakdown of complaint lifecycle.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex h-[250px] items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="h-[250px] w-full flex flex-col md:flex-row items-center justify-around">
               <div className="h-full w-full md:w-1/2">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                    <Pie
                        data={statusData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
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
               <div className="grid grid-cols-2 gap-4 text-sm w-full md:w-1/2 p-4">
                  {statusData.map((entry, index) => (
                    <div key={index} className="flex items-center gap-2">
                        <div 
                          className="h-3 w-3 rounded-full" 
                          style={{ backgroundColor: STATUS_COLORS[entry.name as keyof typeof STATUS_COLORS] }} 
                        />
                        <span className="font-medium">{entry.name}:</span>
                        <span className="text-muted-foreground">{entry.value}</span>
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
