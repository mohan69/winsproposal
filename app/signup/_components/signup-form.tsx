"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Zap, Loader2, Mail, Lock, User, Building } from "lucide-react";
import { toast } from "sonner";

export function SignupForm() {
  const [form, setForm] = useState({ name: "", email: "", password: "", confirmPassword: "", companyName: "" });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  function validate() {
    const errs: Record<string, string> = {};
    if (!form?.name?.trim()) errs.name = "Name is required";
    if (!form?.email?.trim()) errs.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form?.email ?? "")) errs.email = "Invalid email";
    if (!form?.password || (form?.password?.length ?? 0) < 6) errs.password = "Password must be at least 6 characters";
    if (form?.password !== form?.confirmPassword) errs.confirmPassword = "Passwords do not match";
    return errs;
  }

  async function handleSubmit(e: React.FormEvent) {
    e?.preventDefault?.();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs ?? {})?.length > 0) return;

    setLoading(true);
    try {
      const res = await fetch("/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form?.name,
          email: form?.email,
          password: form?.password,
          companyName: form?.companyName || undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res?.ok) throw new Error(data?.error ?? "Signup failed");

      await signIn("credentials", {
        email: form?.email,
        password: form?.password,
        redirect: true,
        callbackUrl: "/vault",
      });
    } catch (err: any) {
      toast.error(err?.message ?? "Signup failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-4">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
              <Zap className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="font-display text-2xl font-bold tracking-tight">WinsProposal</span>
          </Link>
          <p className="text-muted-foreground">Create your account</p>
        </div>
        <Card className="shadow-lg border-0">
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Full Name *</Label>
                <div className="relative mt-1">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input id="name" value={form?.name ?? ""} onChange={(e: any) => setForm((p: any) => ({ ...(p ?? {}), name: e?.target?.value ?? "" }))} placeholder="John Smith" className="pl-10" />
                </div>
                {errors?.name && <p className="text-xs text-destructive mt-1">{errors?.name}</p>}
              </div>
              <div>
                <Label htmlFor="email">Email *</Label>
                <div className="relative mt-1">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input id="email" type="email" value={form?.email ?? ""} onChange={(e: any) => setForm((p: any) => ({ ...(p ?? {}), email: e?.target?.value ?? "" }))} placeholder="you@company.com" className="pl-10" />
                </div>
                {errors?.email && <p className="text-xs text-destructive mt-1">{errors?.email}</p>}
              </div>
              <div>
                <Label htmlFor="company">Company Name</Label>
                <div className="relative mt-1">
                  <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input id="company" value={form?.companyName ?? ""} onChange={(e: any) => setForm((p: any) => ({ ...(p ?? {}), companyName: e?.target?.value ?? "" }))} placeholder="Acme Industries" className="pl-10" />
                </div>
              </div>
              <div>
                <Label htmlFor="password">Password *</Label>
                <div className="relative mt-1">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input id="password" type="password" value={form?.password ?? ""} onChange={(e: any) => setForm((p: any) => ({ ...(p ?? {}), password: e?.target?.value ?? "" }))} placeholder="••••••••" className="pl-10" />
                </div>
                {errors?.password && <p className="text-xs text-destructive mt-1">{errors?.password}</p>}
              </div>
              <div>
                <Label htmlFor="confirm">Confirm Password *</Label>
                <div className="relative mt-1">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input id="confirm" type="password" value={form?.confirmPassword ?? ""} onChange={(e: any) => setForm((p: any) => ({ ...(p ?? {}), confirmPassword: e?.target?.value ?? "" }))} placeholder="••••••••" className="pl-10" />
                </div>
                {errors?.confirmPassword && <p className="text-xs text-destructive mt-1">{errors?.confirmPassword}</p>}
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                {loading ? "Creating account..." : "Create Account"}
              </Button>
            </form>
          </CardContent>
        </Card>
        <p className="text-center text-sm text-muted-foreground mt-6">
          Already have an account?{" "}
          <Link href="/login" className="text-primary font-medium hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
