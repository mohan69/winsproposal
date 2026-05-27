"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Copy, Check, Loader2, Linkedin, Calendar, Hash,
  MessageSquare, BarChart3, Lock,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface LinkedInPost {
  id: string;
  postText: string;
  hashtags: string[];
  topic: string;
  characterCount: number;
  suggestedDay: string | null;
  createdAt: string;
}

const topicColors: Record<string, string> = {
  "RFP Pain Points": "bg-red-100 text-red-700 border-red-200",
  "Proposal Automation Benefits": "bg-blue-100 text-blue-700 border-blue-200",
  "TBE Automation": "bg-purple-100 text-purple-700 border-purple-200",
  "Pain Point Awareness": "bg-amber-100 text-amber-700 border-amber-200",
  "Case Study / Social Proof": "bg-emerald-100 text-emerald-700 border-emerald-200",
};

const dayColors: Record<string, string> = {
  Monday: "bg-blue-50 text-blue-600",
  Tuesday: "bg-purple-50 text-purple-600",
  Wednesday: "bg-teal-50 text-teal-600",
  Thursday: "bg-amber-50 text-amber-600",
  Friday: "bg-emerald-50 text-emerald-600",
};

export function LinkedInContentClient() {
  const { data: session } = useSession() || {};
  const router = useRouter();
  const [posts, setPosts] = useState<LinkedInPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const isAdmin = (session?.user as any)?.role === "admin";

  useEffect(() => {
    async function loadPosts() {
      try {
        const res = await fetch("/api/linkedin-posts");
        if (res.status === 403) {
          setLoading(false);
          return;
        }
        const data = await res.json().catch(() => []);
        if (Array.isArray(data)) setPosts(data);
      } catch {
        toast.error("Failed to load content");
      } finally {
        setLoading(false);
      }
    }
    loadPosts();
  }, []);

  async function copyToClipboard(post: LinkedInPost) {
    try {
      await navigator.clipboard.writeText(post.postText);
      setCopiedId(post.id);
      toast.success("Copied to clipboard!");
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      toast.error("Failed to copy");
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="p-8 text-center">
        <Lock className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <h2 className="font-display text-xl font-bold mb-2">Admin Access Required</h2>
        <p className="text-muted-foreground">The LinkedIn Content Library is only available to admin users.</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-[1000px] mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-[#0A66C2] flex items-center justify-center">
            <Linkedin className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-display text-2xl md:text-3xl font-bold tracking-tight">LinkedIn Content Library</h1>
            <p className="text-muted-foreground text-sm">Ready-to-post content to build your brand and attract leads</p>
          </div>
        </div>
      </div>

      {/* Posting Schedule Banner */}
      <Card className="mb-6 border-blue-100 bg-gradient-to-r from-blue-50 to-indigo-50 shadow-sm">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Calendar className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-sm text-blue-900">Suggested Weekly Schedule</p>
              <p className="text-xs text-blue-700 mt-1">
                Monday → Pain Points &bull; Tuesday → TBE Focus &bull; Wednesday → ROI/Benefits &bull; Thursday → Awareness &bull; Friday → Case Study
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        <Card className="shadow-sm">
          <CardContent className="p-4 text-center">
            <MessageSquare className="w-5 h-5 text-primary mx-auto mb-1" />
            <p className="text-2xl font-bold">{posts.length}</p>
            <p className="text-xs text-muted-foreground">Posts Ready</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="p-4 text-center">
            <Hash className="w-5 h-5 text-primary mx-auto mb-1" />
            <p className="text-2xl font-bold">{new Set(posts.flatMap(p => p.hashtags)).size}</p>
            <p className="text-xs text-muted-foreground">Unique Hashtags</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="p-4 text-center">
            <BarChart3 className="w-5 h-5 text-primary mx-auto mb-1" />
            <p className="text-2xl font-bold">{new Set(posts.map(p => p.topic)).size}</p>
            <p className="text-xs text-muted-foreground">Topics Covered</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="p-4 text-center">
            <Calendar className="w-5 h-5 text-primary mx-auto mb-1" />
            <p className="text-2xl font-bold">5</p>
            <p className="text-xs text-muted-foreground">Days/Week</p>
          </CardContent>
        </Card>
      </div>

      {/* Posts */}
      <div className="space-y-5">
        {posts.map((post, index) => {
          const isExpanded = expandedId === post.id;
          const previewText = post.postText.slice(0, 200);
          const needsTruncation = post.postText.length > 200;

          return (
            <Card key={post.id} className="shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                {/* Post header */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge className={cn("text-xs border", topicColors[post.topic] || "bg-gray-100 text-gray-700")}>
                      {post.topic}
                    </Badge>
                    {post.suggestedDay && (
                      <Badge variant="outline" className={cn("text-xs", dayColors[post.suggestedDay] || "")}>
                        <Calendar className="w-3 h-3 mr-1" />
                        {post.suggestedDay}
                      </Badge>
                    )}
                    <span className="text-xs text-muted-foreground">
                      {post.characterCount} chars
                      {post.characterCount > 3000 && (
                        <span className="text-amber-600 ml-1">(LinkedIn limit: 3,000)</span>
                      )}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground font-medium shrink-0">#{index + 1}</span>
                </div>

                {/* Post content */}
                <div className="bg-muted/40 rounded-lg p-4 mb-3">
                  <pre className="whitespace-pre-wrap text-sm font-sans leading-relaxed">
                    {isExpanded || !needsTruncation ? post.postText : `${previewText}...`}
                  </pre>
                  {needsTruncation && (
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : post.id)}
                      className="text-primary text-xs font-medium mt-2 hover:underline"
                    >
                      {isExpanded ? "Show less" : "Show full post"}
                    </button>
                  )}
                </div>

                {/* Hashtags */}
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {post.hashtags.map((tag) => (
                    <span key={tag} className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                      #{tag}
                    </span>
                  ))}
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between">
                  <Button
                    size="sm"
                    onClick={() => copyToClipboard(post)}
                    className="gap-2"
                  >
                    {copiedId === post.id ? (
                      <><Check className="w-4 h-4" /> Copied!</>
                    ) : (
                      <><Copy className="w-4 h-4" /> Copy to Clipboard</>
                    )}
                  </Button>
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-20 bg-muted rounded-full overflow-hidden" title={`${post.characterCount}/3000 characters`}>
                      <div
                        className={cn(
                          "h-full rounded-full transition-all",
                          post.characterCount > 2700 ? "bg-amber-500" : "bg-emerald-500"
                        )}
                        style={{ width: `${Math.min((post.characterCount / 3000) * 100, 100)}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-muted-foreground">{Math.round((post.characterCount / 3000) * 100)}%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {posts.length === 0 && (
        <div className="text-center py-16">
          <Linkedin className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No content available yet.</p>
        </div>
      )}
    </div>
  );
}
