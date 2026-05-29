# IMI CCI-Style Demo Signoff

## What Was Created

- Opt-in seed command for a dedicated IMI CCI-style severe-service control valve demo.
- Demo organization: CCI Severe Service Solutions.
- Six demo users under `@cci-demo.winsproposal.local`.
- Four sample RFP packages: LNG compressor recycle, refinery severe-service, hydrogen process, and steam conditioning.
- Proposal-stage engineering intelligence sections with required validation disclaimer.
- Preliminary Engineering Calculation Summary sections with standards awareness and careful proposal-stage wording.
- Knowledge Vault assets for severe-service valve proposal reuse.
- Technical Bid Evaluation sample rows for each package.
- Executive dashboard metrics embedded in each demo proposal.
- Demo walkthrough, management one-pager, pilot offer, and signoff documentation.

## Seed Command

Run only when intentionally enabling this demo:

```bash
ENABLE_IMI_CCI_DEMO_SEED=true npm run seed:imi-cci-demo
```

The seed is demo-only, uses stable demo IDs and demo-only emails, upserts records, does not delete or truncate data, and never runs automatically.

## Demo Users

Password for all users: `Demo@12345`

- Ananya Rao, VP Business Development, `vp.business.development@cci-demo.winsproposal.local`
- Vikram Menon, Proposal Director, `proposal.director@cci-demo.winsproposal.local`
- Meera Krishnan, Senior Proposal Engineer, `senior.proposal.engineer@cci-demo.winsproposal.local`
- Rohan Iyer, Valve Application Engineer, `valve.application.engineer@cci-demo.winsproposal.local`
- Priya Nair, Compliance Coordinator, `compliance.coordinator@cci-demo.winsproposal.local`
- Arjun Shah, Engineering Manager, `engineering.manager@cci-demo.winsproposal.local`

## Demo RFPs

- LNG Compressor Recycle Valve Package.
- Refinery Severe-Service Control Valve Package.
- Hydrogen Process Control Valve Package.
- Steam Conditioning Valve Package.

## Verification Results

- `npm run build`: passed on 2026-05-29 after clearing stale generated `.next` artifacts from a prior build.
- Optional seed execution: passed with `ENABLE_IMI_CCI_DEMO_SEED=true npm run seed:imi-cci-demo`.
- Database spot-check: organization created, 6 users, 4 RFPs, 4 proposals, 36 proposal sections, 16 Knowledge Vault text entries, and 40 TBE rows.
- Engineering disclaimer check: all Proposal-Stage Engineering Intelligence and Preliminary Engineering Calculation Summary sections include the required preliminary engineering disclaimer.
- Visual section check: seeded sections include Executive Summary, Engineering Basis, Preliminary Engineering Calculation Summary, Compliance Matrix, Risk / Deviations, LNG Compressor Recycle Architecture Diagram, Refinery Severe-Service Process Flow, Hydrogen Control Valve System Topology, Steam Conditioning Arrangement, Workflow / Approval, and Executive Dashboard.
- PDF export: route compiled successfully in production build; local HTTP export check was not completed because the started local Next server did not become responsive in the verification window.
- DOCX export: route compiled successfully in production build; local HTTP export check was not completed because the started local Next server did not become responsive in the verification window.

## Known Limitations

- Engineering values are proposal-stage examples and are not certified final sizing.
- Cv/Kv values are placeholders unless complete process data and approved sizing tools are used.
- Acoustic, cavitation, flashing, anti-surge response, hydrogen compatibility, NACE, and steam conditioning validation require qualified engineering review.
- This is an IMI CCI-style demo account only and is not an official IMI implementation.

## Next Recommended Improvements

- Add real customer-approved sample datasheet imports for richer extraction examples.
- Add screenshot-based demo QA after seeding into a reachable database.
- Add export fixtures for each proposal to validate PDF/DOCX visual differentiation automatically.
