"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  ShieldCheck, ShieldAlert, ShieldX, ChevronDown, ChevronUp,
  Loader2, Save, RotateCcw,
} from "lucide-react";
import { toast } from "sonner";
import {
  getGoNoGoQuestionsForIndustry,
  GO_NO_GO_OPTIONS,
  type GoNoGoQuestion,
} from "@/lib/templates";

interface GoNoGoPanelProps {
  rfpId: string;
  industry: string;
}

interface ResponseItem {
  questionId: string;
  score: number;
  label: string;
}

export function GoNoGoPanel({ rfpId, industry }: GoNoGoPanelProps) {
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [questions, setQuestions] = useState<GoNoGoQuestion[]>([]);
  const [responses, setResponses] = useState<ResponseItem[]>([]);
  const [notes, setNotes] = useState("");
  const [savedResult, setSavedResult] = useState<any>(null);

  useEffect(() => {
    const qs = getGoNoGoQuestionsForIndustry(industry || "General");
    setQuestions(qs);
  }, [industry]);

  // Load existing assessment
  useEffect(() => {
    if (!rfpId) return;
    setLoading(true);
    fetch(`/api/go-no-go/${rfpId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data && data.id) {
          setSavedResult(data);
          const savedResponses = Array.isArray(data.responses) ? data.responses : [];
          setResponses(savedResponses);
          setNotes(data.notes || "");
          setExpanded(false);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [rfpId]);

  function handleAnswer(questionId: string, score: number, label: string) {
    setResponses((prev) => {
      const filtered = prev.filter((r) => r.questionId !== questionId);
      return [...filtered, { questionId, score, label }];
    });
    setSavedResult(null); // Mark as unsaved
  }

  async function handleSave() {
    if (responses.length === 0) {
      toast.error("Please answer at least one question");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/go-no-go/${rfpId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ responses, notes, industry }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to save");
      setSavedResult(data);
      toast.success("Go/No-Go assessment saved!");
    } catch (err: any) {
      toast.error(err?.message || "Failed to save assessment");
    } finally {
      setSaving(false);
    }
  }

  function handleReset() {
    setResponses([]);
    setNotes("");
    setSavedResult(null);
  }

  const answeredCount = responses.length;
  const totalQuestions = questions.length;

  const recommendation = savedResult?.recommendation;
  const percentage = savedResult
    ? Math.round((savedResult.totalScore / savedResult.maxScore) * 100)
    : null;

  const recConfig: Record<string, { icon: any; color: string; bg: string; label: string }> = {
    strong_bid: { icon: ShieldCheck, color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200", label: "Strong Bid — Proceed with confidence" },
    cautious_bid: { icon: ShieldAlert, color: "text-amber-700", bg: "bg-amber-50 border-amber-200", label: "Cautious Bid — Proceed with mitigation plan" },
    no_bid: { icon: ShieldX, color: "text-red-700", bg: "bg-red-50 border-red-200", label: "No-Bid — Consider declining this RFP" },
  };

  const rec = recommendation ? recConfig[recommendation] : null;

  return (
    <Card className="shadow-sm border overflow-hidden">
      <div
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/30 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <ShieldCheck className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h3 className="font-display font-semibold text-sm">Bid / No-Bid Assessment</h3>
            <p className="text-xs text-muted-foreground">Should you bid on this RFP? Score your readiness.</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {rec && (
            <Badge variant="outline" className={`${rec.bg} ${rec.color} text-xs`}>
              {recommendation === "strong_bid" ? "Strong Bid" : recommendation === "cautious_bid" ? "Cautious" : "No-Bid"}
              {percentage !== null ? ` (${percentage}%)` : ""}
            </Badge>
          )}
          {!savedResult && answeredCount > 0 && (
            <Badge variant="outline" className="text-xs">{answeredCount}/{totalQuestions}</Badge>
          )}
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </div>

      {expanded && (
        <CardContent className="px-4 pb-4 pt-0 border-t">
          {loading ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="space-y-4 mt-4">
              {/* Recommendation banner */}
              {rec && savedResult && (
                <div className={`flex items-center gap-3 p-3 rounded-lg border ${rec.bg}`}>
                  <rec.icon className={`w-5 h-5 ${rec.color} shrink-0`} />
                  <div>
                    <p className={`font-semibold text-sm ${rec.color}`}>{rec.label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Score: {savedResult.totalScore}/{savedResult.maxScore} ({percentage}%)
                    </p>
                  </div>
                </div>
              )}

              {/* Questions */}
              <div className="space-y-3">
                {questions.map((q, idx) => {
                  const currentAnswer = responses.find((r) => r.questionId === q.id);
                  return (
                    <div key={q.id} className="border rounded-lg p-3">
                      <div className="flex items-start gap-2 mb-2">
                        <span className="text-xs font-mono text-muted-foreground mt-0.5 shrink-0">{idx + 1}.</span>
                        <div className="flex-1">
                          <p className="text-sm font-medium leading-tight">{q.question}</p>
                          <div className="flex items-center gap-1 mt-0.5">
                            <span className="text-xs text-muted-foreground">Weight: </span>
                            {Array.from({ length: q.weight }).map((_, i) => (
                              <span key={i} className="w-1.5 h-1.5 rounded-full bg-primary inline-block" />
                            ))}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2 ml-5">
                        {GO_NO_GO_OPTIONS.map((opt) => (
                          <button
                            key={opt.label}
                            onClick={(e) => { e.stopPropagation(); handleAnswer(q.id, opt.score, opt.label); }}
                            className={`px-3 py-1 text-xs rounded-md border transition-all ${
                              currentAnswer?.label === opt.label
                                ? opt.score >= 4
                                  ? "bg-emerald-100 border-emerald-400 text-emerald-800 font-medium"
                                  : opt.score >= 2
                                  ? "bg-amber-100 border-amber-400 text-amber-800 font-medium"
                                  : opt.score >= 1
                                  ? "bg-orange-100 border-orange-400 text-orange-800 font-medium"
                                  : "bg-red-100 border-red-400 text-red-800 font-medium"
                                : "bg-background hover:bg-muted/50"
                            }`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Notes */}
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Notes (optional)</label>
                <Textarea
                  value={notes}
                  onChange={(e) => { setNotes(e.target.value); setSavedResult(null); }}
                  placeholder="Any additional context for this bid decision..."
                  rows={2}
                  className="text-sm"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                <Button size="sm" onClick={handleSave} disabled={saving || answeredCount === 0}>
                  {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : <Save className="w-3.5 h-3.5 mr-1.5" />}
                  {savedResult ? "Update Assessment" : "Save Assessment"}
                </Button>
                <Button size="sm" variant="outline" onClick={handleReset} disabled={saving}>
                  <RotateCcw className="w-3.5 h-3.5 mr-1.5" /> Reset
                </Button>
                <span className="text-xs text-muted-foreground ml-auto">
                  {answeredCount}/{totalQuestions} answered
                </span>
              </div>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}
