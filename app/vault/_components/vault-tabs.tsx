"use client";

import { useState } from "react";
import { Archive, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { VaultClient } from "./vault-client";
import { TextEntriesClient } from "./text-entries-client";

export function VaultTabs() {
  const [activeTab, setActiveTab] = useState<"documents" | "text-entries">("documents");

  return (
    <div className="p-4 md:p-8 max-w-[1200px] mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="font-display text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-2">
          <Archive className="w-7 h-7 text-primary" />
          Knowledge Vault
        </h1>
        <p className="text-muted-foreground mt-1">
          Upload documents and manage reusable text snippets. AI extracts key sections for proposal generation.
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-border mb-6">
        <button
          onClick={() => setActiveTab("documents")}
          className={cn(
            "flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors -mb-px",
            activeTab === "documents"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
          )}
        >
          <Archive className="w-4 h-4" />
          Documents
        </button>
        <button
          onClick={() => setActiveTab("text-entries")}
          className={cn(
            "flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors -mb-px",
            activeTab === "text-entries"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
          )}
        >
          <FileText className="w-4 h-4" />
          Text Entries
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === "documents" ? <VaultClient /> : <TextEntriesClient />}
    </div>
  );
}
