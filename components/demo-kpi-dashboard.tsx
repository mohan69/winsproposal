"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, CheckCircle2, Gauge, RefreshCcw, Users } from "lucide-react";

const KPI_CARDS = [
  {
    label: "Proposal Throughput",
    value: "22/mo",
    trend: "+175%",
    icon: Activity,
    color: "text-blue-700 bg-blue-50 border-blue-100",
    bars: [34, 48, 64, 78, 88],
  },
  {
    label: "Compliance Coverage",
    value: "94%",
    trend: "+31 pts",
    icon: CheckCircle2,
    color: "text-emerald-700 bg-emerald-50 border-emerald-100",
    bars: [52, 68, 74, 86, 94],
  },
  {
    label: "Engineering Workload",
    value: "38 hrs",
    trend: "-46%",
    icon: Users,
    color: "text-amber-700 bg-amber-50 border-amber-100",
    bars: [92, 78, 64, 51, 38],
  },
  {
    label: "Bid Lifecycle",
    value: "1.8 days",
    trend: "-62%",
    icon: Gauge,
    color: "text-violet-700 bg-violet-50 border-violet-100",
    bars: [88, 72, 59, 46, 32],
  },
  {
    label: "Proposal Reuse",
    value: "67%",
    trend: "+29 pts",
    icon: RefreshCcw,
    color: "text-cyan-700 bg-cyan-50 border-cyan-100",
    bars: [28, 39, 48, 57, 67],
  },
];

export function DemoKpiDashboard() {
  return (
    <Card className="shadow-md border-slate-200">
      <CardContent className="p-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-5">
          <div>
            <h2 className="font-display text-xl font-bold">Pilot KPI Dashboard</h2>
            <p className="text-sm text-muted-foreground">
              Demo-ready operational view for proposal throughput, compliance coverage, engineering load, and bid cycle time.
            </p>
          </div>
          <Badge variant="outline" className="w-fit">Sample Data</Badge>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {KPI_CARDS.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.label} className={`rounded-lg border p-4 ${item.color}`}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-medium opacity-80">{item.label}</p>
                    <div className="mt-1 flex items-baseline gap-2">
                      <span className="text-2xl font-bold">{item.value}</span>
                      <span className="text-xs font-semibold">{item.trend}</span>
                    </div>
                  </div>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="mt-4 flex h-12 items-end gap-1.5">
                  {item.bars.map((height, idx) => (
                    <div key={idx} className="flex-1 rounded-t bg-current/25" style={{ height: `${height}%` }} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
