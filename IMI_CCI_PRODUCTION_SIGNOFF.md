# IMI CCI-Style Production Signoff

Date: 2026-05-29

## Final Status

Production release is complete for the IMI CCI-style severe-service demo work.

This is an IMI CCI-style demo account only. It is not an official IMI implementation and does not use IMI logos, trademarks, or partnership claims.

## Git Commits

- `a08966a` - Add IMI CCI severe-service demo data
- `1769115` - Add severe-service control valve landing page
- `796e6eb` - Add IMI CCI executive sales pack

Pushed to `origin/main`.

## Production Deployment

- Production domain: https://winsproposal.com
- Severe-service landing page: https://winsproposal.com/solutions/severe-service-control-valves
- Vercel production aliases: `https://winsproposal.com`, `https://www.winsproposal.com`, `https://winsproposal.vercel.app`
- Latest observed ready immutable deployment during verification: https://winsproposal-e9q70ovee-mohans-projects-1e3437ac.vercel.app

Note: Vercel creates a new immutable deployment URL on each production push. The canonical demo URLs are the production aliases above.

## Build Verification

- `npm run build`: passed.
- Production route `/solutions/severe-service-control-valves` is present in the build output.
- PDF and DOCX export routes compiled successfully.

## Live Verification

- `https://winsproposal.com`: HTTP 200.
- `https://winsproposal.com/solutions/severe-service-control-valves`: HTTP 200.
- `https://winsproposal.com/login`: HTTP 200.
- CCI demo login API: HTTP 200 for `proposal.director@cci-demo.winsproposal.local`.
- Authenticated CCI protected data: proposal and RFP visible for Proposal Director.
- DOCX export: HTTP 200, content type `application/vnd.openxmlformats-officedocument.wordprocessingml.document`, valid ZIP/DOCX signature.
- PDF export: HTTP 200, content type `application/pdf`, valid `%PDF` signature.
- Existing valve demo data: FlowServe proposal manager login works and existing API 600 refinery proposal is visible.
- Existing pump demo data: AquaDyn proposal manager login works and existing municipal pumping proposal is visible.
- Existing EPC demo data: Zenith proposal manager login works and existing petrochemical EPC proposal is visible.

Browser automation note: in-app browser verification could not be used because the local browser runtime failed to start due to a user-level Node ESM configuration. Production verification was completed through direct authenticated HTTP checks instead.

## Demo Seed Command

The IMI CCI-style seed is opt-in only:

```bash
ENABLE_IMI_CCI_DEMO_SEED=true npm run seed:imi-cci-demo
```

Safety checks:

- Stable demo-only IDs.
- Demo-only emails under `@cci-demo.winsproposal.local`.
- Upsert-only behavior.
- No delete or truncate operations.
- Script exits unless `ENABLE_IMI_CCI_DEMO_SEED=true` is set.

## Demo Organization

Organization: CCI Severe Service Solutions

Industry: Severe-Service Control Valves / Flow Control

Business focus:

- LNG
- Oil & Gas
- Refinery
- Petrochemical
- Power
- Hydrogen
- Process industries
- Severe-service control valves
- Compressor recycle valves
- Steam conditioning valves
- Anti-surge applications

## Demo Users

Password for all users: `Demo@12345`

- Ananya Rao, VP Business Development, `vp.business.development@cci-demo.winsproposal.local`
- Vikram Menon, Proposal Director, `proposal.director@cci-demo.winsproposal.local`
- Meera Krishnan, Senior Proposal Engineer, `senior.proposal.engineer@cci-demo.winsproposal.local`
- Rohan Iyer, Valve Application Engineer, `valve.application.engineer@cci-demo.winsproposal.local`
- Priya Nair, Compliance Coordinator, `compliance.coordinator@cci-demo.winsproposal.local`
- Arjun Shah, Engineering Manager, `engineering.manager@cci-demo.winsproposal.local`

## Seeded RFPs

- LNG Compressor Recycle Valve Package
- Refinery Severe-Service Control Valve Package
- Hydrogen Process Control Valve Package
- Steam Conditioning Valve Package

## Seeded Proposal Intelligence

Each seeded proposal includes:

- Executive Summary
- Application-specific visual section
- Engineering Basis
- Proposal-Stage Engineering Intelligence
- Preliminary Engineering Calculation Summary
- Compliance Matrix
- Risk / Deviations
- Workflow / Approval
- Executive Dashboard
- Compliance checklist
- TBE responses

All proposal-stage engineering sections include this required disclaimer:

> Preliminary proposal-stage engineering estimate. Final sizing/design must be validated by qualified engineers using company-approved tools and standards.

## Remaining Risks

- Export verification used `includeDiagrams=false` to validate PDF/DOCX route health and file generation quickly. Diagram-inclusive export should be spot-checked visually before a high-stakes live demo.
- Engineering content is demo-safe and proposal-stage only. It must not be presented as certified sizing or final design.
- The in-app browser runtime issue is local to the verification environment and should be corrected separately if visual browser automation is needed later.
- Untracked pre-existing files remain outside this release: `DEMO_DATA_AND_PILOT_FLOW.md`, `DEMO_ENVIRONMENT_SIGNOFF.md`, `DIAGRAM_TYPE_SELECTION_FIX.md`, and `tmp_export_review/`.
