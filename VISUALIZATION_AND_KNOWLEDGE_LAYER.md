# Visualization & Knowledge Demo Layer

Phase: 1 demo-focused implementation

## Purpose

This layer adds professional visual and knowledge demonstrations for EPC, valves, pumps, refinery systems, and industrial automation proposal workflows without changing the core proposal generation architecture.

## Architecture

### Visualization Service

Primary module:

- `lib/visualization-service.ts`

The service provides a reusable abstraction for:

- supported visualization types
- AI-assisted Mermaid generation
- Mermaid sanitization
- deterministic fallback diagrams
- export-safe Mermaid image URLs through `mermaid.ink`

The service is intentionally small. It keeps Phase 1 focused on demo value and reuses the existing Mermaid dependency instead of introducing a heavier diagram engine.

### Proposal Preview

Primary UI:

- `app/proposals/[id]/_components/proposal-detail-client.tsx`

Proposal sections can generate optional diagrams for:

- architecture diagrams
- process flows
- workflow diagrams
- compliance flows
- proposal lifecycle diagrams
- Gantt/project schedule diagrams
- engineering dependency flows

Generated diagrams render in the proposal detail screen through:

- `components/mermaid-diagram.tsx`

Mermaid rendering uses strict security mode for safer previews.

### Export Compatibility

Existing export endpoints remain compatible:

- `app/api/proposals/[id]/export-pdf/route.ts`
- `app/api/proposals/[id]/export-docx/route.ts`

Diagrams are included only when requested with:

- `?includeDiagrams=true`

The proposal detail page exposes a checkbox to include generated diagrams in PDF and DOCX exports. By default, exports remain text-only for speed and stability.

## Supported Visualization Types

| Type | Use Case |
| --- | --- |
| Architecture | EPC system architecture, automation topology, package interfaces |
| Process Flow | Valve/pump manufacturing, refinery process, construction sequence |
| Workflow | Proposal review, technical response, procurement, QA/QC workflows |
| Compliance Flow | API/ISO compliance mapping, deviations, inspection gates |
| Proposal Lifecycle | RFP intake through approval, export, and submission |
| Gantt / Schedule | Proposal and project timelines, milestones, phase handoffs |
| Engineering Dependency | Datasheets, P&IDs, drawings, vendor data, calculations |

## Demo Knowledge Assets

Seed script:

- `scripts/seed.ts`

Demo knowledge assets are seeded as `VaultTextEntry` records for the demo user. They cover:

- historical proposal responses
- technical clauses
- API 600 examples
- API 610 examples
- valve technical specifications
- pump technical specifications
- compliance templates
- deviation examples
- EPC engineering workflow templates
- industrial automation FAT/SAT workflows

The same asset set is also surfaced in the Templates page demo layer through:

- `components/demo-knowledge-assets.tsx`
- `lib/demo-knowledge.ts`

The seed remains non-destructive and uses `upsert`.

## Demo Templates

Added professional template coverage in:

- `lib/templates.ts`

New demo templates:

- EPC Proposal Workflow Template
- Refinery Systems Template
- Pump Infrastructure Template
- Industrial Automation Systems Template
- Process Engineering Package Template

These are intentionally lightweight Phase 1 templates designed for credible demos and pilot conversations.

## Dashboard Demonstration

Demo UI components:

- `components/demo-kpi-dashboard.tsx`
- `components/visualization-demo-layer.tsx`

They are shown on the Templates page and include sample KPI visualizations for:

- proposal throughput
- compliance coverage
- engineering workload
- bid lifecycle
- proposal reuse metrics

The KPI data is static sample data for demonstration only.

## Stability Notes

- No database schema changes were introduced.
- No proposal workflow or approval workflow was redesigned.
- Diagram generation has deterministic fallbacks when AI generation is unavailable.
- PDF/DOCX diagrams remain opt-in to avoid slowing standard exports.
- Mermaid code is sanitized before preview and export image URL generation.

## Future Roadmap

Recommended future phases:

1. Persist generated diagrams per proposal section.
2. Add a first-class visualization library for non-Mermaid engineering diagrams.
3. Add editable diagram prompts and regenerate controls.
4. Add organization-specific diagram style themes.
5. Add server-side SVG/PNG rendering to remove dependency on `mermaid.ink`.
6. Expand demo knowledge into industry-specific sample vault packages.
