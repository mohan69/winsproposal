"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Table, Loader2, Zap, Check, X, Edit2, AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { getTbeTagsForTemplate } from "@/lib/templates";

interface TbeResponse {
  id: string;
  rfpId: string;
  lineItemIndex: number;
  tag: string;
  responseText: string;
}

interface LineItem {
  item?: string;
  description?: string;
  quantity?: string;
  specifications?: string;
}

export function TbePanel({ rfpId, lineItems, templateType }: { rfpId: string; lineItems: LineItem[]; templateType?: string }) {
  const [responses, setResponses] = useState<TbeResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState({ batch: 0, total: 0, message: "" });
  const [editingCell, setEditingCell] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [saving, setSaving] = useState(false);
  const generatedTags = Array.from(new Set(responses.map((r) => r.tag)));
  const tbeTags = generatedTags.length > 0 ? generatedTags : getTbeTagsForTemplate(templateType ?? "");

  const fetchResponses = useCallback(async () => {
    try {
      const res = await fetch(`/api/tbe/${rfpId}`);
      const data = await res.json().catch(() => ({}));
      if (Array.isArray(data?.responses)) {
        setResponses(data.responses);
      }
    } catch {
      // silent - no responses yet is expected
    } finally {
      setLoading(false);
    }
  }, [rfpId]);

  useEffect(() => { fetchResponses(); }, [fetchResponses]);

  async function handleGenerate() {
    setGenerating(true);
    setProgress({ batch: 0, total: 0, message: "Starting TBE generation..." });
    try {
      const query = templateType ? `?templateType=${encodeURIComponent(templateType)}` : "";
      const response = await fetch(`/api/tbe/${rfpId}/generate${query}`, { method: "POST" });
      if (!response?.ok) {
        const err = await response?.json().catch(() => ({}));
        throw new Error(err?.error ?? "Generation failed");
      }

      const reader = response?.body?.getReader();
      if (!reader) throw new Error("No stream");
      const decoder = new TextDecoder();
      let partialRead = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        partialRead += decoder.decode(value, { stream: true });
        const lines = partialRead.split("\n");
        partialRead = lines.pop() ?? "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const parsed = JSON.parse(line.slice(6));
              if (parsed.status === "processing") {
                setProgress({ batch: parsed.batch ?? 0, total: parsed.totalBatches ?? 0, message: parsed.message ?? "" });
              } else if (parsed.status === "completed") {
                setResponses(Array.isArray(parsed.responses) ? parsed.responses : []);
                toast.success("TBE responses generated successfully!");
              } else if (parsed.status === "error") {
                throw new Error(parsed.message ?? "Generation failed");
              }
            } catch (parseErr: any) {
              if (parseErr?.message?.includes("failed") || parseErr?.message?.includes("Failed")) throw parseErr;
            }
          }
        }
      }
    } catch (err: any) {
      toast.error(err?.message ?? "TBE generation failed");
    } finally {
      setGenerating(false);
    }
  }

  async function handleSaveCell(id: string) {
    setSaving(true);
    try {
      const res = await fetch(`/api/tbe/${rfpId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, responseText: editText }),
      });
      if (!res?.ok) throw new Error();
      setResponses((prev) => prev.map((r) => r.id === id ? { ...r, responseText: editText } : r));
      toast.success("Saved");
      setEditingCell(null);
    } catch {
      toast.error("Failed to save");
    } finally {
      setSaving(false);
    }
  }

  function getResponse(lineItemIndex: number, tag: string): TbeResponse | undefined {
    return responses.find((r) => r.lineItemIndex === lineItemIndex && r.tag === tag);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-display font-semibold text-lg flex items-center gap-2">
            <Table className="w-5 h-5 text-primary" />
            Technical Bid Evaluation (TBE)
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            {lineItems.length} line items × {tbeTags.length} evaluation tags = {lineItems.length * tbeTags.length} cells
          </p>
        </div>
        <Button
          onClick={handleGenerate}
          disabled={generating}
          className="bg-primary"
        >
          {generating ? (
            <><Loader2 className="w-4 h-4 animate-spin mr-2" />Generating...</>
          ) : responses.length > 0 ? (
            <><Zap className="w-4 h-4 mr-2" />Regenerate TBE</>
          ) : (
            <><Zap className="w-4 h-4 mr-2" />Generate TBE Response</>
          )}
        </Button>
      </div>

      {/* Progress indicator */}
      {generating && (
        <Card className="mb-4 border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3 mb-2">
              <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
              <span className="text-sm font-medium text-blue-800">{progress.message}</span>
            </div>
            {progress.total > 0 && (
              <div className="w-full bg-blue-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${Math.round((progress.batch / progress.total) * 100)}%` }}
                />
              </div>
            )}
            <p className="text-xs text-blue-600 mt-1">
              Batch {progress.batch} of {progress.total} — This may take a few minutes for large MRs
            </p>
          </CardContent>
        </Card>
      )}

      {/* Warning for large MRs */}
      {lineItems.length > 10 && responses.length === 0 && !generating && (
        <Card className="mb-4 border-amber-200 bg-amber-50">
          <CardContent className="p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-800">Large MR Detected</p>
              <p className="text-xs text-amber-700 mt-0.5">
                This MR has {lineItems.length} line items. TBE generation will process them in batches of 5
                and may consume significant AI tokens. Expect 2-5 minutes for completion.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* TBE Table */}
      {responses.length > 0 ? (
        <div className="overflow-x-auto border rounded-lg">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/50">
                <th className="sticky left-0 bg-muted/80 text-left p-3 font-semibold border-b border-r min-w-[180px] z-10">Line Item</th>
                {tbeTags.map((tag) => (
                  <th key={tag} className="text-left p-3 font-semibold border-b min-w-[200px]">
                    <Badge variant="outline" className="text-xs">{tag}</Badge>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {lineItems.map((item, idx) => (
                <tr key={idx} className="border-b last:border-0 hover:bg-muted/20">
                  <td className="sticky left-0 bg-card p-3 border-r font-medium z-10">
                    <div className="text-xs text-muted-foreground">Item {idx + 1}</div>
                    <div className="truncate max-w-[160px]" title={item?.item ?? item?.description ?? ""}>
                      {item?.item ?? item?.description ?? `Item ${idx + 1}`}
                    </div>
                    {item?.quantity && <div className="text-xs text-muted-foreground">Qty: {item.quantity}</div>}
                  </td>
                  {tbeTags.map((tag) => {
                    const resp = getResponse(idx, tag);
                    const cellKey = `${idx}-${tag}`;
                    const isEditing = editingCell === cellKey;

                    return (
                      <td key={tag} className="p-2 border-r last:border-r-0 align-top">
                        {resp ? (
                          isEditing ? (
                            <div className="space-y-1">
                              <Textarea
                                value={editText}
                                onChange={(e: any) => setEditText(e?.target?.value ?? "")}
                                rows={4}
                                className="text-xs min-w-[180px]"
                              />
                              <div className="flex gap-1">
                                <Button size="sm" className="h-6 text-xs px-2" onClick={() => handleSaveCell(resp.id)} disabled={saving}>
                                  {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                                </Button>
                                <Button size="sm" variant="ghost" className="h-6 text-xs px-2" onClick={() => setEditingCell(null)}>
                                  <X className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div className="group relative">
                              <p className="text-xs text-muted-foreground whitespace-pre-wrap line-clamp-4">{resp.responseText}</p>
                              <button
                                className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded bg-white shadow-sm border"
                                onClick={() => { setEditingCell(cellKey); setEditText(resp.responseText); }}
                              >
                                <Edit2 className="w-3 h-3 text-muted-foreground" />
                              </button>
                            </div>
                          )
                        ) : (
                          <span className="text-xs text-muted-foreground/40 italic">Not generated</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : !generating ? (
        <Card className="border-0 shadow-md">
          <CardContent className="p-8 text-center">
            <Table className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
            <h4 className="font-display font-semibold mb-1">No TBE Responses Yet</h4>
            <p className="text-sm text-muted-foreground mb-4">
              Click "Generate TBE Response" to create detailed technical compliance responses for each line item.
            </p>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
