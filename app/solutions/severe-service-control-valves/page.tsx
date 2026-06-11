"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Activity,
  ArrowRight,
  BarChart3,
  Brain,
  CheckCircle,
  ClipboardCheck,
  Clock,
  FileSearch,
  Gauge,
  GitBranch,
  Layers,
  Network,
  ShieldCheck,
  SlidersHorizontal,
  Target,
  TestTube2,
  Workflow,
  Zap,
} from "lucide-react";
import { PublicNavbar } from "@/components/public-navbar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DemoVideoSection } from "@/components/marketing/DemoVideoSection";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55 } },
};

const stagger = {
  visible: { transition: { staggerChildren: 0.1 } },
};

const kpis = [
  "40-60% faster proposal turnaround",
  "50-70% reusable engineering content",
  "90%+ compliance coverage",
  "25-40 engineering hours saved per complex bid",
  "Faster TBE and approval cycles",
];

const audiences = [
  "VP Business Development",
  "Proposal Director",
  "Engineering Manager",
  "Application Engineering",
  "Compliance / Documentation Lead",
];

const painPoints = [
  "High engineering dependency for every serious bid",
  "Repeated proposal responses across similar applications",
  "Complex process conditions that need careful interpretation",
  "Cavitation, flashing, noise, and vibration risk narratives",
  "NACE, ASME, API, inspection, and documentation requirements",
  "TBE responses, deviations, and clarification management",
  "Knowledge trapped in senior experts and historical bids",
  "Pressure to respond faster without reducing technical quality",
];

const capabilities = [
  {
    icon: FileSearch,
    title: "RFP Requirement Extraction",
    text: "Extract clauses, line items, datasheet requirements, submission rules, and evaluation criteria from complex control valve RFP packages.",
  },
  {
    icon: Layers,
    title: "Knowledge Vault Reuse",
    text: "Reuse approved narratives, prior technical responses, sizing assumptions, compliance clauses, and inspection language.",
  },
  {
    icon: ClipboardCheck,
    title: "Compliance and TBE Intelligence",
    text: "Map RFP requirements into compliance matrices, TBE responses, deviation logs, and reviewer-ready action lists.",
  },
  {
    icon: Gauge,
    title: "Preliminary Engineering Intelligence",
    text: "Generate proposal-stage engineering narratives for application class, risks, configuration choices, materials, and accessories.",
  },
  {
    icon: Workflow,
    title: "AI-Assisted Technical Visualization",
    text: "Create engineering proposal visualization for process scope, valve architecture, compliance flow, risks, and delivery plans.",
  },
  {
    icon: BarChart3,
    title: "Executive Proposal Dashboard",
    text: "Give management visibility into active RFPs, bid value, proposal cycle time, reuse, compliance, and engineering effort.",
  },
];

const engineeringItems = [
  "Extracted process conditions",
  "Severe-service application classification",
  "Preliminary valve configuration narrative",
  "Cavitation, flashing, and choked-flow risk narrative",
  "Noise and vibration risk narrative",
  "Material compatibility notes",
  "Actuator and accessory narrative",
  "Inspection and testing checklist",
];

const visualCards = [
  { icon: Network, title: "Compressor Recycle Architecture", label: "Anti-surge loop, recycle path, actuator dependencies" },
  { icon: Workflow, title: "Severe-Service Process Flow", label: "Process conditions, control points, relief paths" },
  { icon: SlidersHorizontal, title: "Valve Assembly Architecture", label: "Body, trim, actuator, positioner, accessories" },
  { icon: Brain, title: "Engineering Dependency Map", label: "Inputs, SME reviews, sizing, compliance, approvals" },
  { icon: GitBranch, title: "Risk / Deviation Decision Tree", label: "Exceptions, clarifications, commercial and technical routes" },
  { icon: ClipboardCheck, title: "Compliance Matrix", label: "Requirement, response, evidence, owner, status" },
  { icon: Clock, title: "Project Delivery Gantt", label: "Engineering, procurement, assembly, testing, dispatch" },
  { icon: BarChart3, title: "Executive KPI Dashboard", label: "Pipeline, effort, turnaround, reuse, bid confidence" },
];

const vaultItems = [
  "Reusable engineering narratives",
  "Historical proposal responses",
  "Valve sizing assumptions",
  "Compliance clauses",
  "Inspection and testing language",
  "Deviation examples",
  "Application-specific responses",
  "Senior engineer knowledge capture",
];

