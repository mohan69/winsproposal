import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Database } from "lucide-react";
import { DEMO_KNOWLEDGE_ASSETS } from "@/lib/demo-knowledge";

export function DemoKnowledgeAssets() {
  const sampleGroups = [
    "Severe-service valve narratives",
    "Compressor recycle response",
    "Hydrogen compatibility response",
    "Inspection/testing clauses",
    "TBE sample responses",
    "Deviation examples",
    "QA/QC documentation examples",
  ];

  return (
    <Card className="shadow-md border-slate-200">
      <CardContent className="p-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-5">
          <div>
            <h2 className="font-display text-xl font-bold flex items-center gap-2">
              <Database className="w-5 h-5 text-primary" />
              Sample Knowledge Vault Assets
            </h2>
            <p className="text-sm text-muted-foreground">
              Reusable example responses and clause libraries for engineering, compliance, technical bid evaluation, and proposal documentation.
            </p>
          </div>
          <Badge variant="outline" className="w-fit">{DEMO_KNOWLEDGE_ASSETS.length} assets</Badge>
        </div>
        <div className="mb-4 flex flex-wrap gap-2">
          {sampleGroups.map((group) => (
            <Badge key={group} variant="secondary" className="text-xs">
              {group}
            </Badge>
          ))}
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          {DEMO_KNOWLEDGE_ASSETS.map((asset) => (
            <div key={asset.title} className="rounded-lg border bg-white p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-semibold text-sm">{asset.title}</h3>
                  <p className="text-xs text-muted-foreground mt-1">{asset.category}</p>
                </div>
                <Badge variant="secondary" className="text-[10px]">{asset.industry}</Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-3 line-clamp-3">{asset.content}</p>
              <div className="flex flex-wrap gap-1.5 mt-3">
                {asset.tags.slice(0, 4).map((tag) => (
                  <Badge key={tag} variant="outline" className="text-[10px]">{tag}</Badge>
                ))}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
