import { BarChart2 } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { AnalyticsChart } from "@/components/analytics-chart";

export default function AnalyticsPage() {
  return (
    <div className="space-y-8">
      <PageHeader title="Analytics Dashboard" icon={BarChart2} description="Visual representations of student affairs data." />
      <AnalyticsChart />
    </div>
  );
}
