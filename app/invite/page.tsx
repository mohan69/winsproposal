"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, CheckCircle, XCircle, Zap } from "lucide-react";
import { toast } from "sonner";

function InviteContent() {
  const searchParams = useSearchParams();
  const token = searchParams?.get("token");
  const { data: session, status } = useSession() || {};
  const [accepting, setAccepting] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  async function acceptInvite() {
    if (!token) return;
    setAccepting(true);
    try {
      const res = await fetch("/api/team/invite/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res?.ok) throw new Error(data?.error ?? "Failed to accept invite");
      setResult({ success: true, message: data?.message ?? "You have joined the organization!" });
      toast.success("Welcome to the team!");
    } catch (err: any) {
      setResult({ success: false, message: err?.message ?? "Failed to accept invite" });
    } finally { setAccepting(false); }
  }

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
        <Card className="max-w-md w-full shadow-lg">
          <CardContent className="p-8 text-center">
            <XCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
            <h2 className="font-display text-xl font-bold mb-2">Invalid Invite Link</h2>
            <p className="text-muted-foreground mb-4">This invite link appears to be invalid or incomplete.</p>
            <Link href="/"><Button>Go Home</Button></Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
        <Card className="max-w-md w-full shadow-lg">
          <CardContent className="p-8 text-center">
            <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center mx-auto mb-4">
              <Zap className="w-7 h-7 text-primary-foreground" />
            </div>
            <h2 className="font-display text-xl font-bold mb-2">Team Invitation</h2>
            <p className="text-muted-foreground mb-6">You need to sign in or create an account to accept this invitation.</p>
            <div className="flex gap-3 justify-center">
              <Link href={`/login?callbackUrl=/invite?token=${token}`}>
                <Button>Log In</Button>
              </Link>
              <Link href={`/signup?callbackUrl=/invite?token=${token}`}>
                <Button variant="outline">Sign Up</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (result) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
        <Card className="max-w-md w-full shadow-lg">
          <CardContent className="p-8 text-center">
            {result.success ? (
              <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
            ) : (
              <XCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
            )}
            <h2 className="font-display text-xl font-bold mb-2">{result.success ? "Welcome!" : "Something went wrong"}</h2>
            <p className="text-muted-foreground mb-6">{result.message}</p>
            <Link href="/vault"><Button>{result.success ? "Go to Dashboard" : "Go Home"}</Button></Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <Card className="max-w-md w-full shadow-lg">
        <CardContent className="p-8 text-center">
          <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center mx-auto mb-4">
            <Zap className="w-7 h-7 text-primary-foreground" />
          </div>
          <h2 className="font-display text-xl font-bold mb-2">Team Invitation</h2>
          <p className="text-muted-foreground mb-6">
            You&apos;ve been invited to join a team on WinsProposal. Click below to accept.
          </p>
          <Button onClick={acceptInvite} disabled={accepting} className="w-full">
            {accepting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Accept Invitation
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export default function InvitePage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>}>
      <InviteContent />
    </Suspense>
  );
}
