"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload, Brain, FileText, Download, Target,
  CheckCircle, ArrowRight, ChevronLeft, ChevronRight,
  FileSearch, BarChart3, Shield, AlertTriangle, Gauge, GitBranch,
} from "lucide-react";

const steps = [
  {
    id: 1,
    title: "Upload RFP & Select Sub-Type",
    subtitle: "Step 1",
    description: "Upload your RFP document and select your exact product sub-type. WinsProposal loads dedicated templates, TBE tags, and compliance items specific to your selection — Gate Valve gets different sections than a Butterfly Valve.",
    icon: Upload,
    color: "from-blue-500 to-blue-600",
    bgColor: "bg-blue-500/10",
    details: [
      { icon: FileSearch, label: "Auto-extracts line items & requirements" },
      { icon: GitBranch, label: "5 valve + 3 pump sub-types to choose from" },
      { icon: Shield, label: "Sub-type-specific compliance auto-loaded" },
    ],
    mockUI: (
      <div className="bg-slate-900 rounded-lg p-5 text-white space-y-4 shadow-xl">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-slate-400">Upload RFP</span>
          <span className="text-xs text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded">PDF, DOCX, TXT</span>
        </div>
        <div className="bg-slate-800 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400" />
            <span className="text-xs text-slate-300">BPCL_Kochi_Gate_Valve_RFP.pdf</span>
            <span className="text-xs text-emerald-400 ml-auto">✓ Uploaded</span>
          </div>
        </div>
        <div className="space-y-2">
          <span className="text-xs text-slate-400">Select Product Sub-Type</span>
          <div className="grid grid-cols-2 gap-2">
            {["Gate Valve", "Globe Valve", "Ball Valve", "Butterfly"].map((v, i) => (
              <div key={i} className={`text-xs px-3 py-2 rounded border text-center transition-all ${
                i === 0 ? "border-emerald-400 bg-emerald-400/10 text-emerald-400" : "border-slate-600 text-slate-400 hover:border-slate-500"
              }`}>
                {v}
              </div>
            ))}
          </div>
          <div className="bg-blue-500/10 border border-blue-400/30 rounded p-2 flex items-center gap-2 mt-1">
            <Shield className="w-3 h-3 text-blue-400 shrink-0" />
            <span className="text-[10px] text-blue-300">Gate Valve template loaded: 10 sections · 15 TBE tags · 8 compliance items</span>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 2,
    title: "Go/No-Go Decision Matrix",
    subtitle: "Step 2",
    description: "Before investing hours in proposal creation, answer 10 strategic questions (8 universal + 2 industry-specific). Get an instant Bid / No-Bid / Conditional recommendation with risk flags and weighted scoring.",
    icon: Target,
    color: "from-rose-500 to-rose-600",
    bgColor: "bg-rose-500/10",
    details: [
      { icon: Target, label: "8 universal + 2 industry-specific questions" },
      { icon: AlertTriangle, label: "Risk flags for deal-breakers" },
      { icon: BarChart3, label: "Weighted score → Bid / No-Bid / Conditional" },
    ],
    mockUI: (
      <div className="bg-slate-900 rounded-lg p-5 text-white space-y-3 shadow-xl">
        <div className="flex items-center gap-2 mb-1">
          <Target className="w-4 h-4 text-rose-400" />
          <span className="text-sm font-medium text-slate-300">Go/No-Go Assessment</span>
        </div>
        {[
          { q: "Past experience with this client?", a: "Yes — 3 projects", score: 5 },
          { q: "Technical capability match?", a: "Full match", score: 5 },
          { q: "Competition intensity?", a: "3-4 competitors", score: 3 },
          { q: "Payment terms acceptable?", a: "LC at sight", score: 4 },
        ].map((item, i) => (
          <div key={i} className="bg-slate-800 rounded p-2 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-slate-400">{item.q}</span>
              <span className="text-[10px] text-emerald-400">{item.score}/5</span>
            </div>
            <span className="text-xs text-slate-300">{item.a}</span>
          </div>
        ))}
        <div className="bg-emerald-400/10 border border-emerald-400/30 rounded-lg p-3 text-center">
          <div className="text-lg font-bold text-emerald-400">Score: 82/100</div>
          <div className="text-xs text-emerald-300">✓ Recommendation: BID — Strong fit</div>
        </div>
      </div>
    ),
  },
  {
    id: 3,
    title: "AI Analyzes & Matches Vault",
    subtitle: "Step 3",
    description: "Our AI cross-references the RFP against your Knowledge Vault — past proposals, datasheets, certifications — and generates sub-type-specific TBE tags with compliance mappings tailored to your exact product category.",
    icon: Brain,
    color: "from-purple-500 to-purple-600",
    bgColor: "bg-purple-500/10",
    details: [
      { icon: Brain, label: "Matches against Knowledge Vault documents" },
      { icon: Gauge, label: "Generates 12-15 TBE tags per sub-type" },
      { icon: Shield, label: "Maps API 600/607/610/682 compliance" },
    ],
    mockUI: (
      <div className="bg-slate-900 rounded-lg p-5 text-white space-y-3 shadow-xl">
        <div className="flex items-center gap-2 mb-1">
          <Brain className="w-4 h-4 text-purple-400" />
          <span className="text-sm font-medium text-slate-300">AI Analysis — Gate Valve</span>
        </div>
        {[
          { label: "Parsing RFP requirements", pct: 100, color: "bg-emerald-400" },
          { label: "Matching Knowledge Vault", pct: 100, color: "bg-blue-400" },
          { label: "Generating Gate Valve TBE tags (15)", pct: 100, color: "bg-purple-400" },
          { label: "Mapping API 600/607/NACE compliance", pct: 85, color: "bg-amber-400" },
        ].map((item, i) => (
          <div key={i} className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400">{item.label}</span>
              <span className="text-xs text-slate-500">{item.pct}%</span>
            </div>
            <div className="h-1 bg-slate-700 rounded-full overflow-hidden">
              <div className={`h-full ${item.color} rounded-full transition-all duration-1000`} style={{ width: `${item.pct}%` }} />
            </div>
          </div>
        ))}
        <div className="bg-slate-800 rounded p-2">
          <p className="text-[10px] text-slate-400 mb-1.5">Gate Valve TBE Tags Generated:</p>
          <div className="flex flex-wrap gap-1">
            {["Fugitive Emissions", "Fire-Safe API 607", "SIL Rating", "Actuator Torque", "NACE MR0175", "Stellite Overlay"].map((tag, i) => (
              <span key={i} className="text-[9px] bg-purple-500/20 text-purple-300 px-1.5 py-0.5 rounded">{tag}</span>
            ))}
            <span className="text-[9px] text-slate-500">+9 more</span>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 4,
    title: "Review Proposal & Diagrams",
    subtitle: "Step 4",
    description: "Review the AI-generated proposal with sub-type-specific sections, auto-generated PFDs, Gantt charts, and flowcharts. Check your Win Score, edit inline, regenerate any section or diagram with a click.",
    icon: FileText,
    color: "from-emerald-500 to-emerald-600",
    bgColor: "bg-emerald-500/10",
    details: [
      { icon: FileText, label: "Sub-type-specific technical sections" },
      { icon: GitBranch, label: "AI-generated PFDs, Gantt charts, flowcharts" },
      { icon: BarChart3, label: "Win Score with technical depth metrics" },
    ],
    mockUI: (
      <div className="bg-slate-900 rounded-lg p-5 text-white space-y-3 shadow-xl">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-slate-300">Gate Valve Proposal — BPCL Kochi</span>
          <span className="text-xs bg-emerald-400/20 text-emerald-400 px-2 py-0.5 rounded">Win Score: 87%</span>
        </div>
        {[
          { title: "Executive Summary", preview: "Supply of API 600 Gate Valves for GOSP-IV..." },
          { title: "Actuator Specifications", preview: "Torque: 850 Nm @ 10 bar. Fail-safe: spring-return close..." },
          { title: "Fugitive Emissions Compliance", preview: "ISO 15848-1 Class BH certified. Stem packing: low-E graphite..." },
        ].map((s, i) => (
          <div key={i} className="bg-slate-800 rounded p-2.5 hover:bg-slate-750 transition-colors cursor-pointer">
            <div className="flex items-center gap-2 mb-0.5">
              <CheckCircle className="w-3 h-3 text-emerald-400" />
              <span className="text-xs font-medium text-white">{s.title}</span>
            </div>
            <p className="text-[10px] text-slate-400 line-clamp-1">{s.preview}</p>
          </div>
        ))}
        <div className="bg-slate-800 rounded p-2.5 border border-amber-400/30">
          <div className="flex items-center gap-2 mb-1">
            <GitBranch className="w-3 h-3 text-amber-400" />
            <span className="text-[10px] font-medium text-amber-300">AI-Generated Diagrams</span>
          </div>
          <div className="flex gap-1.5">
            {["PFD", "Gantt", "Flowchart", "Sequence"].map((d) => (
              <span key={d} className="text-[9px] bg-amber-500/15 text-amber-300 px-1.5 py-0.5 rounded">{d}</span>
            ))}
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 5,
    title: "Export & Submit",
    subtitle: "Step 5",
    description: "Export your polished proposal as branded PDF or DOCX — complete with company logo, process diagrams, table of contents, and sub-type-specific technical annexures. Ready for submission.",
    icon: Download,
    color: "from-amber-500 to-amber-600",
    bgColor: "bg-amber-500/10",
    details: [
      { icon: Download, label: "PDF & DOCX with company branding" },
      { icon: FileText, label: "Auto-generated process diagrams" },
      { icon: CheckCircle, label: "TOC, page numbers, technical annexures" },
    ],
    mockUI: (
      <div className="bg-slate-900 rounded-lg p-5 text-white space-y-3 shadow-xl">
        <div className="flex items-center gap-2 mb-1">
          <Download className="w-4 h-4 text-amber-400" />
          <span className="text-sm font-medium text-slate-300">Export Options</span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {[
            { format: "PDF", desc: "Branded with logo, TOC, diagrams", color: "text-red-400 bg-red-400/10" },
            { format: "DOCX", desc: "Editable Word with layout", color: "text-blue-400 bg-blue-400/10" },
          ].map((f, i) => (
            <div key={i} className="bg-slate-800 rounded-lg p-3 text-center hover:ring-1 hover:ring-slate-600 transition-all cursor-pointer">
              <span className={`text-lg font-bold ${f.color} px-3 py-1 rounded`}>{f.format}</span>
              <p className="text-xs text-slate-400 mt-2">{f.desc}</p>
            </div>
          ))}
        </div>
        <div className="bg-emerald-400/10 border border-emerald-400/30 rounded-lg p-3 flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
          <div>
            <p className="text-sm font-medium text-emerald-400">Proposal Ready!</p>
            <p className="text-xs text-slate-400">Gate_Valve_BPCL_Kochi.pdf — 14 pages · 15 TBE tags</p>
          </div>
        </div>
      </div>
    ),
  },
];

export function DemoShowcase() {
  const [activeStep, setActiveStep] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  const goNext = useCallback(() => {
    setActiveStep((prev) => (prev + 1) % steps.length);
  }, []);

  const goPrev = useCallback(() => {
    setActiveStep((prev) => (prev - 1 + steps.length) % steps.length);
  }, []);

  useEffect(() => {
    if (!isAutoPlaying) return;
    const timer = setInterval(goNext, 5000);
    return () => clearInterval(timer);
  }, [isAutoPlaying, goNext]);

  const step = steps[activeStep];
  const StepIcon = step.icon;

  return (
    <div className="max-w-4xl mx-auto">
      {/* Step indicators */}
      <div className="flex items-center justify-center gap-1.5 md:gap-2 mb-8 flex-wrap">
        {steps.map((s, i) => {
          const Icon = s.icon;
          return (
            <button
              key={s.id}
              onClick={() => { setActiveStep(i); setIsAutoPlaying(false); }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-300 ${
                i === activeStep
                  ? "bg-primary text-primary-foreground shadow-md scale-105"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{s.subtitle}</span>
            </button>
          );
        })}
      </div>

      {/* Main showcase */}
      <div className="relative bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 rounded-2xl shadow-xl overflow-hidden border border-border/50">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeStep}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
            className="grid md:grid-cols-2 gap-0"
          >
            {/* Left: Info */}
            <div className="p-8 md:p-10 flex flex-col justify-center">
              <div className={`inline-flex items-center gap-2 ${step.bgColor} rounded-full px-3 py-1 w-fit mb-4`}>
                <StepIcon className="w-4 h-4 text-primary" />
                <span className="text-sm font-semibold text-primary">{step.subtitle}</span>
              </div>
              <h3 className="font-display text-2xl md:text-3xl font-bold mb-3">{step.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed mb-6">{step.description}</p>
              <div className="space-y-3">
                {step.details.map((d, i) => {
                  const DIcon = d.icon;
                  return (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 + i * 0.1 }}
                      className="flex items-center gap-3"
                    >
                      <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <DIcon className="w-3.5 h-3.5 text-primary" />
                      </div>
                      <span className="text-sm">{d.label}</span>
                    </motion.div>
                  );
                })}
              </div>
            </div>

            {/* Right: Mock UI */}
            <div className="p-6 md:p-8 flex items-center justify-center bg-gradient-to-br from-slate-800 to-slate-900 dark:from-slate-950 dark:to-black">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.4 }}
                className="w-full max-w-sm"
              >
                {step.mockUI}
              </motion.div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Navigation arrows */}
        <button
          onClick={() => { goPrev(); setIsAutoPlaying(false); }}
          className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/80 dark:bg-slate-700/80 shadow-md flex items-center justify-center hover:bg-white dark:hover:bg-slate-600 transition-colors z-10"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <button
          onClick={() => { goNext(); setIsAutoPlaying(false); }}
          className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/80 dark:bg-slate-700/80 shadow-md flex items-center justify-center hover:bg-white dark:hover:bg-slate-600 transition-colors z-10"
        >
          <ChevronRight className="w-5 h-5" />
        </button>

        {/* Progress bar */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-200 dark:bg-slate-700">
          <motion.div
            className="h-full bg-primary"
            initial={{ width: "0%" }}
            animate={{ width: `${((activeStep + 1) / steps.length) * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>

      {/* Step counter */}
      <div className="flex items-center justify-center gap-1 mt-4">
        {steps.map((_, i) => (
          <div
            key={i}
            className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
              i === activeStep ? "w-6 bg-primary" : "w-1.5 bg-muted-foreground/30"
            }`}
            onClick={() => { setActiveStep(i); setIsAutoPlaying(false); }}
          />
        ))}
      </div>
    </div>
  );
}
