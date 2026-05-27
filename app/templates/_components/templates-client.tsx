"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  LayoutTemplate, ChevronDown, ChevronUp, CheckCircle, Shield,
  Factory, Droplets, HardHat, ListChecks, GitBranch, Target, Layers, AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  TEMPLATES, VALVE_SUBTYPES, PUMP_SUBTYPES,
  GO_NO_GO_QUESTIONS, GO_NO_GO_OPTIONS,
  type ProposalTemplate,
} from "@/lib/templates";

const industryIcons: Record<string, any> = {
  Valves: Factory,
  Pumps: Droplets,
  EPC: HardHat,
};

const industryColors: Record<string, string> = {
  Valves: "bg-blue-50 text-blue-700 border-blue-200",
  Pumps: "bg-teal-50 text-teal-700 border-teal-200",
  EPC: "bg-amber-50 text-amber-700 border-amber-200",
};

const subtypeMap: Record<string, any[]> = {
  Valves: VALVE_SUBTYPES || [],
  Pumps: PUMP_SUBTYPES || [],
};

export function TemplatesClient() {
  const [expandedTemplate, setExpandedTemplate] = useState<string | null>(null);
  const [expandedSubType, setExpandedSubType] = useState<string | null>(null);
  const [showGoNoGo, setShowGoNoGo] = useState(false);

  return (
    <div className="p-4 md:p-8 max-w-[1200px] mx-auto">
      <div className="mb-8">
        <h1 className="font-display text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-2">
          <LayoutTemplate className="w-7 h-7 text-primary" />
          Industry Templates & Sub-Types
        </h1>
        <p className="text-muted-foreground mt-1">
          Pre-built proposal templates with sub-type specific sections, compliance checklists, and TBE tags. Each sub-type loads unique technical depth that generic templates can&apos;t match.
        </p>
      </div>

      {/* Go/No-Go Section */}
      <Card className="shadow-md mb-8 border-rose-200 bg-rose-50/30">
        <CardContent className="p-0">
          <div className="p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-rose-100 flex items-center justify-center shrink-0">
                  <Target className="w-6 h-6 text-rose-600" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="font-display text-xl font-bold">Go/No-Go Decision Matrix</h2>
                    <Badge className="text-xs bg-rose-100 text-rose-700 border-rose-200">Bid Intelligence</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">Score every RFP before investing time. 8 universal + 2 industry-specific questions produce a Bid / No-Bid / Conditional recommendation.</p>
                  <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <ListChecks className="w-4 h-4" />
                      {GO_NO_GO_QUESTIONS?.length || 10} questions
                    </span>
                    <span className="flex items-center gap-1">
                      <AlertTriangle className="w-4 h-4" />
                      Risk flag detection
                    </span>
                    <span className="flex items-center gap-1">
                      <Target className="w-4 h-4" />
                      Weighted scoring
                    </span>
                  </div>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="shrink-0"
                onClick={() => setShowGoNoGo(!showGoNoGo)}
              >
                {showGoNoGo ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
              </Button>
            </div>
          </div>

          {showGoNoGo && (
            <div className="border-t border-rose-200 p-6">
              <h3 className="font-display font-semibold text-base mb-4 flex items-center gap-2">
                <ListChecks className="w-4 h-4 text-rose-600" />
                Assessment Questions
              </h3>
              <div className="grid gap-3">
                {(GO_NO_GO_QUESTIONS || []).map((q: any, idx: number) => (
                  <div key={idx} className="flex items-start gap-3 p-3 rounded-lg bg-white/80 border border-rose-100">
                    <span className="text-xs font-mono text-muted-foreground mt-0.5 w-6">{String(idx + 1).padStart(2, "0")}</span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm">{q.question || q.label || String(q)}</p>
                        {q.industry && (
                          <Badge variant="outline" className="text-[10px]">{q.industry}</Badge>
                        )}
                      </div>
                      {q.weight && (
                        <p className="text-xs text-muted-foreground mt-0.5">Weight: {q.weight}x</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              {(GO_NO_GO_OPTIONS || []).length > 0 && (
                <div className="mt-4">
                  <h4 className="text-sm font-medium mb-2">Scoring Options</h4>
                  <div className="flex flex-wrap gap-2">
                    {(GO_NO_GO_OPTIONS || []).map((opt: any, i: number) => (
                      <Badge key={i} variant="secondary" className="text-xs">
                        {opt.label || opt.value || String(opt)} {opt.score !== undefined && `(${opt.score} pts)`}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Base Templates */}
      <div className="space-y-6">
        {TEMPLATES.map((template: ProposalTemplate) => {
          const Icon = industryIcons[template.industry] ?? Factory;
          const colorClass = industryColors[template.industry] ?? "bg-gray-50 text-gray-700 border-gray-200";
          const isExpanded = expandedTemplate === template.id;
          const subTypes = subtypeMap[template.industry] || [];

          return (
            <Card key={template.id} className="shadow-md hover:shadow-lg transition-shadow overflow-hidden">
              <CardContent className="p-0">
                {/* Template Header */}
                <div className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center shrink-0", colorClass.split(" ")[0])}>
                        <Icon className={cn("w-6 h-6", colorClass.split(" ")[1])} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h2 className="font-display text-xl font-bold">{template.name}</h2>
                          <Badge className={cn("text-xs", colorClass)}>{template.badge}</Badge>
                          {subTypes.length > 0 && (
                            <Badge variant="outline" className="text-xs">
                              <GitBranch className="w-3 h-3 mr-1" />
                              {subTypes.length} sub-types
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{template.description}</p>
                        <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <ListChecks className="w-4 h-4" />
                            {template.sections.length} sections
                          </span>
                          <span className="flex items-center gap-1">
                            <Shield className="w-4 h-4" />
                            {template.complianceItems.length} compliance items
                          </span>
                          {subTypes.length > 0 && (
                            <span className="flex items-center gap-1">
                              <Layers className="w-4 h-4" />
                              12-15 TBE tags per sub-type
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="shrink-0"
                      onClick={() => setExpandedTemplate(isExpanded ? null : template.id)}
                    >
                      {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </Button>
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="border-t border-border">
                    {/* Sub-Types */}
                    {subTypes.length > 0 && (
                      <div className="p-6 border-b border-border bg-muted/20">
                        <h3 className="font-display font-semibold text-base mb-4 flex items-center gap-2">
                          <GitBranch className="w-4 h-4 text-primary" />
                          Product Sub-Types
                        </h3>
                        <div className="grid gap-3">
                          {subTypes.map((st: any) => {
                            const stKey = `${template.id}-${st.id || st.name}`;
                            const isSTExpanded = expandedSubType === stKey;
                            return (
                              <div key={stKey} className="border rounded-lg overflow-hidden bg-white">
                                <button
                                  onClick={() => setExpandedSubType(isSTExpanded ? null : stKey)}
                                  className="w-full flex items-center justify-between p-3 hover:bg-muted/50 transition-colors"
                                >
                                  <div className="flex items-center gap-2">
                                    <GitBranch className="w-4 h-4 text-primary" />
                                    <span className="font-medium text-sm">{st.name || st.label}</span>
                                    {st.additionalSections && (
                                      <Badge variant="secondary" className="text-[10px]">
                                        +{st.additionalSections.length} unique sections
                                      </Badge>
                                    )}
                                    {st.tbeTags && (
                                      <Badge className="text-[10px] bg-emerald-100 text-emerald-700">
                                        {st.tbeTags.length} TBE tags
                                      </Badge>
                                    )}
                                    {st.complianceItems && (
                                      <Badge variant="outline" className="text-[10px]">
                                        +{st.complianceItems.length} compliance
                                      </Badge>
                                    )}
                                  </div>
                                  {isSTExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                </button>
                                {isSTExpanded && (
                                  <div className="px-4 pb-4 border-t bg-muted/10 space-y-3">
                                    {st.additionalSections && st.additionalSections.length > 0 && (
                                      <div className="pt-3">
                                        <p className="text-xs font-medium text-muted-foreground mb-2">Additional Sections:</p>
                                        <div className="grid gap-1.5">
                                          {st.additionalSections.map((sec: any, si: number) => (
                                            <div key={si} className="flex items-start gap-2 text-sm">
                                              <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                                              <span>{sec.title || sec}</span>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                    {st.tbeTags && st.tbeTags.length > 0 && (
                                      <div>
                                        <p className="text-xs font-medium text-muted-foreground mb-2">TBE Evaluation Tags:</p>
                                        <div className="flex flex-wrap gap-1.5">
                                          {st.tbeTags.map((tag: any, ti: number) => (
                                            <Badge key={ti} variant="secondary" className="text-[10px]">
                                              {tag.label || tag.name || tag}
                                            </Badge>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                    {st.complianceItems && st.complianceItems.length > 0 && (
                                      <div>
                                        <p className="text-xs font-medium text-muted-foreground mb-2">Additional Compliance:</p>
                                        <div className="grid gap-1.5 sm:grid-cols-2">
                                          {st.complianceItems.map((ci: any, cii: number) => (
                                            <div key={cii} className="flex items-start gap-2 text-sm">
                                              <Shield className="w-3.5 h-3.5 text-blue-500 shrink-0 mt-0.5" />
                                              <span className="text-xs">{ci.label || ci.standard || ci}</span>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Sections */}
                    <div className="p-6">
                      <h3 className="font-display font-semibold text-base mb-4 flex items-center gap-2">
                        <ListChecks className="w-4 h-4 text-primary" />
                        Base Proposal Sections
                      </h3>
                      <div className="grid gap-3">
                        {template.sections.map((section, idx) => (
                          <div key={idx} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                            <span className="text-xs font-mono text-muted-foreground mt-0.5 w-6">{String(idx + 1).padStart(2, "0")}</span>
                            <div>
                              <p className="font-medium text-sm">{section.title}</p>
                              <p className="text-xs text-muted-foreground mt-0.5">{section.description}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Compliance Checklist */}
                    <div className="border-t border-border p-6">
                      <h3 className="font-display font-semibold text-base mb-4 flex items-center gap-2">
                        <Shield className="w-4 h-4 text-primary" />
                        Base Compliance Checklist
                      </h3>
                      <div className="grid gap-2 sm:grid-cols-2">
                        {template.complianceItems.map((item) => (
                          <div key={item.id} className="flex items-start gap-2 p-3 rounded-lg bg-muted/50">
                            <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                            <div>
                              <p className="font-medium text-sm">{item.label}</p>
                              <p className="text-xs text-muted-foreground">{item.standard}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
