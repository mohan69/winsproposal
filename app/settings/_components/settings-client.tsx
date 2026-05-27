"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Settings, Building2, Palette, Loader2, Check, Upload, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";

const BRAND_COLORS = [
  { name: "Navy", value: "#1a365d" },
  { name: "Emerald", value: "#10b981" },
  { name: "Blue", value: "#2563eb" },
  { name: "Indigo", value: "#4f46e5" },
  { name: "Purple", value: "#7c3aed" },
  { name: "Red", value: "#dc2626" },
  { name: "Orange", value: "#ea580c" },
  { name: "Teal", value: "#0d9488" },
];

interface OrgData {
  id: string;
  name: string;
  logoUrl: string | null;
  brandColor: string | null;
}

export function SettingsClient() {
  const { data: session } = useSession() || {};
  const isAdmin = (session?.user as any)?.role === "admin";
  const hasOrg = !!(session?.user as any)?.organizationId;

  const [org, setOrg] = useState<OrgData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [creating, setCreating] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);

  // Form fields
  const [orgName, setOrgName] = useState("");
  const [brandColor, setBrandColor] = useState("#1a365d");
  const [customColor, setCustomColor] = useState("");

  useEffect(() => {
    async function loadOrg() {
      try {
        const res = await fetch("/api/organization");
        const data = await res.json().catch(() => null);
        if (data?.id) {
          setOrg(data);
          setOrgName(data.name ?? "");
          setBrandColor(data.brandColor ?? "#1a365d");
        }
      } catch {} finally { setLoading(false); }
    }
    loadOrg();
  }, []);

  async function handleCreateOrg(e: React.FormEvent) {
    e?.preventDefault?.();
    if (!orgName?.trim()) { toast.error("Organization name is required"); return; }
    setCreating(true);
    try {
      const res = await fetch("/api/organization", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: orgName.trim(), brandColor }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res?.ok) throw new Error(data?.error ?? "Failed to create organization");
      setOrg(data);
      toast.success("Organization created! Please log out and log back in to see team features.");
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to create organization");
    } finally { setCreating(false); }
  }

  async function handleSaveOrg() {
    if (!org) return;
    setSaving(true);
    try {
      const res = await fetch("/api/organization", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: orgName.trim(), brandColor }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res?.ok) throw new Error(data?.error ?? "Failed to update");
      setOrg(data);
      toast.success("Organization settings saved!");
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to save");
    } finally { setSaving(false); }
  }

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e?.target?.files?.[0];
    if (!file) return;
    const ext = file?.name?.split(".")?.pop()?.toLowerCase() ?? "";
    if (!["jpg", "jpeg", "png", "svg", "webp"].includes(ext)) {
      toast.error("Supported formats: JPG, PNG, SVG, WEBP");
      return;
    }
    if ((file?.size ?? 0) > 5 * 1024 * 1024) {
      toast.error("Logo must be under 5MB");
      return;
    }
    setUploadingLogo(true);
    try {
      // Get presigned URL
      const presignedRes = await fetch("/api/upload/presigned", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileName: `org-logo.${ext}`, contentType: file.type, isPublic: true }),
      });
      const presignedData = await presignedRes.json().catch(() => ({}));
      if (!presignedRes?.ok) throw new Error("Failed to get upload URL");

      const uploadUrl = presignedData?.uploadUrl ?? "";
      const cloudPath = presignedData?.cloud_storage_path ?? "";
      const uploadHeaders: Record<string, string> = { "Content-Type": file.type };
      if (uploadUrl?.includes("content-disposition")) {
        uploadHeaders["Content-Disposition"] = "attachment";
      }
      const s3Res = await fetch(uploadUrl, { method: "PUT", body: file, headers: uploadHeaders });
      if (!s3Res?.ok) throw new Error("Failed to upload logo");

      // Get public URL
      const publicUrl = presignedData?.publicUrl || uploadUrl.split("?")[0];

      // Save to org
      const updateRes = await fetch("/api/organization", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ logoUrl: publicUrl }),
      });
      const updateData = await updateRes.json().catch(() => ({}));
      if (!updateRes?.ok) throw new Error("Failed to save logo");
      setOrg(updateData);
      toast.success("Logo uploaded!");
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to upload logo");
    } finally {
      setUploadingLogo(false);
      if (logoInputRef?.current) logoInputRef.current.value = "";
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-[800px] mx-auto">
      <div className="mb-8">
        <h1 className="font-display text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-2">
          <Settings className="w-7 h-7 text-primary" /> Settings
        </h1>
        <p className="text-muted-foreground mt-1">Organization and branding settings.</p>
      </div>

      {/* Create or Edit Organization */}
      {!org ? (
        <Card className="shadow-md">
          <CardContent className="p-6">
            <h3 className="font-display text-lg font-semibold mb-1 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-primary" /> Create Your Organization
            </h3>
            <p className="text-sm text-muted-foreground mb-6">Set up your organization to invite team members and customize branding.</p>
            <form onSubmit={handleCreateOrg} className="space-y-4">
              <div>
                <Label className="text-sm font-medium">Organization Name</Label>
                <Input value={orgName} onChange={(e: any) => setOrgName(e?.target?.value ?? "")} placeholder="e.g. Acme Engineering Pvt Ltd" className="mt-1" />
              </div>
              <div>
                <Label className="text-sm font-medium">Brand Color</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {BRAND_COLORS.map((c) => (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() => setBrandColor(c.value)}
                      className={`w-8 h-8 rounded-full border-2 transition-all ${brandColor === c.value ? "border-foreground scale-110 ring-2 ring-offset-2 ring-primary" : "border-transparent hover:scale-105"}`}
                      style={{ backgroundColor: c.value }}
                      title={c.name}
                    />
                  ))}
                  <Input
                    type="color"
                    value={brandColor}
                    onChange={(e: any) => setBrandColor(e?.target?.value ?? "#1a365d")}
                    className="w-8 h-8 p-0 border-0 cursor-pointer rounded-full overflow-hidden"
                    title="Custom color"
                  />
                </div>
              </div>
              <Button type="submit" disabled={creating}>
                {creating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Building2 className="w-4 h-4 mr-2" />}
                Create Organization
              </Button>
            </form>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Org details */}
          <Card className="shadow-sm">
            <CardContent className="p-6">
              <h3 className="font-display text-lg font-semibold mb-4 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-primary" /> Organization
              </h3>
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium">Organization Name</Label>
                  <Input
                    value={orgName}
                    onChange={(e: any) => setOrgName(e?.target?.value ?? "")}
                    className="mt-1"
                    disabled={!isAdmin}
                  />
                </div>
                {isAdmin && (
                  <Button onClick={handleSaveOrg} disabled={saving} size="sm">
                    {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Check className="w-4 h-4 mr-2" />}
                    Save Changes
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Branding */}
          <Card className="shadow-sm">
            <CardContent className="p-6">
              <h3 className="font-display text-lg font-semibold mb-4 flex items-center gap-2">
                <Palette className="w-5 h-5 text-primary" /> Branding
              </h3>
              <div className="space-y-4">
                {/* Logo */}
                <div>
                  <Label className="text-sm font-medium">Organization Logo</Label>
                  <div className="flex items-center gap-4 mt-2">
                    {org.logoUrl ? (
                      <div className="w-16 h-16 rounded-lg border bg-white flex items-center justify-center overflow-hidden">
                        <img src={org.logoUrl} alt="Org logo" className="max-w-full max-h-full object-contain" />
                      </div>
                    ) : (
                      <div className="w-16 h-16 rounded-lg border bg-muted flex items-center justify-center">
                        <ImageIcon className="w-6 h-6 text-muted-foreground" />
                      </div>
                    )}
                    {isAdmin && (
                      <div>
                        <input ref={logoInputRef} type="file" accept=".jpg,.jpeg,.png,.svg,.webp" className="hidden" onChange={handleLogoUpload} />
                        <Button size="sm" variant="outline" onClick={() => logoInputRef?.current?.click?.()} disabled={uploadingLogo}>
                          {uploadingLogo ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Upload className="w-4 h-4 mr-2" />}
                          {org.logoUrl ? "Change Logo" : "Upload Logo"}
                        </Button>
                        <p className="text-xs text-muted-foreground mt-1">JPG, PNG, SVG, WEBP · Max 5MB</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Brand Color */}
                <div>
                  <Label className="text-sm font-medium">Brand Color</Label>
                  <p className="text-xs text-muted-foreground mb-2">Used in PDF proposal headers and cover pages.</p>
                  <div className="flex flex-wrap items-center gap-2">
                    {BRAND_COLORS.map((c) => (
                      <button
                        key={c.value}
                        type="button"
                        onClick={() => { if (isAdmin) setBrandColor(c.value); }}
                        className={`w-8 h-8 rounded-full border-2 transition-all ${brandColor === c.value ? "border-foreground scale-110 ring-2 ring-offset-2 ring-primary" : "border-transparent hover:scale-105"} ${!isAdmin ? "cursor-default" : ""}`}
                        style={{ backgroundColor: c.value }}
                        title={c.name}
                        disabled={!isAdmin}
                      />
                    ))}
                    {isAdmin && (
                      <Input
                        type="color"
                        value={brandColor}
                        onChange={(e: any) => setBrandColor(e?.target?.value ?? "#1a365d")}
                        className="w-8 h-8 p-0 border-0 cursor-pointer rounded-full overflow-hidden"
                        title="Custom color"
                      />
                    )}
                    <div className="flex items-center gap-2 ml-2">
                      <div className="w-6 h-6 rounded border" style={{ backgroundColor: brandColor }} />
                      <span className="text-sm text-muted-foreground font-mono">{brandColor}</span>
                    </div>
                  </div>
                </div>

                {isAdmin && (
                  <Button onClick={handleSaveOrg} disabled={saving} size="sm">
                    {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Check className="w-4 h-4 mr-2" />}
                    Save Branding
                  </Button>
                )}

                {/* Preview */}
                <div className="mt-4">
                  <Label className="text-sm font-medium mb-2 block">PDF Cover Preview</Label>
                  <div
                    className="rounded-lg p-6 text-white"
                    style={{ background: `linear-gradient(135deg, ${brandColor}, ${brandColor}dd)` }}
                  >
                    <div className="flex items-center gap-3 mb-4">
                      {org.logoUrl && (
                        <div className="w-10 h-10 rounded bg-white/20 flex items-center justify-center overflow-hidden">
                          <img src={org.logoUrl} alt="" className="max-w-full max-h-full object-contain" />
                        </div>
                      )}
                      <span className="font-display font-bold text-lg">{orgName || "Your Organization"}</span>
                    </div>
                    <div className="text-white/80 text-sm">Technical &amp; Commercial Proposal</div>
                    <div className="text-white/60 text-xs mt-1">Proposal Title Here</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
