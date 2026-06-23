"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, Search, Trash2, Calendar, Loader2, ArrowRight, Trophy, Clock, ThumbsUp, ThumbsDown } from "lucide-react";
import { toast } from "sonner";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

interface ProposalItem {
  id: string;
  title: string;
  templateType: string;
  industry: string;
  status: string;
  vaultSectionsUsed: number;
  vaultDocumentsUsed: number;
  createdAt: string;
  sections: any[];
  winScore: number | null;
  approvalStatus: string;
}

export function ProposalsClient() {
  const [proposals, setProposals] = useState<ProposalItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const searchTimeout = useRef<any>(null);

  const fetchProposals = useCallback(async (q: string = "") => {
    try {
      const res = await fetch(`/api/proposals${q ? `?search=${encodeURIComponent(q)}` : ""}`);
      if (!res?.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(`GET /api/proposals returned ${res?.status}: ${errData?.error ?? "Unknown error"}`);
      }
      const data = await res.json().catch(() => []);
      setProposals(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error("Proposals fetch error:", err?.message);
      toast.error(err?.message ?? "Failed to load proposals", { duration: 8000 });
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchProposals(); }, [fetchProposals]);

  function handleSearchChange(val: string) {
    setSearch(val);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => fetchProposals(val), 400);
  }

  async function handleDelete(id: string) {
    try {
      const res = await fetch(`/api/proposals/${id}`, { method: "DELETE" });
      if (!res?.ok) throw new Error();
      toast.success("Proposal deleted");
      setProposals((prev: ProposalItem[]) => (prev ?? [])?.filter((p: ProposalItem) => p?.id !== id));
    } catch { toast.error("Failed to delete"); }
    setDeleteId(null);
  }

  return (
    <div className="p-4 md:p-8 max-w-[1200px] mx-auto">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-2">
            <FileText className="w-7 h-7 text-primary" /> My Proposals
          </h1>
          <p className="text-muted-foreground mt-1">View and manage all your generated proposals.</p>
        </div>
        <Link href="/upload-rfp">
          <Button>New Proposal <ArrowRight className="w-4 h-4 ml-2" /></Button>
        </Link>
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Search proposals..." value={search ?? ""} onChange={(e: any) => handleSearchChange(e?.target?.value ?? "")} className="pl-10" />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : (proposals?.length ?? 0) === 0 ? (
        <Card className="shadow-md border-0">
          <CardContent className="p-12 text-center">
            <FileText className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
            <h3 className="font-display text-lg font-semibold mb-2">No Proposals Yet</h3>
            <p className="text-muted-foreground mb-4">Upload an RFP to generate your first AI-powered proposal.</p>
            <Link href="/upload-rfp"><Button>Upload RFP</Button></Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {proposals?.map((p: ProposalItem) => (
            <Card key={p?.id} className="shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Link href={`/proposals/${p?.id}`} className="font-medium hover:text-primary truncate">{p?.title}</Link>
                    </div>
                    <div className="flex items-center gap-3 mt-1 flex-wrap">
                      <Badge variant={p?.status === "Final" ? "default" : "secondary"} className="text-xs">{p?.status}</Badge>
                      <Badge variant="outline" className="text-xs">{p?.industry}</Badge>
                      <span className="text-xs text-muted-foreground">{p?.templateType} template</span>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(p?.createdAt ?? "").toLocaleDateString()}
                      </span>
                      <span className="text-xs text-muted-foreground">{p?.sections?.length ?? 0} sections</span>
                      {p?.winScore != null && (
                        <span className={`text-xs font-semibold flex items-center gap-1 ${p.winScore >= 80 ? "text-emerald-600" : p.winScore >= 60 ? "text-amber-600" : "text-red-600"}`}>
                          <Trophy className="w-3 h-3" />{p.winScore}/100
                        </span>
                      )}
                      {p?.approvalStatus === "pending_approval" && (
                        <Badge variant="outline" className="text-xs text-amber-600 border-amber-200 bg-amber-50 gap-1"><Clock className="w-3 h-3" /> Pending</Badge>
                      )}
                      {p?.approvalStatus === "approved" && (
                        <Badge variant="outline" className="text-xs text-emerald-600 border-emerald-200 bg-emerald-50 gap-1"><ThumbsUp className="w-3 h-3" /> Approved</Badge>
                      )}
                      {p?.approvalStatus === "rejected" && (
                        <Badge variant="outline" className="text-xs text-red-600 border-red-200 bg-red-50 gap-1"><ThumbsDown className="w-3 h-3" /> Rejected</Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link href={`/proposals/${p?.id}`}>
                      <Button size="sm" variant="outline">View</Button>
                    </Link>
                    <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => setDeleteId(p?.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Proposal?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => { if (deleteId) handleDelete(deleteId); }}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
