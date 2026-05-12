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
    color: "#4F46E5", // Deep Indigo
  },
  teachers: {
    label: "Teachers",
    color: "#A78BFA", // Soft Purple
  },
  complaints: {
    label: "Complaints",
    color: "#1E293B", // Dark Charcoal
  },
} satisfies ChartConfig;

const PIE_COLORS = {
  Approved: "#3B82F6", // Professional Blue
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
        name: "Overview",
        students: students.length,
        teachers: teachers.length,
        complaints: complaints.length,
      }
    ];
  }, [students, teachers, complaints]);

  const statusData = useMemo(() => {
    if (isLoading) return [];
    
    const counts: Record<string, number> = { Approved: 0, Resolved: 0, Rejected: 0, Pending: 0 };
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
      {/* Summary Bar Chart */}
      <Card className="shadow-lg border-none bg-white dark:bg-card flex flex-col min-h-[400px]">
        <CardHeader className="p-6">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-[#4F46E5]" />
            <CardTitle className="text-base font-bold tracking-tight">Summary: {deptLabel}</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="flex-1 p-6 pt-0 flex flex-col justify-between">
          {isLoading ? (
            <div className="flex h-full items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="h-full flex flex-col">
              <div className="flex-1 min-h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barData} margin={{ top: 20, right: 30, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.1} />
                    <XAxis dataKey="name" hide />
                    <YAxis axisLine={false} tickLine={false} fontSize={12} stroke="#94a3b8" />
                    <Tooltip 
                      cursor={{ fill: 'transparent' }}
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-white p-3 border rounded-lg shadow-xl text-[10px] font-bold">
                              {payload.map((p: any) => (
                                <div key={p.name} className="flex items-center gap-2 mb-1 last:mb-0">
                                  <div className="h-2 w-2 rounded-full" style={{ backgroundColor: p.color }} />
                                  <span className="uppercase text-muted-foreground">{p.name}:</span>
                                  <span className="text-foreground">{p.value}</span>
                                </div>
                              ))}
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar name="Students" dataKey="students" fill={chartConfig.students.color} radius={[4, 4, 0, 0]} barSize={45} />
                    <Bar name="Teachers" dataKey="teachers" fill={chartConfig.teachers.color} radius={[4, 4, 0, 0]} barSize={45} />
                    <Bar name="Complaints" dataKey="complaints" fill={chartConfig.complaints.color} radius={[4, 4, 0, 0]} barSize={45} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              
              <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 mt-6">
                <div className="flex items-center gap-2">
                    <div className="h-2.5 w-2.5 rounded-full bg-[#4F46E5]" />
                    <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Students: {students.length}</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="h-2.5 w-2.5 rounded-full bg-[#A78BFA]" />
                    <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Faculty: {teachers.length}</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="h-2.5 w-2.5 rounded-full bg-[#1E293B]" />
                    <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Reports: {complaints.length}</span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Resolution Mix Pie Chart */}
      <Card className="shadow-lg border-none bg-white dark:bg-card flex flex-col min-h-[400px]">
        <CardHeader className="p-6">
          <div className="flex items-center gap-2">
            <PieIcon className="h-5 w-5 text-[#4F46E5]" />
            <CardTitle className="text-base font-bold tracking-tight">Resolution Mix</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="flex-1 p-6 pt-0 flex flex-col">
          {isLoading ? (
            <div className="flex h-full items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="h-full flex flex-col">
              <div className="flex-1 min-h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={65}
                      outerRadius={95}
                      paddingAngle={5}
                      dataKey="value"
                      stroke="none"
                    >
                      {statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[entry.name as keyof typeof PIE_COLORS] || "#cbd5e1"} />
                      ))}
                    </Pie>
                    <Tooltip 
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-white p-2 border rounded-md shadow-lg text-[10px] font-bold">
                              <div className="flex items-center gap-2">
                                <div className="h-2 w-2 rounded-full" style={{ backgroundColor: payload[0].payload.fill }} />
                                <span>{payload[0].name}: {payload[0].value}</span>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 mt-6">
                {statusData.map((entry, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div 
                      className="h-2.5 w-2.5 rounded-full" 
                      style={{ backgroundColor: PIE_COLORS[entry.name as keyof typeof PIE_COLORS] }} 
                    />
                    <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                      {entry.name}: {entry.value}
                    </span>
                  </div>
                ))}
                {statusData.length === 0 && <span className="text-xs text-muted-foreground italic text-center w-full">No active records for this period.</span>}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
