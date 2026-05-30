"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { drawingTypeLabel, type DrawingConnector, type DrawingPackage } from "@/lib/drawing-intelligence";
import { getDrawingSymbolDefinition, type DrawingSymbolInstance } from "@/lib/drawing-symbols";
import { cn } from "@/lib/utils";
import { CheckSquare, FileCheck2, RefreshCw } from "lucide-react";

function center(symbol: DrawingSymbolInstance) {
  return {
    x: symbol.x + (symbol.width ?? 112) / 2,
    y: symbol.y + (symbol.height ?? 54) / 2,
  };
}

function DrawingConnectorLine({
  connector,
  symbols,
  brandColor,
  markerId,
}: {
  connector: DrawingConnector;
  symbols: Map<string, DrawingSymbolInstance>;
  brandColor: string;
  markerId: string;
}) {
  const from = symbols.get(connector.from);
  const to = symbols.get(connector.to);
  if (!from || !to) return null;
  const start = center(from);
  const end = center(to);
  const isDashed = connector.lineType === "instrument" || connector.lineType === "pneumatic";
  const color = connector.lineType === "process" ? "#111827" : brandColor;
  return (
    <g>
      <line
        x1={start.x}
        y1={start.y}
        x2={end.x}
        y2={end.y}
        stroke={color}
        strokeWidth={connector.lineType === "process" ? 2.4 : 1.8}
        strokeDasharray={isDashed ? "7 5" : undefined}
        markerEnd={`url(#${markerId})`}
      />
      {connector.label && (
        <text x={(start.x + end.x) / 2} y={(start.y + end.y) / 2 - 7} className="fill-slate-600 text-[10px] font-semibold">
          {connector.label}
        </text>
      )}
    </g>
  );
}

function DrawingSymbol({ symbol, brandColor }: { symbol: DrawingSymbolInstance; brandColor: string }) {
  const width = symbol.width ?? 112;
  const height = symbol.height ?? 54;
  const def = getDrawingSymbolDefinition(symbol.kind);
  const isValve = symbol.kind.includes("valve");
  const isController = symbol.kind === "controller";
  const isDocument = symbol.kind.includes("document") || symbol.kind.includes("certificate") || symbol.kind.includes("report");

  return (
    <g className="group">
      {isValve ? (
        <>
          <polygon
            points={`${symbol.x + 8},${symbol.y + height / 2} ${symbol.x + width / 2},${symbol.y + 9} ${symbol.x + width - 8},${symbol.y + height / 2} ${symbol.x + width / 2},${symbol.y + height - 9}`}
            fill="#fff"
            stroke={brandColor}
            strokeWidth="2"
          />
          <line x1={symbol.x + width / 2} y1={symbol.y + 9} x2={symbol.x + width / 2} y2={symbol.y + height - 9} stroke={brandColor} strokeWidth="1.5" />
        </>
      ) : isController ? (
        <circle cx={symbol.x + width / 2} cy={symbol.y + height / 2} r={Math.min(width, height) / 2 - 4} fill="#fff" stroke={brandColor} strokeWidth="2" />
      ) : isDocument ? (
        <>
          <path d={`M${symbol.x + 8} ${symbol.y + 4} H${symbol.x + width - 18} L${symbol.x + width - 6} ${symbol.y + 16} V${symbol.y + height - 5} H${symbol.x + 8} Z`} fill="#fff" stroke={brandColor} strokeWidth="1.8" />
          <path d={`M${symbol.x + width - 18} ${symbol.y + 4} V${symbol.y + 16} H${symbol.x + width - 6}`} fill="none" stroke={brandColor} strokeWidth="1.4" />
        </>
      ) : (
        <rect x={symbol.x} y={symbol.y} width={width} height={height} rx="4" fill="#fff" stroke={brandColor} strokeWidth="1.8" />
      )}
      <text x={symbol.x + width / 2} y={symbol.y + height / 2 + (isValve ? 4 : 2)} textAnchor="middle" className="fill-slate-900 text-[10px] font-bold">
        {symbol.label}
      </text>
      {symbol.tag && (
        <text x={symbol.x + width / 2} y={symbol.y + height + 15} textAnchor="middle" className="fill-blue-700 text-[10px] font-bold">
          {symbol.tag}
        </text>
      )}
      <title>{`${def.family}: ${def.description}`}</title>
    </g>
  );
}

