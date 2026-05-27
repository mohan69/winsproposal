"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Check, Zap, Crown, Building, ChevronDown, ChevronUp,
  Calculator, FileText, BarChart3, Target, GitBranch, Layers, X,
} from "lucide-react";
import { cn } from "@/lib/utils";

const tiers = [
  {
    name: "Starter",
    price: "₹50,000",
    period: "/month",
    description: "For small teams exploring AI-powered proposals with Go/No-Go intelligence",
    icon: Zap,
    highlight: false,
    features: [
      { text: "Up to 15 proposals/month", included: true },
      { text: "Go/No-Go Decision Matrix (8 universal questions)", included: true },
      { text: "1 user", included: true },
      { text: "Knowledge Vault (50 documents)", included: true },
      { text: "3 base industry templates (Valve, Pump, EPC)", included: true },
      { text: "Basic compliance checklists", included: true },
      { text: "Win Score per proposal", included: true },
      { text: "AI-generated diagrams (Flowchart, Gantt)", included: true },
      { text: "Email support", included: true },
      { text: "Sub-type specific templates", included: false },
      { text: "Industry-specific TBE tags (12-15 per sub-type)", included: false },
    ],
  },
  {
    name: "Professional",
    price: "₹75,000",
    period: "/month",
    description: "Full MOAT access — Sub-type templates, expanded TBE tags, and Go/No-Go with industry questions",
    icon: Crown,
    highlight: true,
    badge: "Most Popular",
    features: [
      { text: "Up to 40 proposals/month", included: true },
      { text: "Go/No-Go Matrix (8 universal + 2 industry-specific)", included: true },
      { text: "5 users", included: true },
      { text: "Knowledge Vault (200 documents)", included: true },
      { text: "All sub-type templates (Gate/Globe/Ball/Butterfly/Check + Centrifugal/PD/Submersible)", included: true },
      { text: "12-15 TBE tags per sub-type (vs 5-6 generic)", included: true },
      { text: "Expanded compliance checklists per sub-type", included: true },
      { text: "TBE Response Generator", included: true },
      { text: "AI-generated PFDs, Gantt charts, flowcharts, sequence diagrams", included: true },
      { text: "Advanced analytics & Win Score", included: true },
      { text: "Priority support", included: true },
      { text: "Custom branding", included: true },
    ],
  },
  {
    name: "Enterprise",
    price: "₹1,00,000",
    period: "/month",
    description: "Unlimited scale with custom templates, dedicated CSM, and on-premise deployment",
    icon: Building,
    highlight: false,
    features: [
      { text: "Unlimited proposals", included: true },
      { text: "Full Go/No-Go + custom scoring criteria", included: true },
      { text: "Unlimited users", included: true },
      { text: "Unlimited vault storage", included: true },
      { text: "All sub-type templates + custom templates", included: true },
      { text: "Custom TBE tags & compliance rules", included: true },
      { text: "All diagram types + custom diagram templates", included: true },
      { text: "Dedicated Customer Success Manager", included: true },
      { text: "Custom integrations & API access", included: true },
      { text: "SLA guarantee", included: true },
      { text: "On-premise deployment option", included: true },
      { text: "SSO/SAML authentication", included: true },
    ],
  },
];

const addons = [
  { name: "Extra Proposals", description: "Additional proposals beyond your plan limit", price: "₹2,500/proposal" },
  { name: "Additional Users", description: "Add more team members to your account", price: "₹5,000/user/month" },
  { name: "Custom Sub-Type Template", description: "Bespoke template for a niche product category", price: "₹15,000 one-time" },
];

