import Link from "next/link";
import { AppSidebar } from "@/components/app-sidebar";
import { DemoKpiDashboard } from "@/components/demo-kpi-dashboard";
import { DemoKnowledgeAssets } from "@/components/demo-knowledge-assets";
import { VisualizationDemoLayer } from "@/components/visualization-demo-layer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DemoVideoSection } from "@/components/marketing/DemoVideoSection";
import {
  ArrowUpRight,
  BarChart3,
  Database,
  Download,
  FileText,
  Gauge,
  Network,
  PencilRuler,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

const demoCards = [
  {
    title: "Severe-Service Control Valve Demo",
    description: "End-to-end valve proposal flow for high-pressure letdown, cavitation, noise, and documentation-heavy requirements.",
    businessValue: "Shows how engineering depth, compliance coverage, and export-ready narratives shorten severe-service bid response time.",
    action: "Generate Sample Proposal",
    href: "/upload-rfp?template=valve-oem&subType=globe",
    icon: ShieldCheck,
  },
  {
    title: "LNG Compressor Recycle / Anti-Surge Demo",
    description: "Fast-response control valve scenario for LNG compressor recycle service and anti-surge integration.",
    businessValue: "Demonstrates technical positioning around actuator response, fail-safe behavior, acoustic review, and TBE evidence.",
    action: "Generate Sample Proposal",
    href: "/upload-rfp?template=valve-oem&subType=globe",
    icon: Gauge,
  },
  {
    title: "Hydrogen Process Control Demo",
    description: "Hydrogen service proposal scenario covering material compatibility, leakage control, and QA/QC traceability.",
    businessValue: "Highlights how the vault can reuse approved hydrogen language while preserving compliance and documentation rigor.",
    action: "View Demo",
    href: "#knowledge-base",
    icon: Sparkles,
  },
  {
    title: "Drawing Intelligence Demo",
    description: "Customer-facing drawing and visualization previews for process flows, control loops, valve packages, matrices, and schedules.",
    businessValue: "Makes technical scope easier to review by turning proposal content into export-safe engineering visuals.",
    action: "View Drawing Intelligence",
    href: "#visualizations",
    icon: PencilRuler,
  },
  {
    title: "Knowledge Base Samples",
    description: "Curated sample response assets for valves, pumps, EPC compliance, deviations, inspection, and documentation clauses.",
    businessValue: "Shows how approved reusable knowledge improves consistency across proposals without hiding source context.",
    action: "Open Knowledge Samples",
    href: "#knowledge-base",
    icon: Database,
  },
  {
    title: "KPI Dashboard Demo",
    description: "Operational dashboard for proposal throughput, compliance coverage, engineering load, reuse, and turnaround.",
    businessValue: "Helps leaders see bid process impact and identify where proposal capacity is constrained.",
    action: "View Demo",
    href: "#kpi-dashboard",
    icon: BarChart3,
  },
  {
    title: "Export Demo",
    description: "PDF and DOCX export path for generated proposal content, compliance tables, drawings, and schedules.",
    businessValue: "Confirms the demo can finish with customer-ready documents rather than stopping at an on-screen preview.",
    action: "View Demo",
    href: "/proposals",
    icon: Download,
  },
];

export default function DemoCenterPage() {
  return (
    <AppSidebar>
      <div className="mx-auto max-w-[1280px] p-4 md:p-8">
        <div className="mb-8">
          <Badge variant="outline" className="mb-3">
            Customer Demo Workspace
          </Badge>
          <h1 className="font-display text-2xl font-bold tracking-tight md:text-3xl flex items-center gap-2">
            <FileText className="h-7 w-7 text-primary" />
            Demo Center
          </h1>
          <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
            Guided demo experiences for proposal generation, drawing intelligence, knowledge reuse, KPI visibility, and export workflows.
          </p>
        </div>

        <div className="mb-8">
          <DemoVideoSection compact />
        </div>

        <div className="mb-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {demoCards.map((demo) => {
            const Icon = demo.icon;
            return (
              <Card key={demo.title} className="border-slate-200 shadow-sm">
                <CardContent className="flex h-full flex-col p-5">
                  <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg border border-blue-200 bg-blue-50 text-blue-700">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h2 className="font-display text-lg font-semibold">{demo.title}</h2>
                  <p className="mt-2 text-sm text-muted-foreground">{demo.description}</p>
                  <div className="mt-4 rounded-lg border bg-slate-50 p-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Business value</p>
                    <p className="mt-1 text-sm text-slate-700">{demo.businessValue}</p>
                  </div>
                  <Button asChild className="mt-5 w-full">
                    <Link href={demo.href}>
                      {demo.action}
                      <ArrowUpRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="grid gap-6">
          <section id="visualizations">
            <VisualizationDemoLayer />
          </section>
          <section id="knowledge-base">
            <DemoKnowledgeAssets />
          </section>
          <section id="kpi-dashboard">
            <DemoKpiDashboard />
          </section>
          <Card className="border-slate-200 shadow-sm">
            <CardContent className="p-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h2 className="font-display text-xl font-bold flex items-center gap-2">
                    <Network className="h-5 w-5 text-primary" />
                    Export Demo
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Generate or open a sample proposal, then use the proposal export actions to validate PDF and DOCX output.
                  </p>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Button asChild>
                    <Link href="/upload-rfp?template=valve-oem&subType=globe">Generate Sample Proposal</Link>
                  </Button>
                  <Button asChild variant="outline">
                    <Link href="/proposals">Open Proposals</Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppSidebar>
  );
}
