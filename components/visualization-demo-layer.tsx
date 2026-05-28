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
              Visualization Engine Demo
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Mermaid-backed previews for EPC, valves, pumps, compliance, proposal lifecycle, and engineering dependencies.
            </p>
          </div>
          <Badge variant="outline" className="w-fit">Export Safe</Badge>
        </div>
        <div className="flex flex-wrap gap-2 mb-4">
          {VISUALIZATION_TYPES.map((type) => (
            <Button
              key={type.id}
              variant={activeType === type.id ? "default" : "outline"}
              size="sm"
              className="h-8 text-xs"
              title={type.description}
              onClick={() => setActiveType(type.id)}
            >
              {type.label}
            </Button>
          ))}
        </div>
        <MermaidDiagram chart={visualization.mermaidCode} title={visualization.title} />
      </CardContent>
    </Card>
  );
}
