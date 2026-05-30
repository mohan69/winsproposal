"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MermaidDiagram } from "@/components/mermaid-diagram";
import { VISUALIZATION_TYPES, getFallbackVisualization, type VisualizationType } from "@/lib/visualization-service";
import { Network } from "lucide-react";

const DEMO_CONTEXT = {
  title: "Refinery Utilities EPC Proposal",
  industry: "EPC",
  templateType: "Refinery Systems",
  sectionTitle: "Engineering and Compliance Workflow",
  content: "RFP intake, engineering basis, P&ID review, API 600 valve datasheets, API 610 pump duty points, QA/QC inspection, deviation approval, and final proposal submission.",
};

const CUSTOMER_VISUALIZATION_LABELS: Partial<Record<VisualizationType, string>> = {
  process_flow: "PFD-style drawing",
  workflow: "P&ID-lite control loop",
  architecture: "Valve package schematic",
  compliance_flow: "Compliance matrix",
  tbe_matrix: "TBE matrix",
  kpi_dashboard: "KPI dashboard",
  gantt: "Delivery schedule",
  risk_tree: "Risk/deviation tree",
};

const CUSTOMER_VISUALIZATION_TYPES = VISUALIZATION_TYPES.filter((type) =>
  Object.keys(CUSTOMER_VISUALIZATION_LABELS).includes(type.id)
);

export function VisualizationDemoLayer() {
  const [activeType, setActiveType] = useState<VisualizationType>("process_flow");
  const visualization = getFallbackVisualization(DEMO_CONTEXT, activeType);

  return (
    <Card className="shadow-md border-slate-200">
      <CardContent className="p-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between mb-5">
          <div>
            <h2 className="font-display text-xl font-bold flex items-center gap-2">
              <Network className="w-5 h-5 text-primary" />
              Drawing & Visualization Intelligence Demo
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Proposal-ready technical visuals for drawings, matrices, schedules, and executive review artifacts.
            </p>
          </div>
          <Badge variant="outline" className="w-fit">Export Safe</Badge>
        </div>
        <div className="flex flex-wrap gap-2 mb-4">
          {CUSTOMER_VISUALIZATION_TYPES.map((type) => (
            <Button
              key={type.id}
              variant={activeType === type.id ? "default" : "outline"}
              size="sm"
              className="h-8 text-xs"
              title={type.description}
              onClick={() => setActiveType(type.id)}
            >
              {CUSTOMER_VISUALIZATION_LABELS[type.id]}
            </Button>
          ))}
        </div>
        <MermaidDiagram chart={visualization.mermaidCode} title={visualization.title} />
      </CardContent>
    </Card>
  );
}
