"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ArrowUpRight,
  CheckCircle2,
  Download,
  Eye,
  Factory,
  FileCheck2,
  HardHat,
  LayoutTemplate,
  ListChecks,
  PencilRuler,
  ShieldCheck,
  Tags,
  Workflow,
} from "lucide-react";
import { cn } from "@/lib/utils";

type TemplateFamily = {
  name: string;
  family: "Valve Templates" | "Pump Templates" | "EPC Templates";
  description: string;
  sections: string[];
  complianceFocus: string[];
  tbeTags: string[];
  recommendedVisuals: string[];
  exportReadiness: string;
  bestFit: string[];
  templateId: string;
  subTypeId?: string;
};

const familyStyles: Record<TemplateFamily["family"], { icon: any; className: string }> = {
  "Valve Templates": {
    icon: Factory,
    className: "border-blue-200 bg-blue-50 text-blue-700",
  },
  "Pump Templates": {
    icon: Workflow,
    className: "border-teal-200 bg-teal-50 text-teal-700",
  },
  "EPC Templates": {
    icon: HardHat,
    className: "border-amber-200 bg-amber-50 text-amber-700",
  },
};

const templateFamilies: TemplateFamily[] = [
  {
    family: "Valve Templates",
    name: "Severe-Service Control Valve Proposal",
    templateId: "valve-oem",
    subTypeId: "globe",
    description: "A proposal structure for cavitation, flashing, high-pressure letdown, noise, and engineered trim packages.",
    sections: ["Application basis", "Sizing and trim selection", "Noise and cavitation review", "Inspection and documentation"],
    complianceFocus: ["ISA/IEC sizing basis", "ASME B16.34", "NACE MR0175", "Hydrostatic and seat leakage testing"],
    tbeTags: ["Cv/Kv", "Trim type", "Noise", "Cavitation", "Leakage class", "Materials"],
    recommendedVisuals: ["PFD-style drawing", "Valve package schematic", "Risk/deviation tree"],
    exportReadiness: "PDF and DOCX proposal pack with technical schedules, compliance table, and data-book placeholders.",
    bestFit: ["Refinery pressure letdown", "Petrochemical severe service", "Power and utility services"],
  },
  {
    family: "Valve Templates",
    name: "LNG Compressor Recycle / Anti-Surge Proposal",
    templateId: "valve-oem",
    subTypeId: "globe",
    description: "Dedicated structure for fast-response compressor recycle valves and anti-surge technical positioning.",
    sections: ["Compressor recycle duty", "Actuator response", "Noise and acoustic review", "Control loop integration"],
    complianceFocus: ["API/ASME pressure boundary", "SIL and fail-safe action", "Low-temperature material review", "FAT documentation"],
    tbeTags: ["Response time", "Fail action", "Actuator type", "Noise", "Seat leakage", "Control accessories"],
    recommendedVisuals: ["P&ID-lite control loop", "Valve package schematic", "Delivery schedule"],
    exportReadiness: "Submission-ready narrative, TBE response grid, drawing appendix, and export-safe schedule.",
    bestFit: ["LNG plants", "Compressor stations", "Cryogenic gas processing"],
  },
  {
    family: "Valve Templates",
    name: "Hydrogen Process Control Valve Proposal",
    templateId: "valve-oem",
    subTypeId: "globe",
    description: "Template for hydrogen compatibility, leakage control, material traceability, and documentation-heavy bids.",
    sections: ["Hydrogen service basis", "Material compatibility", "Leakage and packing", "QA/QC dossier"],
    complianceFocus: ["Hydrogen embrittlement review", "ISO 15848", "Material traceability", "PMI and pressure testing"],
    tbeTags: ["Hydrogen service", "Packing", "Leakage class", "Traceability", "PMI", "Seat material"],
    recommendedVisuals: ["PFD-style drawing", "Compliance matrix", "TBE matrix"],
    exportReadiness: "DOCX and PDF exports with material records, compliance checklist, and client response language.",
    bestFit: ["Hydrogen production", "Export headers", "Clean fuels and decarbonization projects"],
  },
  {
    family: "Valve Templates",
    name: "Refinery Severe-Service Control Valve Proposal",
    templateId: "valve-oem",
    subTypeId: "globe",
    description: "Refinery-focused package for sour service, flashing, cavitation, erosion, and shutdown constraints.",
    sections: ["Refinery service conditions", "Severe-service trim", "Shutdown and tie-in plan", "Compliance response"],
    complianceFocus: ["NACE MR0175", "API 598", "ASME B16.34", "Client refinery specifications"],
    tbeTags: ["NACE", "Trim metallurgy", "Pressure drop", "Flashing", "Inspection", "Documentation"],
    recommendedVisuals: ["PFD-style drawing", "Risk/deviation tree", "Compliance matrix"],
    exportReadiness: "Complete refinery proposal flow with deviation register, inspection plan, and export-ready appendix.",
    bestFit: ["Refinery units", "Brownfield revamps", "High-pressure hydrocarbon services"],
  },
  {
    family: "Valve Templates",
    name: "Steam Conditioning Valve Proposal",
    templateId: "valve-oem",
    subTypeId: "globe",
    description: "Proposal pattern for steam letdown, desuperheating, spray-water control, and thermal cycling.",
    sections: ["Steam duty summary", "Pressure letdown design", "Desuperheating arrangement", "Thermal cycling risk"],
    complianceFocus: ["ASME pressure design", "Noise limits", "Material selection", "Functional and hydrostatic testing"],
    tbeTags: ["Steam pressure", "Temperature", "Spray water", "Noise", "Thermal cycle", "Actuation"],
    recommendedVisuals: ["Valve package schematic", "P&ID-lite control loop", "Delivery schedule"],
    exportReadiness: "Proposal-ready technical narrative with drawings, compliance focus, and export pack structure.",
    bestFit: ["Power plants", "Refineries", "Process steam networks"],
  },
  {
    family: "Valve Templates",
    name: "API 600 On/Off Valve Proposal",
    templateId: "valve-oem",
    subTypeId: "gate",
    description: "Clean API 600 isolation valve proposal for material traceability, testing, and data-book delivery.",
    sections: ["Scope of supply", "API 600 construction", "Inspection and testing", "MDR and final documentation"],
    complianceFocus: ["API 600", "API 598", "ASME B16.34", "PED and NACE where applicable"],
    tbeTags: ["Pressure class", "End connection", "Body material", "Trim", "Testing", "Certification"],
    recommendedVisuals: ["Valve package schematic", "Compliance matrix", "Delivery schedule"],
    exportReadiness: "PDF/DOCX offer with inspection checklist, datasheet summary, and compliance statements.",
    bestFit: ["Refinery isolation", "Pipeline packages", "General process industries"],
  },
  {
    family: "Pump Templates",
    name: "API 610 Pump Proposal",
    templateId: "pump-oem",
    subTypeId: "centrifugal",
    description: "Centrifugal pump proposal structure for duty conditions, NPSH, seal plans, testing, and guarantees.",
    sections: ["Hydraulic basis", "Performance curves", "Seal and driver package", "Testing and guarantees"],
    complianceFocus: ["API 610", "API 682", "ISO 13709", "Vibration and performance test acceptance"],
    tbeTags: ["Flow", "Head", "NPSH", "Seal plan", "Driver", "Performance guarantee"],
    recommendedVisuals: ["PFD-style drawing", "TBE matrix", "Delivery schedule"],
    exportReadiness: "Export-ready technical proposal with pump datasheet, compliance checklist, and TBE response.",
    bestFit: ["Refinery utilities", "Petrochemical process pumps", "Power and industrial services"],
  },
  {
    family: "Pump Templates",
    name: "Water Infrastructure Pump Proposal",
    templateId: "pump-oem",
    subTypeId: "submersible",
    description: "Infrastructure template for pump station duty, installation constraints, testing, and lifecycle support.",
    sections: ["Pump station design basis", "Installation requirements", "Motor and VFD package", "Lifecycle service"],
    complianceFocus: ["Hydraulic Institute guidance", "Motor protection", "Factory testing", "Municipal documentation"],
    tbeTags: ["Capacity", "Head", "Motor rating", "Solids handling", "Installation depth", "Testing"],
    recommendedVisuals: ["PFD-style drawing", "KPI dashboard", "Delivery schedule"],
    exportReadiness: "Submission-ready export pack with duty summary, lifecycle sections, and compliance preview.",
    bestFit: ["Water supply", "Wastewater stations", "Stormwater and drainage projects"],
  },
  {
    family: "EPC Templates",
    name: "Process Engineering Package",
    templateId: "process-engineering-package",
    description: "Process engineering proposal for design basis, PFDs, P&IDs, datasheets, HAZOP actions, and IFC control.",
    sections: ["Process design basis", "PFD and P&ID workflow", "Equipment datasheets", "HAZOP and IFC release"],
    complianceFocus: ["Client design basis", "P&ID review closure", "HAZOP tracking", "Document control"],
    tbeTags: ["Design basis", "P&ID", "Datasheet", "HAZOP", "Interface", "IFC"],
    recommendedVisuals: ["PFD-style drawing", "P&ID-lite control loop", "Compliance matrix"],
    exportReadiness: "DOCX/PDF engineering response with deliverable register, compliance preview, and schedule sections.",
    bestFit: ["FEED packages", "Process plant revamps", "Industrial engineering scopes"],
  },
  {
    family: "EPC Templates",
    name: "Industrial Automation Package",
    templateId: "industrial-automation",
    description: "Automation proposal template for PLC/SCADA, instrumentation, loop deliverables, FAT/SAT, and cybersecurity boundary.",
    sections: ["Control system architecture", "Instrumentation and loop deliverables", "Cause and effect", "FAT/SAT plan"],
    complianceFocus: ["IEC 61131", "ISA 5.1", "FAT/SAT acceptance", "IEC 62443-aligned controls"],
    tbeTags: ["PLC", "SCADA", "I/O", "Loop drawing", "FAT", "Cybersecurity"],
    recommendedVisuals: ["P&ID-lite control loop", "TBE matrix", "Risk/deviation tree"],
    exportReadiness: "Proposal pack with automation scope, compliance matrix, FAT/SAT schedule, and export-ready appendix.",
    bestFit: ["Industrial automation", "Control system upgrades", "Instrumentation packages"],
  },
];

