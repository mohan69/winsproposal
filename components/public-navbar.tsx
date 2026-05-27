"use client";

import Link from "next/link";
import { useState } from "react";
import { useSession } from "next-auth/react";
import { Menu, X, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

export function PublicNavbar() {
  const [open, setOpen] = useState(false);
  const { data: session } = useSession() || {};

  return (
    <header className="sticky top-0 z-50 w-full bg-white/90 backdrop-blur-md border-b border-border">
      <div className="max-w-[1200px] mx-auto flex items-center justify-between px-4 h-16">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <Zap className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="font-display text-xl font-bold tracking-tight text-foreground">WinsProposal</span>
        </Link>

        <nav className="hidden md:flex items-center gap-6">
          <Link href="/#how-it-works" className="text-sm text-muted-foreground hover:text-foreground transition-colors">How It Works</Link>
          <Link href="/#outcomes" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Results</Link>
          <Link href="/samples" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Samples</Link>
          <Link href="/pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Pricing</Link>
          <Link href="/demo" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Book Demo</Link>
        </nav>

        <div className="hidden md:flex items-center gap-3">
          {session ? (
            <Link href="/vault">
              <Button>Dashboard</Button>
            </Link>
          ) : (
            <>
              <Link href="/login">
                <Button variant="ghost">Log In</Button>
              </Link>
              <Link href="/signup">
                <Button>Sign Up</Button>
              </Link>
            </>
          )}
        </div>

        <button className="md:hidden p-2" onClick={() => setOpen(!open)} aria-label="Toggle menu">
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {open && (
        <div className="md:hidden border-t border-border bg-white px-4 pb-4 space-y-3">
          <Link href="/#how-it-works" className="block py-2 text-sm" onClick={() => setOpen(false)}>How It Works</Link>
          <Link href="/#outcomes" className="block py-2 text-sm" onClick={() => setOpen(false)}>Results</Link>
          <Link href="/samples" className="block py-2 text-sm" onClick={() => setOpen(false)}>Samples</Link>
          <Link href="/pricing" className="block py-2 text-sm" onClick={() => setOpen(false)}>Pricing</Link>
          <Link href="/demo" className="block py-2 text-sm" onClick={() => setOpen(false)}>Book Demo</Link>
          <div className="flex gap-2 pt-2">
            {session ? (
              <Link href="/vault" className="flex-1"><Button className="w-full">Dashboard</Button></Link>
            ) : (
              <>
                <Link href="/login" className="flex-1"><Button variant="outline" className="w-full">Log In</Button></Link>
                <Link href="/signup" className="flex-1"><Button className="w-full">Sign Up</Button></Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
