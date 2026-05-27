"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Plus, Search, Trash2, Edit2, Check, X, Loader2, FileText, Tag, Calendar,
} from "lucide-react";
import { toast } from "sonner";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

interface TextEntry {
  id: string;
  title: string;
  content: string;
  tags: string[];
  industry: string;
  createdAt: string;
  updatedAt: string;
}

export function TextEntriesClient() {
  const [entries, setEntries] = useState<TextEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [form, setForm] = useState({ title: "", content: "", tags: "", industry: "General" });
  const searchTimeout = useRef<any>(null);

  const fetchEntries = useCallback(async (q: string = "") => {
    try {
      const res = await fetch(`/api/vault/text-entries${q ? `?search=${encodeURIComponent(q)}` : ""}`);
      const data = await res.json().catch(() => []);
      setEntries(Array.isArray(data) ? data : []);
    } catch {
      toast.error("Failed to load text entries");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchEntries(); }, [fetchEntries]);

  function handleSearchChange(val: string) {
    setSearch(val);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => fetchEntries(val), 400);
  }

  function resetForm() {
    setForm({ title: "", content: "", tags: "", industry: "General" });
    setShowForm(false);
    setEditingId(null);
  }

  function startEdit(entry: TextEntry) {
    setEditingId(entry.id);
    setForm({
      title: entry.title,
      content: entry.content,
      tags: (entry.tags ?? []).join(", "),
      industry: entry.industry,
    });
    setShowForm(true);
  }

  async function handleSave() {
    if (!form.title.trim() || !form.content.trim()) {
      toast.error("Title and content are required");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        title: form.title.trim(),
        content: form.content.trim(),
        tags: form.tags.split(",").map((t: string) => t.trim()).filter(Boolean),
        industry: form.industry,
      };

      if (editingId) {
        const res = await fetch(`/api/vault/text-entries/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res?.ok) throw new Error();
        toast.success("Entry updated");
      } else {
        const res = await fetch("/api/vault/text-entries", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res?.ok) throw new Error();
        toast.success("Entry created");
      }
      resetForm();
      fetchEntries(search);
    } catch {
      toast.error("Failed to save entry");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      const res = await fetch(`/api/vault/text-entries/${id}`, { method: "DELETE" });
      if (!res?.ok) throw new Error();
      toast.success("Entry deleted");
      setEntries((prev) => prev.filter((e) => e.id !== id));
    } catch {
      toast.error("Failed to delete");
    }
    setDeleteTarget(null);
  }

  return (
    <div>
      {/* Header with Add button */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search text entries..."
            value={search}
            onChange={(e: any) => handleSearchChange(e?.target?.value ?? "")}
            className="pl-10"
          />
        </div>
        <Button onClick={() => { resetForm(); setShowForm(true); }}>
          <Plus className="w-4 h-4 mr-2" /> Add Entry
        </Button>
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <Card className="mb-6 shadow-md border-primary/20">
          <CardContent className="p-5 space-y-4">
            <h3 className="font-display font-semibold text-lg">{editingId ? "Edit Text Entry" : "New Text Entry"}</h3>
            <div>
              <Label className="text-sm font-medium">Title *</Label>
              <Input value={form.title} onChange={(e: any) => setForm((p) => ({ ...p, title: e?.target?.value ?? "" }))} placeholder="e.g., Company Overview, Pricing Boilerplate" className="mt-1" />
            </div>
            <div>
              <Label className="text-sm font-medium">Content *</Label>
              <Textarea value={form.content} onChange={(e: any) => setForm((p) => ({ ...p, content: e?.target?.value ?? "" }))} placeholder="Enter reusable text content..." rows={6} className="mt-1" />
            </div>
            <div className="flex gap-4">
              <div className="flex-1">
                <Label className="text-sm font-medium">Tags</Label>
                <Input value={form.tags} onChange={(e: any) => setForm((p) => ({ ...p, tags: e?.target?.value ?? "" }))} placeholder="tag1, tag2, tag3" className="mt-1" />
              </div>
              <div className="w-40">
                <Label className="text-sm font-medium">Industry</Label>
                <Select value={form.industry} onValueChange={(v: string) => setForm((p) => ({ ...p, industry: v }))}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="General">General</SelectItem>
                    <SelectItem value="Valves">Valves</SelectItem>
                    <SelectItem value="Pumps">Pumps</SelectItem>
                    <SelectItem value="EPC">EPC</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSave} disabled={saving}>
                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Check className="w-4 h-4 mr-2" />}
                {editingId ? "Save Changes" : "Create Entry"}
              </Button>
              <Button variant="ghost" onClick={resetForm}>
                <X className="w-4 h-4 mr-2" /> Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Entries List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : entries.length === 0 ? (
        <Card className="shadow-md border-0">
          <CardContent className="p-12 text-center">
            <FileText className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
            <h3 className="font-display text-lg font-semibold mb-2">No Text Entries Yet</h3>
            <p className="text-muted-foreground mb-4">Add reusable text snippets like company info, team bios, pricing history, or boilerplate text.</p>
            <Button onClick={() => { resetForm(); setShowForm(true); }}>
              <Plus className="w-4 h-4 mr-2" /> Add Your First Entry
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {entries.map((entry) => (
            <Card key={entry.id} className="shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <FileText className="w-4 h-4 text-primary shrink-0" />
                      <span className="font-medium">{entry.title}</span>
                      <Badge variant="secondary" className="text-xs">{entry.industry}</Badge>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(entry.updatedAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">
                      {entry.content.substring(0, 300)}{entry.content.length > 300 ? "..." : ""}
                    </p>
                    {(entry.tags?.length ?? 0) > 0 && (
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        {entry.tags.map((tag, i) => (
                          <Badge key={i} variant="outline" className="text-xs">
                            <Tag className="w-3 h-3 mr-1" />{tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => startEdit(entry)}>
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => setDeleteTarget(entry.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>This will permanently delete this text entry.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => deleteTarget && handleDelete(deleteTarget)}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
