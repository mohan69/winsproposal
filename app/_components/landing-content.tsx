"use client";

import Link from "next/link";
import { motion, useInView } from "framer-motion";
import { DemoShowcase } from "./demo-showcase";
import { useRef, useEffect, useState } from "react";
import {
  Zap,
  Upload,
  Search,
  FileText,
  Trophy,
  Clock,
  BarChart3,
  TrendingUp,
  ArrowRight,
  CheckCircle,
  XCircle,
  Factory,
  Droplets,
  HardHat,
  ShieldCheck,
  Target,
  GitBranch,
  Layers,
  SlidersHorizontal,
  PenTool,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

function CountUp({ end, suffix = "" }: { end: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (!isInView) return;
    let start = 0;
    const duration = 2000;
    const increment = end / (duration / 16);
    const timer = setInterval(() => {
      start += increment;
      if (start >= end) {
        setCount(end);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [isInView, end]);

  return <span ref={ref}>{count}{suffix}</span>;
}

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};

const stagger = {
  visible: { transition: { staggerChildren: 0.15 } },
};

export function LandingContent() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative bg-gradient-to-br from-[#1a365d] via-[#1e3a5f] to-[#0f2440] text-white overflow-hidden">
        <div className="absolute inset-0 opacity-15">
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.14)_1px,transparent_1px),linear-gradient(180deg,rgba(255,255,255,0.14)_1px,transparent_1px)] bg-[size:72px_72px]" />
        </div>
        <div className="max-w-[1200px] mx-auto px-4 py-24 md:py-32 relative z-10">
          <motion.div initial="hidden" animate="visible" variants={stagger} className="text-center max-w-4xl mx-auto">
            <motion.div variants={fadeUp} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-sm mb-8">
              <Zap className="w-4 h-4 text-emerald-400" />
              AI-native revenue intelligence for EPC, valves, pumps, and industrial manufacturing
            </motion.div>
            <motion.h1 variants={fadeUp} className="font-display text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-tight mb-6">
              Industrial Revenue Intelligence Platform
            </motion.h1>
            <motion.p variants={fadeUp} className="text-lg md:text-xl text-blue-100 mb-5 max-w-3xl mx-auto">
              Increase proposal throughput, strengthen compliance quality, and reduce engineering effort with reusable bid intelligence, technical response automation, and operational visibility across every pursuit.
            </motion.p>
            <motion.div variants={fadeUp} className="flex flex-wrap items-center justify-center gap-3 mb-10">
              {[
                "Go/No-Go Decision Matrix",
                "5 Valve Sub-Types",
                "3 Pump Sub-Types",
                "15+ TBE Tags Per Sub-Type",
                "AI-Generated PFDs & Diagrams",
              ].map((tag) => (
                <Badge key={tag} className="bg-emerald-500/20 text-emerald-300 border-emerald-400/30 px-3 py-1 text-xs font-medium">
                  {tag}
                </Badge>
              ))}
            </motion.div>
            <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/demo">
                <Button size="lg" className="bg-emerald-500 hover:bg-emerald-600 text-white px-8 py-6 text-base">
                  Book a Demo
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
              <Link href="/signup">
                <Button size="lg" className="bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 border border-white/30 px-8 py-6 text-base">
                  Start Free Trial
                </Button>
              </Link>
            </motion.div>
            <motion.div variants={fadeUp} className="mt-12 grid grid-cols-2 md:grid-cols-5 gap-3 text-left">
              {[
                { metric: "50%", label: "faster proposal turnaround" },
                { metric: "2-3x", label: "proposal throughput" },
                { metric: "Higher", label: "compliance coverage" },
                { metric: "Lower", label: "engineering effort" },
                { metric: "Reusable", label: "bid knowledge" },
              ].map((item) => (
                <div key={item.label} className="rounded-lg border border-white/15 bg-white/10 p-4 backdrop-blur-sm">
                  <div className="font-display text-2xl font-bold text-emerald-300">{item.metric}</div>
                  <div className="mt-1 text-xs leading-snug text-blue-100">{item.label}</div>
                </div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Credibility Banner */}
      <section className="bg-muted/50 border-b border-border">
        <div className="max-w-[1200px] mx-auto px-4 py-6">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="flex flex-wrap items-center justify-center gap-x-8 gap-y-2 text-sm font-medium text-muted-foreground">
            <span><span className="text-emerald-600 font-bold">80+ Years</span> Combined Industry Expertise</span>
            <span className="hidden md:inline text-border">|</span>
            <span><span className="text-primary font-bold">API 600 · 610 · 682</span> Compliance Built-In</span>
            <span className="hidden md:inline text-border">|</span>
            <span><span className="text-primary font-bold">Gate · Globe · Ball · Butterfly · Check</span> Valve Depth</span>
          </motion.div>
        </div>
      </section>

      {/* ICP Cards — MOAT-focused */}
      <section className="max-w-[1200px] mx-auto px-4 py-20">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="text-center mb-12">
          <motion.h2 variants={fadeUp} className="font-display text-3xl md:text-4xl font-bold tracking-tight mb-4">Built for the Industries Generic Tools Ignore</motion.h2>
          <motion.p variants={fadeUp} className="text-muted-foreground max-w-2xl mx-auto">Loopio doesn&apos;t know a Gate valve from a Globe valve. ChatGPT can&apos;t calculate NPSH margins. WinsProposal was built by valve, pump, and EPC engineers — for valve, pump, and EPC engineers.</motion.p>
        </motion.div>
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="grid md:grid-cols-3 gap-6">
          {[
            {
              icon: Factory,
              title: "Valve Manufacturers",
              subtitle: "5 sub-types · 12-15 TBE tags each",
              points: [
                "Gate, Globe, Ball, Butterfly, and Check valve proposal depth",
                "Actuator specs, ISO 15848 fugitive emissions, SIL, API 607/624 flags",
                "Sub-type TBE tags with process visuals and execution diagrams",
              ],
            },
            {
              icon: Droplets,
              title: "Pump Manufacturers",
              subtitle: "3 sub-types · API 682 seal plans",
              points: [
                "Centrifugal, positive displacement, and submersible proposal logic",
                "NPSH analysis, hydraulic curves, API 610 limits, and API 682 seal plans",
                "Hydraulic flow visuals and compliance mappings included in proposal output",
              ],
            },
            {
              icon: HardHat,
              title: "EPC Companies",
              subtitle: "Risk registers · Local content strategy",
              points: [
                "Multi-discipline assembly with risk registers and WBS-level scheduling",
                "Subcontracting strategy, local content plans, and OISD compliance mapping",
                "Project execution visuals, HSE frameworks, and team composition sections",
              ],
            },
          ].map((card, i) => (
            <motion.div key={i} variants={fadeUp}>
              <Card className="h-full hover:shadow-lg transition-shadow duration-300 border-0 shadow-md">
                <CardContent className="p-6">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-3">
                    <card.icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-display text-lg font-semibold mb-1">{card.title}</h3>
                  <p className="text-xs text-emerald-600 font-medium mb-3">{card.subtitle}</p>
                  <ul className="space-y-2">
                    {card.points.map((point, j) => (
                      <li key={j} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                        <span className="leading-snug">{point}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* MOAT Feature Highlights */}
      <section className="bg-muted/30">
        <div className="max-w-[1200px] mx-auto px-4 py-20">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="text-center mb-14">
            <motion.h2 variants={fadeUp} className="font-display text-3xl md:text-4xl font-bold tracking-tight mb-4">The MOAT That Makes You Unbeatable</motion.h2>
            <motion.p variants={fadeUp} className="text-muted-foreground max-w-2xl mx-auto">Five capabilities that no generic proposal tool, AI writing assistant, or competitor can match.</motion.p>
          </motion.div>
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="grid sm:grid-cols-2 gap-6">
            {[
              {
                icon: Target,
                title: "Go/No-Go Decision Matrix",
                desc: "Score every RFP before you invest a single hour. 8 universal questions + 2 industry-specific questions produce a Bid/No-Bid/Conditional recommendation with risk flags. Stop wasting resources on unwinnable bids.",
                badge: "Bid Intelligence",
                color: "bg-rose-50 border-rose-200",
                iconColor: "text-rose-600 bg-rose-100",
              },
              {
                icon: GitBranch,
                title: "Sub-Type Specific Templates",
                desc: "A Globe valve proposal needs Cv calculations and noise prediction. A Centrifugal pump proposal needs NPSH analysis and hydraulic curves. Our templates know the difference — 5 valve sub-types and 3 pump sub-types, each with dedicated technical sections.",
                badge: "Technical Depth",
                color: "bg-blue-50 border-blue-200",
                iconColor: "text-blue-600 bg-blue-100",
              },
              {
                icon: Layers,
                title: "Industry-Specific TBE Tags",
                desc: "Generic tools give you 5-6 evaluation tags. WinsProposal generates 12-15 Technical Bid Evaluation tags per sub-type — fugitive emissions, fire-safe certification, actuator specs, seal plan compliance, and more. Every tag maps to actual evaluation criteria used by EPCs.",
                badge: "12-15 Tags Per Sub-Type",
                color: "bg-emerald-50 border-emerald-200",
                iconColor: "text-emerald-600 bg-emerald-100",
              },
              {
                icon: SlidersHorizontal,
                title: "Company-Size Adaptive Proposals",
                desc: "A ₹5 Cr valve manufacturer and a ₹500 Cr EPC firm need different proposal language, depth, and positioning. WinsProposal adapts executive summaries, commercial terms, and project references to match your company's scale.",
                badge: "Smart Scaling",
                color: "bg-purple-50 border-purple-200",
                iconColor: "text-purple-600 bg-purple-100",
              },
              {
                icon: PenTool,
                title: "AI-Generated Diagrams & PFDs",
                desc: "Every proposal section gets an auto-generated visual — Process Flow Diagrams for manufacturing, Gantt charts for project timelines, sequence diagrams for stakeholder interactions. No Visio, no PowerPoint — just click and your proposal has professional diagrams.",
                badge: "Auto Visuals",
                color: "bg-amber-50 border-amber-200",
                iconColor: "text-amber-600 bg-amber-100",
              },
            ].map((feat, i) => (
              <motion.div key={i} variants={fadeUp}>
                <Card className={`h-full shadow-md border ${feat.color}`}>
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${feat.iconColor}`}>
                        <feat.icon className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <h3 className="font-display text-base font-bold">{feat.title}</h3>
                          <Badge variant="secondary" className="text-[10px]">{feat.badge}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground leading-relaxed">{feat.desc}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Before/After */}
      <section className="max-w-[1200px] mx-auto px-4 py-20">
        <motion.h2 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="font-display text-3xl md:text-4xl font-bold tracking-tight text-center mb-12">
          From Manual Bid Chaos to Measurable Proposal Operations
        </motion.h2>
        <div className="grid md:grid-cols-2 gap-8">
          <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}>
            <Card className="h-full border-slate-200 bg-slate-50 shadow-md">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <XCircle className="w-5 h-5 text-slate-500" />
                  <h3 className="font-display text-lg font-semibold text-slate-700">Before</h3>
                </div>
                <ul className="space-y-3">
                  {[
                    "Excel compliance sheets maintained outside the proposal process",
                    "Copy-paste proposals assembled from scattered prior documents",
                    "Disconnected engineering responses with limited reuse",
                    "Manual bid/no-bid decisions without objective scoring",
                    "No executive proposal visibility across pipeline, quality, or effort",
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <XCircle className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                      {item}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </motion.div>
          <motion.div initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}>
            <Card className="h-full border-emerald-200 bg-emerald-50/50 shadow-md">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <CheckCircle className="w-5 h-5 text-emerald-600" />
                  <h3 className="font-display text-lg font-semibold text-emerald-700">With WinsProposal</h3>
                </div>
                <ul className="space-y-3">
                  {[
                    "AI-generated compliance matrix mapped to RFP clauses and TBE criteria",
                    "Reusable proposal intelligence drawn from approved technical content",
                    "AI-assisted diagrams, PFDs, project visuals, and engineering workflows",
                    "Executive bid dashboards for pipeline, value, turnaround, and reuse",
                    "Measurable proposal KPIs tied to compliance coverage and engineering effort",
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                      <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      {item}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* Technical Visualization */}
      <section className="bg-muted/30">
        <div className="max-w-[1200px] mx-auto px-4 py-20">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="grid lg:grid-cols-[0.9fr_1.1fr] gap-10 items-center">
            <div>
              <motion.div variants={fadeUp} className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary mb-4">
                <PenTool className="w-3.5 h-3.5" />
                Engineering proposal intelligence
              </motion.div>
              <motion.h2 variants={fadeUp} className="font-display text-3xl md:text-4xl font-bold tracking-tight mb-4">AI-Assisted Technical Visualization</motion.h2>
              <motion.p variants={fadeUp} className="text-muted-foreground leading-relaxed mb-6">
                Turn proposal logic into clear engineering visuals for evaluators, reviewers, and executive stakeholders. WinsProposal helps teams explain technical scope, compliance flow, and execution plans without leaving the bid workflow.
              </motion.p>
              <motion.div variants={fadeUp} className="grid sm:grid-cols-2 gap-3">
                {[
                  "Process flow diagrams",
                  "Architecture diagrams",
                  "Proposal workflows",
                  "Engineering visuals",
                  "Gantt/project execution visuals",
                  "Compliance flow diagrams",
                ].map((item) => (
                  <div key={item} className="flex items-center gap-2 rounded-lg border bg-background px-3 py-2 text-sm">
                    <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                    {item}
                  </div>
                ))}
              </motion.div>
            </div>
            <motion.div variants={fadeUp} className="rounded-xl border bg-background p-5 shadow-md">
              <div className="flex items-center justify-between border-b pb-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Technical visual set</p>
                  <h3 className="font-display text-lg font-semibold">Produced from proposal context</h3>
                </div>
                <Badge className="bg-emerald-500/10 text-emerald-700 border-emerald-200">AI-assisted</Badge>
              </div>
              <div className="grid md:grid-cols-2 gap-4 pt-5">
                <div className="rounded-lg border bg-slate-50 p-4">
                  <div className="mb-4 flex items-center justify-between text-xs text-muted-foreground">
                    <span>PFD: Valve skid scope</span>
                    <span>API 600</span>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="h-10 w-24 rounded bg-white border flex items-center justify-center text-[10px] font-medium">Inlet Header</div>
                      <div className="h-px flex-1 bg-slate-300" />
                      <div className="h-10 w-24 rounded bg-emerald-50 border border-emerald-200 flex items-center justify-center text-[10px] font-medium">Gate Valve</div>
                    </div>
                    <div className="ml-auto mr-10 h-8 w-px bg-slate-300" />
                    <div className="flex items-center gap-2">
                      <div className="h-10 w-24 rounded bg-white border flex items-center justify-center text-[10px] font-medium">Actuator</div>
                      <div className="h-px flex-1 bg-slate-300" />
                      <div className="h-10 w-24 rounded bg-white border flex items-center justify-center text-[10px] font-medium">Outlet</div>
                    </div>
                  </div>
                </div>
                <div className="rounded-lg border bg-slate-50 p-4">
                  <div className="mb-4 flex items-center justify-between text-xs text-muted-foreground">
                    <span>Execution view</span>
                    <span>12 weeks</span>
                  </div>
                  {[
                    { label: "Engineering", width: "75%" },
                    { label: "Procurement", width: "62%" },
                    { label: "Assembly", width: "48%" },
                    { label: "Testing", width: "34%" },
                  ].map((row) => (
                    <div key={row.label} className="mb-3 grid grid-cols-[88px_1fr] items-center gap-3">
                      <span className="text-[10px] text-muted-foreground">{row.label}</span>
                      <div className="h-2 rounded-full bg-slate-200">
                        <div className="h-full rounded-full bg-primary" style={{ width: row.width }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Knowledge Vault */}
      <section className="max-w-[1200px] mx-auto px-4 py-20">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="text-center mb-12">
          <motion.h2 variants={fadeUp} className="font-display text-3xl md:text-4xl font-bold tracking-tight mb-4">Enterprise Knowledge Preservation</motion.h2>
          <motion.p variants={fadeUp} className="text-muted-foreground max-w-2xl mx-auto">
            Capture the bid knowledge that usually stays trapped in inboxes, spreadsheets, and senior engineers' memory, then reuse it safely across future pursuits.
          </motion.p>
        </motion.div>
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="grid md:grid-cols-5 gap-4">
          {[
            { title: "Reusable proposal responses", desc: "Approved answers for recurring commercial and technical clauses." },
            { title: "Historical bid knowledge", desc: "Past pursuit decisions, technical positions, and win/loss context." },
            { title: "Technical clause library", desc: "API, TBE, actuator, seal plan, NPSH, and compliance language." },
            { title: "Compliance templates", desc: "Structured matrices that map RFP clauses to response evidence." },
            { title: "Engineering response reuse", desc: "Reduce repeated SME effort while preserving review control." },
          ].map((item, i) => (
            <motion.div key={item.title} variants={fadeUp}>
              <Card className="h-full border-0 shadow-md">
                <CardContent className="p-5">
                  <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <Layers className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="font-display text-sm font-semibold mb-2">{item.title}</h3>
                  <p className="text-xs leading-relaxed text-muted-foreground">{item.desc}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Executive Dashboard */}
      <section className="bg-muted/30">
        <div className="max-w-[1200px] mx-auto px-4 py-20">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="grid lg:grid-cols-[0.85fr_1.15fr] gap-10 items-center">
            <div>
              <motion.h2 variants={fadeUp} className="font-display text-3xl md:text-4xl font-bold tracking-tight mb-4">Executive Proposal Dashboard</motion.h2>
              <motion.p variants={fadeUp} className="text-muted-foreground leading-relaxed mb-6">
                Give leadership a clean operating view of proposal pipeline, bid value, turnaround, compliance coverage, reuse, and engineering hours saved.
              </motion.p>
              <motion.div variants={fadeUp} className="flex flex-wrap gap-2">
                {["Pipeline", "Bid value", "Turnaround", "Compliance", "Reuse", "Engineering effort"].map((tag) => (
                  <Badge key={tag} variant="outline" className="bg-background">{tag}</Badge>
                ))}
              </motion.div>
            </div>
            <motion.div variants={fadeUp} className="rounded-xl border bg-background p-5 shadow-lg">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Enterprise KPI view</p>
                  <h3 className="font-display text-lg font-semibold">Proposal operations</h3>
                </div>
                <Badge className="bg-primary text-primary-foreground">Q2 pipeline</Badge>
              </div>
              <div className="grid sm:grid-cols-3 gap-3 mb-5">
                {[
                  { label: "Proposal pipeline", value: "34", sub: "active pursuits" },
                  { label: "Bid value", value: "$42M", sub: "qualified" },
                  { label: "Turnaround", value: "1.8d", sub: "median cycle" },
                ].map((item) => (
                  <div key={item.label} className="rounded-lg border bg-slate-50 p-4">
                    <div className="text-xs text-muted-foreground">{item.label}</div>
                    <div className="mt-1 font-display text-2xl font-bold">{item.value}</div>
                    <div className="text-[11px] text-emerald-700">{item.sub}</div>
                  </div>
                ))}
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="rounded-lg border p-4">
                  {[
                    { label: "Compliance coverage", value: "91%" },
                    { label: "Proposal reuse", value: "46%" },
                    { label: "Engineering hours saved", value: "310h" },
                  ].map((row) => (
                    <div key={row.label} className="mb-4 last:mb-0">
                      <div className="mb-1 flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">{row.label}</span>
                        <span className="font-semibold">{row.value}</span>
                      </div>
                      <div className="h-2 rounded-full bg-slate-100">
                        <div className="h-full rounded-full bg-emerald-500" style={{ width: row.value.endsWith("%") ? row.value : "78%" }} />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="rounded-lg border p-4">
                  <div className="mb-3 text-xs font-semibold text-muted-foreground">Bid mix by workflow</div>
                  {[
                    { label: "EPC packages", value: "38%", color: "bg-primary" },
                    { label: "Valve proposals", value: "34%", color: "bg-emerald-500" },
                    { label: "Pump proposals", value: "28%", color: "bg-amber-500" },
                  ].map((row) => (
                    <div key={row.label} className="mb-3 grid grid-cols-[96px_1fr_36px] items-center gap-2 text-xs">
                      <span className="text-muted-foreground">{row.label}</span>
                      <div className="h-2 rounded-full bg-slate-100">
                        <div className={`h-full rounded-full ${row.color}`} style={{ width: row.value }} />
                      </div>
                      <span className="text-right font-semibold">{row.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* How It Works — 5 Steps */}
      <section id="how-it-works" className="bg-muted/30">
        <div className="max-w-[1200px] mx-auto px-4 py-20">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="text-center mb-12">
            <motion.h2 variants={fadeUp} className="font-display text-3xl md:text-4xl font-bold tracking-tight mb-4">How It Works</motion.h2>
            <motion.p variants={fadeUp} className="text-muted-foreground max-w-xl mx-auto">Five steps from RFP upload to winning submission — with intelligence at every stage.</motion.p>
          </motion.div>
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="grid sm:grid-cols-2 lg:grid-cols-5 gap-5">
            {[
              { icon: Upload, step: "01", title: "Upload RFP", desc: "Drop your RFP document. Select your industry and product sub-type (e.g., Globe Valve, Centrifugal Pump)." },
              { icon: Target, step: "02", title: "Go/No-Go Score", desc: "Answer 10 strategic questions. Get a Bid/No-Bid/Conditional recommendation with risk flags before you invest time." },
              { icon: Search, step: "03", title: "AI Matches Vault", desc: "AI cross-references your Knowledge Vault and generates sub-type-specific TBE tags and compliance mappings." },
              { icon: FileText, step: "04", title: "Generate Proposal", desc: "A complete proposal with sub-type-specific sections, auto-generated PFDs, Gantt charts, and flowcharts — not generic filler." },
              { icon: Trophy, step: "05", title: "Review & Win", desc: "Edit inline, check your Win Score, export branded PDF/DOCX, and submit a proposal that outclasses competitors." },
            ].map((item, i) => (
              <motion.div key={i} variants={fadeUp}>
                <Card className="h-full text-center hover:shadow-lg transition-shadow duration-300 border-0 shadow-md">
                  <CardContent className="p-5">
                    <div className="text-xs font-mono font-bold text-emerald-600 mb-3">{item.step}</div>
                    <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
                      <item.icon className="w-5 h-5 text-primary" />
                    </div>
                    <h3 className="font-display text-sm font-semibold mb-2">{item.title}</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Outcomes */}
      <section id="outcomes" className="bg-gradient-to-br from-[#1a365d] to-[#0f2440] text-white">
        <div className="max-w-[1200px] mx-auto px-4 py-20">
          <motion.h2 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="font-display text-3xl md:text-4xl font-bold tracking-tight text-center mb-4">
            Results That Speak
          </motion.h2>
          <motion.p initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-blue-200 text-center mb-12 max-w-xl mx-auto">
            Measured across valve, pump, and EPC proposal workflows.
          </motion.p>
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="grid md:grid-cols-4 gap-8">
            {[
              { icon: Clock, value: 50, suffix: "%", label: "Faster Turnaround", sub: "Shorter proposal cycles with AI-assisted drafting" },
              { icon: BarChart3, value: 3, suffix: "x", label: "Proposal Throughput", sub: "Handle more qualified bids with the same team" },
              { icon: TrendingUp, value: 46, suffix: "%", label: "Proposal Reuse", sub: "Approved technical answers reused across pursuits" },
              { icon: ShieldCheck, value: 15, suffix: "+", label: "TBE Tags / Sub-Type", sub: "Technical criteria for valves, pumps, and EPC workflows" },
            ].map((item, i) => (
              <motion.div key={i} variants={fadeUp} className="text-center">
                <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center mx-auto mb-4">
                  <item.icon className="w-7 h-7 text-emerald-400" />
                </div>
                <div className="font-display text-4xl md:text-5xl font-bold mb-2">
                  <CountUp end={item.value ?? 0} suffix={item.suffix ?? ""} />
                </div>
                <div className="font-semibold text-lg mb-1">{item.label}</div>
                <div className="text-sm text-blue-200">{item.sub}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Demo Showcase Section */}
      <section className="max-w-[1200px] mx-auto px-4 py-20">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="text-center mb-10">
          <motion.h2 variants={fadeUp} className="font-display text-3xl md:text-4xl font-bold tracking-tight mb-4">See It In Action</motion.h2>
          <motion.p variants={fadeUp} className="text-muted-foreground">From RFP upload to Go/No-Go decision to sub-type-specific proposal — watch the full workflow.</motion.p>
        </motion.div>
        <DemoShowcase />
      </section>

      {/* CTA */}
      <section className="bg-muted/30">
        <div className="max-w-[1200px] mx-auto px-4 py-20 text-center">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}>
            <motion.h2 variants={fadeUp} className="font-display text-3xl md:text-4xl font-bold tracking-tight mb-4">Stop Guessing. Start Winning.</motion.h2>
            <motion.p variants={fadeUp} className="text-muted-foreground mb-8 max-w-lg mx-auto">Join valve, pump, and EPC leaders who use Go/No-Go intelligence and sub-type-specific proposals to close more contracts.</motion.p>
            <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/demo">
                <Button size="lg" className="bg-emerald-500 hover:bg-emerald-600 text-white px-8">
                  Book a Demo <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
              <Link href="/samples">
                <Button size="lg" variant="outline" className="px-8">
                  See Sample Proposals
                </Button>
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card">
        <div className="max-w-[1200px] mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center">
                <Zap className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="font-display text-base font-bold">WinsProposal</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <Link href="/samples" className="hover:text-foreground transition-colors">Samples</Link>
              <Link href="/pricing" className="hover:text-foreground transition-colors">Pricing</Link>
              <Link href="/demo" className="hover:text-foreground transition-colors">Book Demo</Link>
              <Link href="/login" className="hover:text-foreground transition-colors">Log In</Link>
            </div>
            <p className="text-xs text-muted-foreground">&copy; 2026 WinsProposal. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