const faqs = [
  {
    question: "How is WinsProposal different from Loopio, Responsive, or ChatGPT?",
    answer: "Generic tools treat all proposals the same. WinsProposal understands that a Gate valve proposal needs actuator torque calculations and fugitive emissions data (ISO 15848), while a Centrifugal pump proposal needs NPSH analysis and API 682 seal plans. Our sub-type-specific templates, 12-15 TBE tags per sub-type, and Go/No-Go Decision Matrix are capabilities no horizontal tool offers.",
  },
  {
    question: "What is the Go/No-Go Decision Matrix?",
    answer: "Before you spend hours creating a proposal, the Go/No-Go matrix asks 10 strategic questions (8 universal + 2 industry-specific) and produces a weighted score with a Bid / No-Bid / Conditional recommendation. It flags deal-breakers like payment risk, competition intensity, and technical capability gaps — so you only bid on RFPs you can actually win.",
  },
  {
    question: "What are sub-type specific templates?",
    answer: "Instead of one generic ‘Valve' template, WinsProposal has 5 valve sub-types (Gate, Globe, Ball, Butterfly, Check) and 3 pump sub-types (Centrifugal, Positive Displacement, Submersible). Each sub-type loads unique technical sections, compliance items, and TBE tags. For example, ON/OFF gate valves get actuator specs and fire-safe certification sections that control globe valves don't need.",
  },
  {
    question: "How does the pilot program work?",
    answer: "Start with the Starter plan at ₹50,000/month with a 1-month commitment. You get Go/No-Go scoring, 3 base templates, and 15 proposals. Upgrade to Professional anytime to unlock sub-type templates and expanded TBE tags. No long-term commitment required.",
  },
  {
    question: "What happens if I exceed my monthly proposal limit?",
    answer: "You can purchase additional proposals at ₹2,500 each, or upgrade to a higher plan. We'll notify you when you're approaching your limit.",
  },
  {
    question: "Is my data secure?",
    answer: "All data is encrypted at rest and in transit using AES-256 encryption. We use SOC 2 compliant infrastructure, and your proposals are never shared or used to train AI models. Enterprise plans offer on-premise deployment for maximum data control.",
  },
  {
    question: "What industries do you support?",
    answer: "We specialize in Valve Manufacturing (5 sub-types), Pump Manufacturing (3 sub-types), and EPC (Engineering, Procurement, Construction). Our templates, TBE tags, and compliance databases are built from thousands of real-world proposals in these industries.",
  },
  {
    question: "Do you offer annual billing discounts?",
    answer: "Yes! Annual billing saves you 15% compared to monthly billing. Contact our sales team to set up annual billing for any plan.",
  },
];

