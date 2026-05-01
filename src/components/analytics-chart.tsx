"use client";

import { useMemo } from "react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, Cell, PieChart, Pie } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart";
import type { ChartConfig } from "@/components/ui/chart";
import type { Student, Teacher, Complaint } from "@/lib/types";
import { Loader2, PieChart as PieIcon, BarChart3 } from "lucide-react";

const chartConfig = {
  students: {
    label: "Students",
    color: "#4F46E5", // Dark Blue
  },
  teachers: {
    label: "Teachers",
    color: "#A78BFA", // Light Purple
  },
  complaints: {
    label: "Complaints",
    color: "#1E293B", // Dark Teal/Charcoal
  },
} satisfies ChartConfig;

const PIE_COLORS = {
  Approved: "#3B82F6", // Blue
  Resolved: "#8B5CF6", // Purple
  Rejected: "#64748B", // Grey
  Pending: "#EF4444", // Red
};

interface AnalyticsChartProps {
  students: Student[];
  teachers: Teacher[];
  complaints: Complaint[];
  isLoading: boolean;
  deptLabel: string;
}

export function AnalyticsChart({ students, teachers, complaints, isLoading, deptLabel }: AnalyticsChartProps) {
  
  const barData = useMemo(() => {
    return [
      {
        name: "Institutional Mix",
        students: students.length,
        teachers: teachers.length,
        complaints: complaints.length,
      }
    ];
  }, [students, teachers, complaints]);

  const statusData = useMemo(() => {
    if (isLoading) return [];
    
    const counts: Record<string, number> = { Approved: 0, Resolved: 0, Rejected: 0 };
    complaints.forEach(c => {
      if (counts[c.status] !== undefined) {
        counts[c.status]++;
      }
    });

    return Object.entries(counts).map(([name, value]) => ({
      name,
      value,
    })).filter(d => d.value > 0);
  }, [complaints, isLoading]);

  return (
    <div className="grid gap-6 md:grid-cols-2 h-full">
      {/* Bar Chart Card (Summary) - Using solid background for clarity */}
      <Card className="shadow-lg border-none bg-white/98 dark:bg-card/98 backdrop-blur-xl flex flex-col">
        <CardHeader className="p-6">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-[#4F46E5]" />
            <CardTitle className="text-base font-bold tracking-tight">Summary: {deptLabel}</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="flex-1 p-6 pt-0">
          {isLoading ? (
            <div className="flex h-[300px] items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <ChartContainer config={chartConfig} className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} margin={{ top: 20, right: 20, left: -10, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.1} />
                  <XAxis dataKey="name" hide />
                  <YAxis axisLine={false} tickLine={false} fontSize={12} stroke="#94a3b8" />
                  <Tooltip content={<ChartTooltipContent />} />
                  <Legend 
                    verticalAlign="bottom" 
                    height={36} 
                    iconType="circle"
                    formatter={(value) => <span className="text-xs font-semibold text-muted-foreground">{value}</span>}
                  />
                  <Bar name="Students" dataKey="students" fill={chartConfig.students.color} radius={[6, 6, 0, 0]} barSize={50} />
                  <Bar name="Teachers" dataKey="teachers" fill={chartConfig.teachers.color} radius={[6, 6, 0, 0]} barSize={50} />
                  <Bar name="Complaints" dataKey="complaints" fill={chartConfig.complaints.color} radius={[6, 6, 0, 0]} barSize={50} />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          )}
        </CardContent>
      </Card>

      {/* Pie Chart Card (Resolution Mix) - Using solid background for clarity */}
      <Card className="shadow-lg border-none bg-white/98 dark:bg-card/98 backdrop-blur-xl flex flex-col">
        <CardHeader className="p-6">
          <div className="flex items-center gap-2">
            <PieIcon className="h-5 w-5 text-[#4F46E5]" />
            <CardTitle className="text-base font-bold tracking-tight">Resolution Mix</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="flex-1 p-6 pt-0">
          {isLoading ? (
            <div className="flex h-[300px] items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="h-full flex flex-col">
              <div className="h-[280px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={4}
                      dataKey="value"
                      stroke="none"
                    >
                      {statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[entry.name as keyof typeof PIE_COLORS] || "#cbd5e1"} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 mt-auto">
                {statusData.map((entry, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div 
                      className="h-2.5 w-2.5 rounded-full" 
                      style={{ backgroundColor: PIE_COLORS[entry.name as keyof typeof PIE_COLORS] }} 
                    />
                    <span className="text-[11px] font-bold text-muted-foreground">
                      {entry.name}: {entry.value}
                    </span>
                  </div>
                ))}
                {statusData.length === 0 && <span className="text-xs text-muted-foreground italic">No reports found for this period.</span>}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
