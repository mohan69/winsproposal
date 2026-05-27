"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, AlertCircle, Maximize2, Minimize2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MermaidDiagramProps {
  chart: string;
  title?: string;
}

export function MermaidDiagram({ chart, title }: MermaidDiagramProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);
  const idRef = useRef(`mermaid-${Math.random().toString(36).substring(2, 10)}`);

  useEffect(() => {
    let cancelled = false;
    async function renderDiagram() {
      setLoading(true);
      setError(null);
      try {
        const mermaid = (await import("mermaid")).default;
        mermaid.initialize({
          startOnLoad: false,
          theme: "base",
          themeVariables: {
            primaryColor: "#e0f2fe",
            primaryTextColor: "#1a365d",
            primaryBorderColor: "#3b82f6",
            lineColor: "#64748b",
            secondaryColor: "#f0fdf4",
            tertiaryColor: "#fef3c7",
            fontFamily: "system-ui, -apple-system, sans-serif",
            fontSize: "14px",
          },
          flowchart: { curve: "basis", padding: 15 },
          securityLevel: "loose",
        });

        const { svg } = await mermaid.render(idRef.current, chart);
        if (!cancelled && containerRef.current) {
          containerRef.current.innerHTML = svg;
        }
      } catch (err: any) {
        if (!cancelled) setError(err?.message ?? "Failed to render diagram");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    if (chart?.trim()) renderDiagram();
    else { setLoading(false); setError("No diagram code provided"); }
    return () => { cancelled = true; };
  }, [chart]);

  return (
    <div className={`border rounded-lg bg-white overflow-hidden transition-all ${
      expanded ? "fixed inset-4 z-50 shadow-2xl" : ""
    }`}>
      {expanded && (
        <div className="fixed inset-0 bg-black/30 z-40" onClick={() => setExpanded(false)} />
      )}
      <div className={`relative ${expanded ? "z-50 h-full flex flex-col" : ""}`}>
        <div className="flex items-center justify-between px-4 py-2 bg-slate-50 border-b">
          <span className="text-sm font-medium text-slate-700">
            {title ?? "Process Diagram"}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setExpanded(!expanded)}
            className="h-7 w-7 p-0"
          >
            {expanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </Button>
        </div>
        <div className={`p-4 overflow-auto ${expanded ? "flex-1" : "max-h-[400px]"}`}>
          {loading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
              <span className="ml-2 text-sm text-muted-foreground">Rendering diagram...</span>
            </div>
          )}
          {error && (
            <div className="flex items-center gap-2 text-sm text-red-600 py-4">
              <AlertCircle className="w-4 h-4" />
              <span>Diagram error: {error}</span>
            </div>
          )}
          <div
            ref={containerRef}
            className="flex justify-center [&_svg]:max-w-full"
            style={{ display: loading || error ? "none" : "flex" }}
          />
        </div>
      </div>
    </div>
  );
}