export function PricingContent() {
  const [proposalsPerMonth, setProposalsPerMonth] = useState(10);
  const [hoursPerProposal, setHoursPerProposal] = useState(8);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const hoursSaved = proposalsPerMonth * hoursPerProposal * 0.7;
  const hourlyRate = 2000;
  const moneySaved = hoursSaved * hourlyRate;
  const effectiveCostPerProposal = proposalsPerMonth > 0 ? Math.round(50000 / proposalsPerMonth) : 0;

  return (
    <div className="min-h-screen bg-background">
      {/* Pilot Offer Banner */}
      <div className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground">
        <div className="max-w-[1200px] mx-auto px-4 py-4 text-center">
          <p className="text-sm md:text-base font-medium">
            🚀 Start with a Pilot — <span className="font-bold">₹50,000/month</span>, 15 proposals + Go/No-Go scoring. No long-term commitment.
          </p>
        </div>
      </div>

      {/* Header */}
      <div className="max-w-[1200px] mx-auto px-4 py-16 text-center">
        <Badge variant="secondary" className="mb-4">Pricing</Badge>
        <h1 className="font-display text-3xl md:text-5xl font-bold tracking-tight mb-4">
          Invest in Proposals That Actually Win
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Every tier includes Go/No-Go intelligence. Professional and above unlock sub-type specific templates with 12-15 TBE tags — the depth that makes evaluators choose you.
        </p>
      </div>

      {/* Pricing Tiers */}
      <div className="max-w-[1200px] mx-auto px-4 pb-16">
        <div className="grid md:grid-cols-3 gap-6">
          {tiers.map((tier) => {
            const Icon = tier.icon;
            return (
              <Card
                key={tier.name}
                className={cn(
                  "relative overflow-hidden transition-shadow hover:shadow-lg",
                  tier.highlight ? "border-2 border-primary shadow-lg scale-[1.02]" : "border shadow-md"
                )}
              >
                {tier.badge && (
                  <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-bl-lg">
                    {tier.badge}
                  </div>
                )}
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className={cn(
                      "w-10 h-10 rounded-lg flex items-center justify-center",
                      tier.highlight ? "bg-primary text-primary-foreground" : "bg-primary/10 text-primary"
                    )}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-display text-xl font-bold">{tier.name}</h3>
                    </div>
                  </div>

                  <div className="mb-4">
                    <span className="font-display text-3xl font-bold">{tier.price}</span>
                    <span className="text-muted-foreground">{tier.period}</span>
                  </div>

                  <p className="text-sm text-muted-foreground mb-6">{tier.description}</p>

                  <Link href="/demo#contact">
                    <Button className={cn("w-full mb-6")} variant={tier.highlight ? "default" : "outline"}>
                      Book Demo
                    </Button>
                  </Link>

                  <ul className="space-y-3">
                    {tier.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        {feature.included ? (
                          <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                        ) : (
                          <X className="w-4 h-4 text-muted-foreground/40 shrink-0 mt-0.5" />
                        )}
                        <span className={feature.included ? "" : "text-muted-foreground/60"}>{feature.text}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Feature Comparison Callout */}
      <div className="bg-muted/30">
        <div className="max-w-[1200px] mx-auto px-4 py-16">
          <div className="text-center mb-10">
            <h2 className="font-display text-2xl md:text-3xl font-bold tracking-tight mb-2">Why Professional Is Worth It</h2>
            <p className="text-muted-foreground">The jump from Starter to Professional unlocks the full MOAT.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: GitBranch, title: "Sub-Type Templates", starter: "3 base templates", pro: "8 sub-type templates (5 valve + 3 pump)", desc: "Gate, Globe, Ball, Butterfly, Check, Centrifugal, PD, Submersible — each with unique sections" },
              { icon: Layers, title: "TBE Tag Depth", starter: "5-6 generic tags", pro: "12-15 tags per sub-type", desc: "Fugitive emissions, fire-safe cert, actuator specs, NPSH analysis, seal plan compliance..." },
              { icon: Target, title: "Go/No-Go Depth", starter: "8 universal questions", pro: "8 + 2 industry-specific questions", desc: "Valve-specific: past valve experience, manufacturing capacity. Pump-specific: API 610 compliance history" },
            ].map((item, i) => (
              <Card key={i} className="shadow-sm">
                <CardContent className="p-5">
                  <item.icon className="w-5 h-5 text-primary mb-2" />
                  <h3 className="font-display font-semibold text-base mb-3">{item.title}</h3>
                  <div className="space-y-2 text-sm mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs bg-muted px-2 py-0.5 rounded font-medium">Starter</span>
                      <span className="text-muted-foreground">{item.starter}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded font-medium">Pro</span>
                      <span className="font-medium">{item.pro}</span>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Usage Add-ons */}
      <div className="max-w-[1200px] mx-auto px-4 py-16">
        <div className="text-center mb-10">
          <h2 className="font-display text-2xl md:text-3xl font-bold tracking-tight mb-2">Usage Add-ons</h2>
          <p className="text-muted-foreground">Need more? Extend your plan with flexible add-ons.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {addons.map((addon) => (
            <Card key={addon.name} className="shadow-sm">
              <CardContent className="p-5">
                <h3 className="font-display font-semibold text-lg mb-1">{addon.name}</h3>
                <p className="text-sm text-muted-foreground mb-3">{addon.description}</p>
                <p className="font-display font-bold text-primary">{addon.price}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* ROI Calculator */}
      <div className="bg-muted/30">
        <div className="max-w-[1200px] mx-auto px-4 py-16">
          <div className="text-center mb-10">
            <h2 className="font-display text-2xl md:text-3xl font-bold tracking-tight mb-2 flex items-center justify-center gap-2">
              <Calculator className="w-7 h-7 text-primary" />
              ROI Calculator
            </h2>
            <p className="text-muted-foreground">See how much time and money you save with Go/No-Go + sub-type-specific proposals.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
            <Card className="shadow-md">
              <CardContent className="p-6 space-y-6">
                <div>
                  <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-primary" />
                    Proposals per month
                  </label>
                  <input
                    type="range"
                    min={1}
                    max={100}
                    value={proposalsPerMonth}
                    onChange={(e) => setProposalsPerMonth(Number(e.target.value))}
                    className="w-full accent-primary"
                  />
                  <div className="flex justify-between text-sm text-muted-foreground mt-1">
                    <span>1</span>
                    <span className="font-bold text-foreground">{proposalsPerMonth}</span>
                    <span>100</span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-primary" />
                    Hours per proposal (currently)
                  </label>
                  <input
                    type="range"
                    min={1}
                    max={40}
                    value={hoursPerProposal}
                    onChange={(e) => setHoursPerProposal(Number(e.target.value))}
                    className="w-full accent-primary"
                  />
                  <div className="flex justify-between text-sm text-muted-foreground mt-1">
                    <span>1h</span>
                    <span className="font-bold text-foreground">{hoursPerProposal}h</span>
                    <span>40h</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-md border-emerald-200 bg-emerald-50/50">
              <CardContent className="p-6 space-y-4">
                <h3 className="font-display font-semibold text-lg text-emerald-800">Your Savings</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-emerald-700">Hours saved monthly</span>
                    <span className="font-display text-2xl font-bold text-emerald-800">{Math.round(hoursSaved)}h</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-emerald-700">Estimated cost savings</span>
                    <span className="font-display text-2xl font-bold text-emerald-800">₹{moneySaved.toLocaleString("en-IN")}</span>
                  </div>
                  <div className="border-t border-emerald-200 pt-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-emerald-700">Cost per proposal (Starter)</span>
                      <span className="font-display text-xl font-bold text-emerald-800">₹{effectiveCostPerProposal.toLocaleString("en-IN")}</span>
                    </div>
                    <p className="text-xs text-emerald-600 mt-1">
                      vs. ~₹{(hoursPerProposal * hourlyRate).toLocaleString("en-IN")} per proposal without WinsProposal
                    </p>
                  </div>
                  <div className="bg-emerald-100 rounded-lg p-3 text-center">
                    <p className="text-sm font-medium text-emerald-800">
                      💰 ROI: <span className="font-bold text-lg">{Math.round((moneySaved / 50000) * 100)}%</span> return on investment
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* FAQ */}
      <div className="max-w-[800px] mx-auto px-4 py-16">
        <div className="text-center mb-10">
          <h2 className="font-display text-2xl md:text-3xl font-bold tracking-tight mb-2">Frequently Asked Questions</h2>
          <p className="text-muted-foreground">Everything you need to know about WinsProposal's MOAT features and pricing.</p>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, idx) => (
            <Card key={idx} className="shadow-sm">
              <button
                className="w-full p-4 flex items-center justify-between text-left"
                onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
              >
                <span className="font-medium text-sm pr-4">{faq.question}</span>
                {openFaq === idx ? (
                  <ChevronUp className="w-4 h-4 shrink-0 text-muted-foreground" />
                ) : (
                  <ChevronDown className="w-4 h-4 shrink-0 text-muted-foreground" />
                )}
              </button>
              {openFaq === idx && (
                <div className="px-4 pb-4">
                  <p className="text-sm text-muted-foreground leading-relaxed">{faq.answer}</p>
                </div>
              )}
            </Card>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="bg-muted/30">
        <div className="max-w-[1200px] mx-auto px-4 py-16 text-center">
          <h2 className="font-display text-2xl md:text-3xl font-bold tracking-tight mb-4">
            Ready to Win More Proposals?
          </h2>
          <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
            Start your pilot today — Go/No-Go scoring from day one. Upgrade to unlock the full MOAT.
          </p>
          <Link href="/demo#contact">
            <Button size="lg" className="px-8">
              Book a Demo
            </Button>
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-border bg-card">
        <div className="max-w-[1200px] mx-auto px-4 py-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">&copy; 2026 WinsProposal. All rights reserved.</p>
          <div className="flex gap-6">
            <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">Home</Link>
            <Link href="/samples" className="text-sm text-muted-foreground hover:text-foreground">Samples</Link>
            <Link href="/demo" className="text-sm text-muted-foreground hover:text-foreground">Book Demo</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