const scenarios = [
  {
    title: "LNG Compressor Recycle Valve Package",
    application: "High-capacity anti-surge and recycle control with fast response requirements.",
    complexity: "Severe noise, high pressure drop, actuator sizing, accessories, documentation, and TBE scrutiny.",
    value: "Creates a structured technical response with risk narratives, compliance mapping, and executive visibility.",
  },
  {
    title: "Refinery Severe-Service Control Valve Package",
    application: "Critical refinery process control across high-temperature or erosive services.",
    complexity: "Material compatibility, API/NACE requirements, deviations, inspection plans, and repeated RFP clauses.",
    value: "Reuses approved refinery narratives while keeping engineering reviewers focused on exceptions.",
  },
  {
    title: "Hydrogen Process Control Valve Package",
    application: "Hydrogen service valve package with sealing, materials, and safety documentation needs.",
    complexity: "Material notes, fugitive emissions language, compliance coverage, and engineering approvals.",
    value: "Builds a proposal-stage evidence trail for compliance, assumptions, risk notes, and review status.",
  },
  {
    title: "Steam Conditioning Valve Package",
    application: "Steam conditioning, desuperheating, pressure reduction, and noise-sensitive control.",
    complexity: "Thermal shock, noise, vibration, spray water, downstream piping, and inspection/testing details.",
    value: "Generates clear engineering proposal visualization and reusable technical narratives for evaluator confidence.",
  },
];

const dashboardMetrics = [
  { label: "Bid value", value: "$18.6M", sub: "qualified pipeline" },
  { label: "Active RFPs", value: "12", sub: "severe-service pursuits" },
  { label: "Proposal turnaround", value: "46%", sub: "cycle reduction" },
  { label: "Compliance coverage", value: "93%", sub: "mapped clauses" },
  { label: "Proposal reuse %", value: "62%", sub: "approved content" },
  { label: "Engineering hours saved", value: "184h", sub: "this month" },
  { label: "TBE completion", value: "88%", sub: "ready for review" },
  { label: "Approval cycle time", value: "2.4d", sub: "average" },
  { label: "Win probability", value: "71%", sub: "weighted view" },
];

const pilotScope = [
  "1 proposal team",
  "5-10 complex RFPs",
  "100-300 historical proposal and technical documents",
  "Knowledge Vault setup",
  "Compliance/TBE workflow",
  "Engineering intelligence sections",
  "Technical visual generation",
  "Executive dashboard",
];

const successMetrics = [
  "Proposal turnaround reduction",
  "Engineering effort saved",
  "Proposal reuse %",
  "Compliance coverage",
  "TBE completion time",
  "Approval cycle time",
];