const families = ["Valve Templates", "Pump Templates", "EPC Templates"] as const;

export function TemplatesClient() {
  return (
    <div className="mx-auto max-w-[1280px] p-4 md:p-8">
      <div className="mb-8">
        <h1 className="font-display text-2xl font-bold tracking-tight md:text-3xl flex items-center gap-2">
          <LayoutTemplate className="h-7 w-7 text-primary" />
          Proposal Template Library
        </h1>
        <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
          Enterprise-ready proposal templates organized by product family, technical section structure, compliance evidence, TBE tags, recommended drawings, and export readiness.
        </p>
      </div>

      <div className="mb-8 grid gap-4 md:grid-cols-3">
        {families.map((family) => {
          const style = familyStyles[family];
          const Icon = style.icon;
          const count = templateFamilies.filter((template) => template.family === family).length;
          return (
            <Card key={family} className="border-slate-200 shadow-sm">
              <CardContent className="p-5">
                <div className={cn("mb-4 flex h-11 w-11 items-center justify-center rounded-lg border", style.className)}>
                  <Icon className="h-5 w-5" />
                </div>
                <h2 className="font-display text-lg font-semibold">{family}</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {count} structured templates with section logic, compliance focus, TBE tags, and export packaging.
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-5">
        {templateFamilies.map((template) => {
          const style = familyStyles[template.family];
          const useHref = `/upload-rfp?template=${template.templateId}${template.subTypeId ? `&subType=${template.subTypeId}` : ""}`;
          return (
            <Card key={template.name} className="overflow-hidden border-slate-200 shadow-sm">
              <CardContent className="p-0">
                <div className="grid gap-0 lg:grid-cols-[1.15fr_0.85fr]">
                  <div className="p-5 md:p-6">
                    <div className="mb-3 flex flex-wrap items-center gap-2">
                      <Badge className={cn("border text-xs", style.className)}>{template.family}</Badge>
                      <Badge variant="outline" className="text-xs">
                        <Download className="mr-1 h-3 w-3" />
                        Export ready
                      </Badge>
                    </div>
                    <h2 className="font-display text-xl font-bold">{template.name}</h2>
                    <p className="mt-2 text-sm text-muted-foreground">{template.description}</p>

                    <div className="mt-5 grid gap-4 md:grid-cols-2">
                      <TemplateBlock icon={ListChecks} title="Sections Included" items={template.sections} />
                      <TemplateBlock icon={ShieldCheck} title="Compliance Focus" items={template.complianceFocus} />
                      <TemplateBlock icon={Tags} title="TBE Tags Preview" items={template.tbeTags} compact />
                      <TemplateBlock icon={PencilRuler} title="Recommended Visuals" items={template.recommendedVisuals} compact />
                    </div>
                  </div>

                  <div className="border-t bg-slate-50/70 p-5 md:p-6 lg:border-l lg:border-t-0">
                    <div className="space-y-5">
                      <div>
                        <h3 className="flex items-center gap-2 text-sm font-semibold">
                          <FileCheck2 className="h-4 w-4 text-primary" />
                          Export Readiness
                        </h3>
                        <p className="mt-2 text-sm text-muted-foreground">{template.exportReadiness}</p>
                      </div>
                      <div>
                        <h3 className="flex items-center gap-2 text-sm font-semibold">
                          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                          Best-Fit Industries / Applications
                        </h3>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {template.bestFit.map((item) => (
                            <Badge key={item} variant="secondary" className="text-xs">
                              {item}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div className="flex flex-col gap-2 sm:flex-row lg:flex-col xl:flex-row">
                        <Button asChild className="w-full">
                          <Link href={useHref}>
                            Use Template
                            <ArrowUpRight className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button asChild variant="outline" className="w-full">
                          <Link href={`/templates?preview=${encodeURIComponent(template.name)}`}>
                            <Eye className="h-4 w-4" />
                            Preview Template
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function TemplateBlock({
  icon: Icon,
  title,
  items,
  compact = false,
}: {
  icon: any;
  title: string;
  items: string[];
  compact?: boolean;
}) {
  return (
    <div>
      <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold">
        <Icon className="h-4 w-4 text-primary" />
        {title}
      </h3>
      <div className={compact ? "flex flex-wrap gap-1.5" : "grid gap-1.5"}>
        {items.map((item) =>
          compact ? (
            <Badge key={item} variant="outline" className="text-[11px]">
              {item}
            </Badge>
          ) : (
            <div key={item} className="flex items-start gap-2 text-sm text-muted-foreground">
              <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" />
              <span>{item}</span>
            </div>
          )
        )}
      </div>
    </div>
  );
}
