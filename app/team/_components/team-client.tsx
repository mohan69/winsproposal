"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, Mail, UserPlus, Loader2, Copy, Trash2, Shield, Crown, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

interface Member {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
}

interface Invite {
  id: string;
  email: string;
  role: string;
  createdAt: string;
  expiresAt: string;
  status: string;
}

export function TeamClient() {
  const { data: session } = useSession() || {};
  const isAdmin = (session?.user as any)?.role === "admin";
  const hasOrg = !!(session?.user as any)?.organizationId;
  const [members, setMembers] = useState<Member[]>([]);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("team_member");
  const [sending, setSending] = useState(false);
  const [revokeTarget, setRevokeTarget] = useState<string | null>(null);

  const fetchTeam = useCallback(async () => {
    try {
      const res = await fetch("/api/team");
      const data = await res.json().catch(() => ({}));
      setMembers(data?.members ?? []);
      setInvites(data?.invites ?? []);
    } catch { toast.error("Failed to load team"); } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchTeam(); }, [fetchTeam]);

  async function handleInvite(e: React.FormEvent) {
    e?.preventDefault?.();
    if (!inviteEmail?.trim()) { toast.error("Enter an email address"); return; }
    setSending(true);
    try {
      const res = await fetch("/api/team/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail.trim(), role: inviteRole }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res?.ok) throw new Error(data?.error ?? "Failed to send invite");
      toast.success("Invite sent!");
      if (data?.inviteLink) {
        try { await navigator.clipboard.writeText(data.inviteLink); toast.success("Invite link copied to clipboard!"); } catch {}
      }
      setInviteEmail("");
      fetchTeam();
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to send invite");
    } finally { setSending(false); }
  }

  async function handleRevoke(id: string) {
    try {
      const res = await fetch(`/api/team/invite?id=${id}`, { method: "DELETE" });
      if (!res?.ok) throw new Error();
      toast.success("Invite revoked");
      setInvites((prev) => prev.filter((i) => i.id !== id));
    } catch { toast.error("Failed to revoke invite"); }
    setRevokeTarget(null);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!hasOrg) {
    return (
      <div className="p-4 md:p-8 max-w-[1200px] mx-auto">
        <div className="mb-8">
          <h1 className="font-display text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-2">
            <Users className="w-7 h-7 text-primary" /> Team
          </h1>
          <p className="text-muted-foreground mt-1">Manage your team members and invitations.</p>
        </div>
        <Card className="shadow-md border-0">
          <CardContent className="p-12 text-center">
            <Users className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
            <h3 className="font-display text-lg font-semibold mb-2">No Organization Yet</h3>
            <p className="text-muted-foreground mb-4">Create an organization in Settings to start inviting team members.</p>
            <Button onClick={() => window.location.href = "/settings"}>Go to Settings</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-[1200px] mx-auto">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-2">
            <Users className="w-7 h-7 text-primary" /> Team
          </h1>
          <p className="text-muted-foreground mt-1">Manage your team members and invitations.</p>
        </div>
      </div>

      {/* Invite form - admin only */}
      {isAdmin && (
        <Card className="mb-8 shadow-sm">
          <CardContent className="p-4">
            <h3 className="font-display font-semibold mb-3 flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-primary" /> Invite Team Member
            </h3>
            <form onSubmit={handleInvite} className="flex flex-col sm:flex-row items-start sm:items-end gap-3">
              <div className="flex-1 w-full">
                <Input
                  type="email"
                  placeholder="colleague@company.com"
                  value={inviteEmail}
                  onChange={(e: any) => setInviteEmail(e?.target?.value ?? "")}
                />
              </div>
              <Select value={inviteRole} onValueChange={setInviteRole}>
                <SelectTrigger className="w-44">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="team_member">Team Member</SelectItem>
                  <SelectItem value="bid_manager">Bid Manager</SelectItem>
                  <SelectItem value="reviewer">Reviewer</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
              <Button type="submit" disabled={sending}>
                {sending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Mail className="w-4 h-4 mr-2" />}
                Send Invite
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Members list */}
      <div className="mb-8">
        <h3 className="font-display font-semibold mb-4 flex items-center gap-2">
          <Shield className="w-4 h-4 text-primary" /> Members ({members.length})
        </h3>
        <div className="space-y-2">
          {members.map((m) => (
            <Card key={m.id} className="shadow-sm">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-sm font-semibold text-primary">{m.name?.[0]?.toUpperCase()}</span>
                  </div>
                  <div>
                    <div className="font-medium text-sm">{m.name}</div>
                    <div className="text-xs text-muted-foreground">{m.email}</div>
                  </div>
                </div>
                <Badge variant={m.role === "admin" ? "default" : "secondary"} className="text-xs gap-1">
                  {m.role === "admin" && <Crown className="w-3 h-3" />}
                  {m.role === "admin" ? "Admin" : m.role === "bid_manager" ? "Bid Manager" : m.role === "reviewer" ? "Reviewer" : "Team Member"}
                </Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Pending invites */}
      {invites.length > 0 && (
        <div>
          <h3 className="font-display font-semibold mb-4 flex items-center gap-2">
            <Mail className="w-4 h-4 text-amber-500" /> Pending Invites ({invites.length})
          </h3>
          <div className="space-y-2">
            {invites.map((inv) => (
              <Card key={inv.id} className="shadow-sm border-amber-100">
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium">{inv.email}</div>
                    <div className="text-xs text-muted-foreground">
                      Invited {new Date(inv.createdAt).toLocaleDateString()} · Expires {new Date(inv.expiresAt).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs text-amber-600 border-amber-200">Pending</Badge>
                    {isAdmin && (
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => setRevokeTarget(inv.id)}>
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      <AlertDialog open={!!revokeTarget} onOpenChange={() => setRevokeTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke Invite?</AlertDialogTitle>
            <AlertDialogDescription>This will cancel the pending invitation.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => { if (revokeTarget) handleRevoke(revokeTarget); }}>
              Revoke
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
