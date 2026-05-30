# Templates and Demo Center Cleanup

## What Moved

- Removed demo-only content from `/templates`.
- Moved the former visualization demo into `/demo-center` as **Drawing & Visualization Intelligence Demo**.
- Moved the former demo knowledge base into `/demo-center` as **Sample Knowledge Vault Assets**.
- Kept the existing demo data and rendering/export functionality intact.

## New Route Structure

- `/templates`
  - Enterprise proposal template library.
  - Focused on template families, section structures, compliance focus, TBE tags, recommended visuals, best-fit applications, and export readiness.

- `/demo-center`
  - Customer-facing demo workspace.
  - Includes Severe-Service Control Valve, LNG Compressor Recycle / Anti-Surge, Hydrogen Process Control, Drawing Intelligence, Knowledge Base Samples, KPI Dashboard, and Export Demo sections.

## Templates Page Purpose

`/templates` is now a clean product page for reusable proposal templates. It includes:

- Valve Templates
- Pump Templates
- EPC Templates
- Template descriptions
- Sections included
- Compliance checklist previews
- TBE tags previews
- Recommended drawings and visuals
- Best-fit industries and applications
- Use Template and Preview Template actions

Demo playground language, knowledge sample lists, KPI sample dashboards, and visualization demo controls are no longer rendered on this page.

## Demo Center Purpose

`/demo-center` is the proper home for guided demo content. It presents demo cards with business value and action buttons, then renders:

- Drawing & Visualization Intelligence Demo
- Sample Knowledge Vault Assets
- KPI Dashboard Demo
- Export Demo

Customer-facing drawing labels are used throughout the Demo Center, including PFD-style drawing, P&ID-lite control loop, valve package schematic, compliance matrix, TBE matrix, KPI dashboard, delivery schedule, and risk/deviation tree.

## Validation Results

- `npm run build`: passed.
- `npm run verify:severe-service-demo`: passed.
- `VERIFY_LIVE_EXPORTS=true npm run verify:severe-service-demo`: passed.
  - Generated live Hydrogen and LNG severe-service proposals.
  - Verified 18 sections for each generated proposal.
  - Produced PDF and DOCX export artifacts.
- Authenticated route check:
  - `/templates`: returned 200.
  - `/templates` no longer contains `Demo Knowledge Base`.
  - `/templates` no longer contains `Visualization Engine Demo`.
  - `/templates` shows `Proposal Template Library` and severe-service template content.
  - `/demo-center`: returned 200.
  - `/demo-center` shows Demo Center, Drawing & Visualization Intelligence Demo, and Sample Knowledge Vault Assets.
- Direct export endpoint check:
  - PDF export returned `200` with `application/pdf`.
  - DOCX export returned `200` with `application/vnd.openxmlformats-officedocument.wordprocessingml.document`.
