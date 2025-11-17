"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart";
import { finedStudentsData } from "@/lib/data";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { ChartConfig } from "@/components/ui/chart";

const chartConfig = {
  students: {
    label: "Students",
  },
  cs: {
    label: "CS",
    color: "hsl(var(--chart-1))",
  },
  se: {
    label: "SE",
    color: "hsl(var(--chart-2))",
  },
  bba: {
    label: "BBA",
    color: "hsl(var(--chart-3))",
  },
} satisfies ChartConfig;

export function AnalyticsChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Fined Students by Department</CardTitle>
        <CardDescription>A visual breakdown of students who have been fined, filterable by department.</CardDescription>
        <div className="pt-4">
            <Select>
                <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by Department" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All Departments</SelectItem>
                    <SelectItem value="cs">Computer Science (CS)</SelectItem>
                    <SelectItem value="se">Software Engineering (SE)</SelectItem>
                    <SelectItem value="bba">Business Administration (BBA)</SelectItem>
                </SelectContent>
            </Select>
        </div>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
          <BarChart accessibilityLayer data={finedStudentsData}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="department"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              tickFormatter={(value) => value.slice(0, 3)}
            />
            <YAxis />
            <Tooltip cursor={false} content={<ChartTooltipContent />} />
            <Bar dataKey="students" radius={8} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
