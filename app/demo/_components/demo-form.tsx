"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle, Send, Loader2 } from "lucide-react";
import { toast } from "sonner";

export function DemoForm() {
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    company: "",
    industry: "",
    rfpsPerMonth: "",
    message: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  function validate() {
    const errs: Record<string, string> = {};
    if (!form?.name?.trim()) errs.name = "Full name is required";
    if (!form?.email?.trim()) errs.email = "Work email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form?.email ?? "")) errs.email = "Invalid email address";
    if (!form?.company?.trim()) errs.company = "Company name is required";
    return errs;
  }

  async function handleSubmit(e: React.FormEvent) {
    e?.preventDefault?.();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs ?? {})?.length > 0) return;

    setLoading(true);
    try {
      const res = await fetch("/api/demo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json().catch(() => ({}));
      if (!res?.ok) throw new Error(data?.error ?? "Submission failed");
      setSubmitted(true);
      toast.success("Demo request submitted successfully!");
    } catch (err: any) {
      toast.error(err?.message ?? "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <Card className="shadow-md border-0">
        <CardContent className="p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-emerald-600" />
          </div>
          <h3 className="font-display text-xl font-semibold mb-2">Thank You!</h3>
          <p className="text-muted-foreground">Your demo request has been submitted. Our team will reach out within 24 hours.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card id="contact" className="shadow-md border-0">
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <Label htmlFor="name">Full Name *</Label>
            <Input id="name" value={form?.name ?? ""} onChange={(e: any) => setForm((p: any) => ({ ...(p ?? {}), name: e?.target?.value ?? "" }))} placeholder="John Smith" className="mt-1" />
            {errors?.name && <p className="text-xs text-destructive mt-1">{errors?.name}</p>}
          </div>
          <div>
            <Label htmlFor="email">Work Email *</Label>
            <Input id="email" type="email" value={form?.email ?? ""} onChange={(e: any) => setForm((p: any) => ({ ...(p ?? {}), email: e?.target?.value ?? "" }))} placeholder="john@company.com" className="mt-1" />
            {errors?.email && <p className="text-xs text-destructive mt-1">{errors?.email}</p>}
          </div>
          <div>
            <Label htmlFor="company">Company Name *</Label>
            <Input id="company" value={form?.company ?? ""} onChange={(e: any) => setForm((p: any) => ({ ...(p ?? {}), company: e?.target?.value ?? "" }))} placeholder="Acme Industries" className="mt-1" />
            {errors?.company && <p className="text-xs text-destructive mt-1">{errors?.company}</p>}
          </div>
          <div>
            <Label>Industry</Label>
            <Select value={form?.industry ?? ""} onValueChange={(v: string) => setForm((p: any) => ({ ...(p ?? {}), industry: v ?? "" }))}>
              <SelectTrigger className="mt-1"><SelectValue placeholder="Select industry" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Valves">Valves</SelectItem>
                <SelectItem value="Pumps">Pumps</SelectItem>
                <SelectItem value="EPC">EPC</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>RFPs per Month</Label>
            <Select value={form?.rfpsPerMonth ?? ""} onValueChange={(v: string) => setForm((p: any) => ({ ...(p ?? {}), rfpsPerMonth: v ?? "" }))}>
              <SelectTrigger className="mt-1"><SelectValue placeholder="Select range" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="1-5">1-5</SelectItem>
                <SelectItem value="5-15">5-15</SelectItem>
                <SelectItem value="15-50">15-50</SelectItem>
                <SelectItem value="50+">50+</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="message">Message</Label>
            <Textarea id="message" value={form?.message ?? ""} onChange={(e: any) => setForm((p: any) => ({ ...(p ?? {}), message: e?.target?.value ?? "" }))} placeholder="Tell us about your proposal challenges..." rows={4} className="mt-1" />
          </div>
          <Button type="submit" className="w-full bg-emerald-500 hover:bg-emerald-600 text-white" disabled={loading}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
            {loading ? "Submitting..." : "Submit Demo Request"}
          </Button>
          <p className="text-xs text-muted-foreground text-center">Your information is stored securely and will only be used to contact you about WinsProposal.</p>
        </form>
      </CardContent>
    </Card>
  );
}