export function EngineeringDrawing({
  drawing,
  brandColor = "#1a365d",
  showActions = true,
}: {
  drawing: DrawingPackage;
  brandColor?: string;
  showActions?: boolean;
}) {
  const symbols = new Map(drawing.symbols.map((symbol) => [symbol.id, symbol]));
  const markerId = `arrow-${drawing.titleBlock.drawingNo.replace(/[^a-zA-Z0-9]/g, "-")}`;

  return (
    <article className="rounded-lg border border-slate-300 bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-b border-slate-200 bg-slate-50 p-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="border-blue-200 bg-blue-50 text-blue-800">
              {drawingTypeLabel(drawing.drawingType)}
            </Badge>
            <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-800">
              {drawing.reviewStatus.join(" - ")}
            </Badge>
          </div>
          <h4 className="mt-2 text-sm font-bold text-slate-950">{drawing.title}</h4>
          <p className="mt-1 text-xs leading-relaxed text-slate-600">{drawing.subtitle}</p>
        </div>
        {showActions && (
          <div className="flex shrink-0 flex-wrap gap-2">
            <Button size="sm" variant="outline" className="h-8 gap-1 text-xs">
              <RefreshCw className="h-3.5 w-3.5" />
              Regenerate
            </Button>
            <Button size="sm" variant="outline" className="h-8 gap-1 text-xs">
              <CheckSquare className="h-3.5 w-3.5" />
              Mark for engineering review
            </Button>
            <Button size="sm" variant="outline" className="h-8 gap-1 text-xs">
              <FileCheck2 className="h-3.5 w-3.5" />
              Export included
            </Button>
          </div>
        )}
      </div>

      <div className="border-b border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-900">
        {drawing.disclaimer}
      </div>

      <div className="overflow-x-auto p-3">
        <svg viewBox="0 0 980 330" className="min-h-[300px] min-w-[840px] rounded border border-slate-300 bg-white" role="img" aria-label={drawing.title}>
          <defs>
            <marker id={markerId} markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto" markerUnits="strokeWidth">
              <path d="M0,0 L0,6 L9,3 z" fill={brandColor} />
            </marker>
          </defs>
          <rect x="12" y="14" width="956" height="240" fill="#fbfdff" stroke="#cbd5e1" strokeWidth="1" />
          {drawing.connectors.map((connector) => (
            <DrawingConnectorLine key={connector.id} connector={connector} symbols={symbols} brandColor={brandColor} markerId={markerId} />
          ))}
          {drawing.symbols.map((symbol) => (
            <DrawingSymbol key={symbol.id} symbol={symbol} brandColor={brandColor} />
          ))}
          {drawing.annotations.map((annotation) => (
            <g key={annotation.id}>
              <path d={`M${annotation.x - 10} ${annotation.y - 12} h220 v36 h-220 z`} fill="#fffbeb" stroke="#f59e0b" strokeWidth="1" />
              <text x={annotation.x} y={annotation.y + 3} className="fill-amber-950 text-[9px] font-semibold">
                {annotation.label}
              </text>
            </g>
          ))}
          <g>
            <rect x="24" y="262" width="360" height="52" fill="#fff" stroke="#94a3b8" />
            <text x="34" y="280" className="fill-slate-800 text-[10px] font-bold">
              LEGEND
            </text>
            <line x1="92" y1="276" x2="132" y2="276" stroke="#111827" strokeWidth="2.4" markerEnd={`url(#${markerId})`} />
            <text x="140" y="280" className="fill-slate-600 text-[9px] font-semibold">process line</text>
            <line x1="232" y1="276" x2="272" y2="276" stroke={brandColor} strokeWidth="1.8" strokeDasharray="7 5" markerEnd={`url(#${markerId})`} />
            <text x="280" y="280" className="fill-slate-600 text-[9px] font-semibold">signal line</text>
            <rect x="34" y="290" width="42" height="14" rx="2" fill="#fff" stroke={brandColor} strokeWidth="1.5" />
            <text x="84" y="301" className="fill-slate-600 text-[9px] font-semibold">proposal-grade symbol layout</text>
          </g>
          <g>
            <rect x="650" y="262" width="318" height="52" fill="#fff" stroke="#94a3b8" />
            <text x="660" y="280" className="fill-slate-800 text-[10px] font-bold">
              DWG: {drawing.titleBlock.drawingNo}
            </text>
            <text x="660" y="296" className="fill-slate-600 text-[9px] font-semibold">
              REV: {drawing.revisionBlock.revision} | {drawing.titleBlock.status}
            </text>
          </g>
        </svg>
      </div>

      <div className="grid gap-2 border-t border-slate-200 bg-slate-50 p-3 text-xs md:grid-cols-2">
        <Meta label="Tags used" value={drawing.tagsUsed.join(", ") || "TBD"} />
        <Meta label="Engineering review notes" value={drawing.engineeringReviewNotes.join(" ")} />
        <Meta label="Standards-awareness notes" value={drawing.standardsAwareness.map((item) => item.label).join(" | ")} />
        <Meta label="Revision block" value={`${drawing.revisionBlock.revision} - ${drawing.revisionBlock.description}`} />
      </div>

      <div className="flex flex-wrap gap-2 border-t border-slate-200 p-3">
        {drawing.symbols.slice(0, 8).map((symbol) => {
          const def = getDrawingSymbolDefinition(symbol.kind);
          return (
            <span key={`${drawing.title}-${symbol.id}`} className={cn("rounded border px-2 py-1 text-[10px] font-semibold", def.family === "P&ID-lite symbol" ? "border-blue-200 bg-blue-50 text-blue-800" : def.family === "PFD-style symbol" ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-slate-200 bg-slate-50 text-slate-700")}>
              {def.family}: {def.label}
            </span>
          );
        })}
      </div>
    </article>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded border border-slate-200 bg-white px-2.5 py-2">
      <div className="text-[10px] font-bold uppercase text-slate-500">{label}</div>
      <div className="mt-1 leading-relaxed text-slate-700">{value}</div>
    </div>
  );
}