export default function SevereServiceControlValvesPage() {
  return (
    <>
      <PublicNavbar />
      <main className="min-h-screen bg-background">
        <section className="relative overflow-hidden bg-gradient-to-br from-[#1a365d] via-[#1e3a5f] to-[#0f2440] text-white">
          <div className="absolute inset-0 opacity-15">
            <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.14)_1px,transparent_1px),linear-gradient(180deg,rgba(255,255,255,0.14)_1px,transparent_1px)] bg-[size:72px_72px]" />
          </div>
          <div className="relative z-10 mx-auto max-w-[1200px] px-4 py-20 md:py-28">
            <motion.div initial="hidden" animate="visible" variants={stagger} className="mx-auto max-w-5xl text-center">
              <motion.div variants={fadeUp} className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm backdrop-blur-sm">
                <ShieldCheck className="h-4 w-4 text-emerald-400" />
                Generic severe-service control valve solution page
              </motion.div>
              <motion.h1 variants={fadeUp} className="font-display mb-6 text-4xl font-bold leading-tight tracking-tight md:text-5xl lg:text-6xl">
                Engineering Proposal Intelligence for Severe-Service Control Valve Companies
              </motion.h1>
              <motion.p variants={fadeUp} className="mx-auto mb-8 max-w-3xl text-lg leading-relaxed text-blue-100 md:text-xl">
                Transform complex control valve RFPs into compliant, engineering-backed proposals with reusable knowledge, TBE intelligence, proposal-stage calculations, technical visuals, and executive bid visibility.
              </motion.p>
              <motion.div variants={fadeUp} className="mb-10 flex flex-col justify-center gap-4 sm:flex-row">
                <Link href="/demo">
                  <Button size="lg" className="bg-emerald-500 px-8 py-6 text-base text-white hover:bg-emerald-600">
                    Request Management Walkthrough
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Link href="https://www.rightsense.in/48-hour-diagnostic">
                  <Button size="lg" className="border border-white/30 bg-white/20 px-8 py-6 text-base text-white backdrop-blur-sm hover:bg-white/30">
                    Start with 48-Hour Diagnostic
                  </Button>
                </Link>
                <Link href="/samples">
                  <Button size="lg" className="border border-white/30 bg-white/10 px-8 py-6 text-base text-white backdrop-blur-sm hover:bg-white/20">
                    View Severe-Service Demo
                  </Button>
                </Link>
              </motion.div>
              <motion.div variants={fadeUp} className="grid gap-3 text-left sm:grid-cols-2 lg:grid-cols-5">
                {kpis.map((kpi) => (
                  <div key={kpi} className="rounded-lg border border-white/15 bg-white/10 p-4 backdrop-blur-sm">
                    <p className="text-sm font-semibold leading-snug text-emerald-200">{kpi}</p>
                  </div>
                ))}
              </motion.div>
            </motion.div>
          </div>
        </section>

        <section className="border-b bg-muted/50">
          <div className="mx-auto flex max-w-[1200px] flex-wrap items-center justify-center gap-2 px-4 py-5">
            {audiences.map((audience) => (
              <Badge key={audience} variant="outline" className="bg-background px-3 py-1">
                {audience}
              </Badge>
            ))}
          </div>
        </section>

        <DemoVideoSection />

        <section className="mx-auto max-w-[1200px] px-4 py-20">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}>
            <motion.div variants={fadeUp} className="mb-10 max-w-3xl">
              <h2 className="font-display mb-4 text-3xl font-bold tracking-tight md:text-4xl">Why Severe-Service Valve Proposals Are Hard</h2>
              <p className="text-muted-foreground">
                Severe-service bids are not simple document exercises. They depend on application knowledge, engineering judgment, compliance traceability, and fast coordination across proposal, application engineering, and management teams.
              </p>
            </motion.div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {painPoints.map((point) => (
                <motion.div key={point} variants={fadeUp}>
                  <Card className="h-full border-0 shadow-md">
                    <CardContent className="flex h-full items-start gap-3 p-5">
                      <Activity className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />
                      <p className="text-sm leading-relaxed text-muted-foreground">{point}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </section>

        <section className="bg-muted/30">
          <div className="mx-auto max-w-[1200px] px-4 py-20">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="mb-12 text-center">
              <motion.h2 variants={fadeUp} className="font-display mb-4 text-3xl font-bold tracking-tight md:text-4xl">From Proposal Writing to Proposal Engineering Intelligence</motion.h2>
              <motion.p variants={fadeUp} className="mx-auto max-w-2xl text-muted-foreground">
                WinsProposal turns bid response into a repeatable intelligence workflow, connecting RFP extraction, approved knowledge, compliance evidence, engineering narratives, visuals, and leadership visibility.
              </motion.p>
            </motion.div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {capabilities.map((capability) => (
                <motion.div key={capability.title} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
                  <Card className="h-full border-0 shadow-md">
                    <CardContent className="p-6">
                      <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
                        <capability.icon className="h-5 w-5 text-primary" />
                      </div>
                      <h3 className="font-display mb-2 text-lg font-semibold">{capability.title}</h3>
                      <p className="text-sm leading-relaxed text-muted-foreground">{capability.text}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto grid max-w-[1200px] gap-10 px-4 py-20 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}>
            <motion.div variants={fadeUp} className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              <Gauge className="h-3.5 w-3.5" />
              Proposal-stage engineering intelligence
            </motion.div>
            <motion.h2 variants={fadeUp} className="font-display mb-4 text-3xl font-bold tracking-tight md:text-4xl">Proposal-Stage Engineering Intelligence</motion.h2>
            <motion.p variants={fadeUp} className="mb-6 leading-relaxed text-muted-foreground">
              Help proposal and application teams turn raw RFP inputs into structured engineering narratives that management, reviewers, and customers can understand before final design validation.
            </motion.p>
            <motion.div variants={fadeUp} className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm leading-relaxed text-amber-900">
              Preliminary proposal-stage engineering estimate. Final sizing/design must be validated by qualified engineers using company-approved tools and standards.
            </motion.div>
          </motion.div>
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="grid gap-3 sm:grid-cols-2">
            {engineeringItems.map((item) => (
              <motion.div key={item} variants={fadeUp} className="flex items-center gap-3 rounded-lg border bg-background p-4 shadow-sm">
                <CheckCircle className="h-4 w-4 shrink-0 text-emerald-600" />
                <span className="text-sm font-medium">{item}</span>
              </motion.div>
            ))}
          </motion.div>
        </section>

        <section className="bg-muted/30">
          <div className="mx-auto max-w-[1200px] px-4 py-20">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="mb-12 text-center">
              <motion.h2 variants={fadeUp} className="font-display mb-4 text-3xl font-bold tracking-tight md:text-4xl">AI-Assisted Technical Visuals for Proposal Clarity</motion.h2>
              <motion.p variants={fadeUp} className="mx-auto max-w-2xl text-muted-foreground">
                Engineering proposal visualization helps evaluators see application scope, risk logic, compliance status, and delivery plans without reading every technical paragraph first.
              </motion.p>
            </motion.div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {visualCards.map((visual) => (
                <motion.div key={visual.title} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
                  <Card className="h-full border-0 shadow-md">
                    <CardContent className="p-5">
                      <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10">
                        <visual.icon className="h-5 w-5 text-emerald-700" />
                      </div>
                      <h3 className="font-display mb-2 text-sm font-semibold">{visual.title}</h3>
                      <p className="text-xs leading-relaxed text-muted-foreground">{visual.label}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-[1200px] px-4 py-20">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
            <div>
              <motion.h2 variants={fadeUp} className="font-display mb-4 text-3xl font-bold tracking-tight md:text-4xl">Preserve and Reuse Severe-Service Application Knowledge</motion.h2>
              <motion.p variants={fadeUp} className="leading-relaxed text-muted-foreground">
                WinsProposal helps capture the application reasoning that normally lives across senior engineers, old files, spreadsheets, and inboxes, then makes it available as reusable proposal intelligence with reviewer control.
              </motion.p>
            </div>
            <motion.div variants={stagger} className="grid gap-3 sm:grid-cols-2">
              {vaultItems.map((item) => (
                <motion.div key={item} variants={fadeUp} className="flex items-center gap-3 rounded-lg border bg-background p-4 shadow-sm">
                  <Brain className="h-4 w-4 shrink-0 text-primary" />
                  <span className="text-sm font-medium">{item}</span>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </section>

        <section className="bg-muted/30">
          <div className="mx-auto max-w-[1200px] px-4 py-20">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="mb-12 text-center">
              <motion.h2 variants={fadeUp} className="font-display mb-4 text-3xl font-bold tracking-tight md:text-4xl">Demo Scenarios Built for Complex Valve Proposals</motion.h2>
              <motion.p variants={fadeUp} className="mx-auto max-w-2xl text-muted-foreground">
                Each scenario is designed around practical proposal problems: application context, technical complexity, compliance coverage, and management reporting.
              </motion.p>
            </motion.div>
            <div className="grid gap-6 md:grid-cols-2">
              {scenarios.map((scenario) => (
                <motion.div key={scenario.title} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
                  <Card className="h-full border-0 shadow-md">
                    <CardContent className="p-6">
                      <h3 className="font-display mb-4 text-lg font-semibold">{scenario.title}</h3>
                      <div className="space-y-3">
                        <p className="text-sm"><span className="font-semibold text-foreground">Application:</span> <span className="text-muted-foreground">{scenario.application}</span></p>
                        <p className="text-sm"><span className="font-semibold text-foreground">Proposal complexity:</span> <span className="text-muted-foreground">{scenario.complexity}</span></p>
                        <p className="text-sm"><span className="font-semibold text-foreground">WinsProposal value:</span> <span className="text-muted-foreground">{scenario.value}</span></p>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto grid max-w-[1200px] gap-10 px-4 py-20 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}>
            <motion.h2 variants={fadeUp} className="font-display mb-4 text-3xl font-bold tracking-tight md:text-4xl">Management Visibility Into Proposal Execution</motion.h2>
            <motion.p variants={fadeUp} className="mb-6 leading-relaxed text-muted-foreground">
              Leadership gets a single operating view across bid value, active RFPs, proposal health, compliance readiness, reuse, engineering capacity, TBE completion, approvals, and win probability.
            </motion.p>
            <motion.div variants={fadeUp} className="flex flex-wrap gap-2">
              {["Pipeline", "Compliance", "Engineering effort", "Approvals", "Win probability"].map((tag) => (
                <Badge key={tag} variant="outline" className="bg-background">{tag}</Badge>
              ))}
            </motion.div>
          </motion.div>
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="rounded-xl border bg-background p-5 shadow-lg">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Mock executive view</p>
                <h3 className="font-display text-lg font-semibold">Severe-service proposal operations</h3>
              </div>
              <Badge className="bg-primary text-primary-foreground">Pilot dashboard</Badge>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {dashboardMetrics.map((metric) => (
                <div key={metric.label} className="rounded-lg border bg-slate-50 p-4">
                  <div className="text-xs text-muted-foreground">{metric.label}</div>
                  <div className="mt-1 font-display text-2xl font-bold">{metric.value}</div>
                  <div className="text-[11px] text-emerald-700">{metric.sub}</div>
                </div>
              ))}
            </div>
          </motion.div>
        </section>

        <section className="bg-muted/30">
          <div className="mx-auto max-w-[1200px] px-4 py-20">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="grid gap-10 lg:grid-cols-2">
              <motion.div variants={fadeUp}>
                <h2 className="font-display mb-4 text-3xl font-bold tracking-tight md:text-4xl">Recommended 30-Day Severe-Service Proposal Intelligence Pilot</h2>
                <p className="mb-6 leading-relaxed text-muted-foreground">
                  A focused pilot gives management evidence on speed, reuse, engineering effort, compliance quality, TBE execution, and proposal governance before a broader rollout.
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  {pilotScope.map((item) => (
                    <div key={item} className="flex items-center gap-3 rounded-lg border bg-background p-4">
                      <CheckCircle className="h-4 w-4 shrink-0 text-emerald-600" />
                      <span className="text-sm font-medium">{item}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
              <motion.div variants={fadeUp}>
                <Card className="h-full border-0 shadow-md">
                  <CardContent className="p-6">
                    <div className="mb-4 flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
                        <Target className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Success metrics</p>
                        <h3 className="font-display text-lg font-semibold">What management can measure</h3>
                      </div>
                    </div>
                    <div className="space-y-3">
                      {successMetrics.map((metric) => (
                        <div key={metric} className="flex items-center justify-between rounded-lg bg-slate-50 px-4 py-3 text-sm">
                          <span className="font-medium">{metric}</span>
                          <TestTube2 className="h-4 w-4 text-emerald-600" />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </motion.div>
          </div>
        </section>

        <section className="bg-muted/30 border-t border-border">
          <div className="mx-auto max-w-[1200px] px-4 py-16 text-center">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}>
              <motion.h2 variants={fadeUp} className="font-display mb-4 text-2xl font-bold tracking-tight md:text-3xl">
                Not Ready for a Full Pilot? Start with a 48-Hour Diagnostic.
              </motion.h2>
              <motion.p variants={fadeUp} className="mx-auto mb-8 max-w-2xl text-muted-foreground">
                Get a structured review of your proposal workflow, compliance matrix, technical standards mapping, and engineering effort allocation — delivered in 48 hours with a clear pilot recommendation.
              </motion.p>
              <motion.div variants={fadeUp}>
                <Link href="https://www.rightsense.in/48-hour-diagnostic">
                  <Button size="lg" className="bg-emerald-500 px-8 text-white hover:bg-emerald-600">
                    Start with 48-Hour Diagnostic
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </motion.div>
              <motion.p variants={fadeUp} className="mx-auto mt-6 max-w-xl text-xs text-muted-foreground">
                The diagnostic identifies proposal, compliance, and documentation readiness gaps. It does not replace formal certification, legal review, statutory audit, regulatory approval, or customer approval.
              </motion.p>
            </motion.div>
          </div>
        </section>

        <section className="bg-gradient-to-br from-[#1a365d] to-[#0f2440] text-white">
          <div className="mx-auto max-w-[1200px] px-4 py-20 text-center">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}>
              <motion.div variants={fadeUp} className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-white/10">
                <Zap className="h-6 w-6 text-emerald-300" />
              </motion.div>
              <motion.h2 variants={fadeUp} className="font-display mx-auto mb-5 max-w-3xl text-3xl font-bold tracking-tight md:text-4xl">
                Turn Severe-Service Proposal Knowledge Into Revenue Intelligence
              </motion.h2>
              <motion.p variants={fadeUp} className="mx-auto mb-8 max-w-2xl text-blue-100">
                Give proposal, engineering, compliance, and management teams a shared intelligence layer for complex control valve pursuits.
              </motion.p>
              <motion.div variants={fadeUp}>
                <Link href="/demo">
                  <Button size="lg" className="bg-emerald-500 px-8 text-white hover:bg-emerald-600">
                    Schedule Executive Walkthrough
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </motion.div>
            </motion.div>
          </div>
        </section>
      </main>
    </>
  );
}
