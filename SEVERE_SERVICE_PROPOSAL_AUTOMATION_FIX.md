# Severe-Service Proposal Automation Fix

## Purpose

This update makes severe-service control valve proposal generation behave as an automated engineering proposal intelligence workflow. The intended user path is now:

1. Upload an RFP.
2. Review system-generated RFP Intelligence.
3. Accept and generate the proposal.
4. Use advanced override only when a proposal owner intentionally wants to force a legacy template/subtype.

The workflow is proposal-stage only. It does not claim certified final sizing or final engineering design.

## Automatic Classification Logic

The shared classifier lives in `lib/severe-service-intelligence.ts` and evaluates the RFP title, summary, line items, process conditions, technical requirements, compliance clauses, standards, and engineering review points.

Classification outputs include:

- Industry
- Equipment category
- Valve/service type
- Application
- Service type
- Package type
- Recommended template
- Standards detected
- Key risks
- Recommended sections
- Recommended visuals/drawings
- Recommended engineering outputs
- Vault retrieval terms
- TBE tags
- Compliance checklist items

Hydrogen signals are intentionally prioritized before refinery signals so hydrogen packages containing pressure-drop, NACE, QA/QC, or severe-service language are not misclassified as refinery valves. Expected mappings are:

- Hydrogen Process Control Valve Package -> Hydrogen Process Control / Export Header Control
- LNG Compressor Recycle Valve Package -> LNG Compressor Recycle / Anti-Surge
- Refinery Severe-Service Control Valve Package -> Refinery Severe-Service
- Steam Conditioning Valve Package -> Steam Conditioning

## Internal Template Family

The severe-service template family is internal automation logic, not a mandatory user dropdown:

- Severe-Service Control Valve Proposal
- LNG Compressor Recycle / Anti-Surge Proposal
- Hydrogen Process Control Valve Proposal
- Refinery Severe-Service Control Valve Proposal
- Steam Conditioning Valve Proposal

These templates drive section structure, vault retrieval terms, compliance checklist items, TBE tags, recommended visuals, and cover metadata.

## Section Generation Rules

Severe-service proposals are normalized to 18 professional sections:

1. Executive Summary
2. Project Background / Opportunity Context
3. Scope of Supply / Line Items
4. Process Conditions / Service Conditions
5. Technical Specification Response
6. Engineering Basis
7. Preliminary Engineering Calculation Summary
8. Valve Configuration / Trim / Actuator / Accessories
9. Datasheet Summary
10. Compliance Matrix
11. Technical Bid Evaluation Summary
12. Inspection and Testing Plan
13. QA/QC and Documentation Plan
14. Drawings and Technical Visuals
15. Deviations / Clarifications
16. Risk Assessment
17. Project Timeline & Delivery
18. Executive Dashboard Snapshot

If the language model omits or under-generates a required severe-service section, `ensureSevereServiceSections` fills the gap with professional proposal-stage content derived from the inferred application and extracted RFP data.

## Engineering Calculation Behavior

The Preliminary Engineering Calculation Summary includes:

- Fluid/service
- Inlet pressure
- Outlet pressure
- Pressure-drop severity
- Temperature
- Leakage class
- Indicative Cv/Kv placeholder when final sizing is not safe
- Risk flags
- Standards awareness
- Validation checklist

Required disclaimer:

> Preliminary proposal-stage engineering estimate. Final sizing/design must be validated by qualified engineers using company-approved tools and standards.

The system uses careful terms such as indicative, proposal-stage, requires engineer validation, and not certified final sizing.

## Datasheet Behavior

The Datasheet Summary section builds a proposal-stage tag table from parsed line items and process conditions. For demo RFPs it supports examples such as:

- HV-H2-3101A/B/C/D
- FV-H2-3150A/B
- PV-H2-3190
- DOC-H2
- XV-CRV-9101A/B/C
- ASP-9101A/B/C
- DOC-9101

Fields include tag/ref, item description, quantity, size/class, service, fluid, inlet/outlet pressure, temperature, leakage class, and review status.

## Visual and Drawing Selection Rules

Diagram selection is section-aware via `getBestVisualizationType` in `lib/visualization-service.ts`.

Key defaults:

- Executive Summary -> value chain
- Project Background -> value chain/opportunity map
- Scope of Supply / Line Items -> architecture/package breakdown
- Process Conditions -> process flow/service topology
- Technical Specification Response -> engineering dependency
- Engineering Basis -> engineering dependency
- Preliminary Engineering Calculation Summary -> engineering dependency/validation workflow
- Valve Configuration / Trim / Actuator / Accessories -> architecture
- Datasheet Summary -> TBE/matrix visual
- Compliance Matrix -> compliance flow
- TBE -> TBE matrix
- Inspection and Testing Plan -> inspection/test workflow
- QA/QC and Documentation Plan -> QA dossier workflow
- Drawings and Technical Visuals -> architecture/drawing gallery
- Deviations / Clarifications -> risk/deviation tree
- Risk Assessment -> risk tree
- Project Timeline & Delivery -> Gantt
- Executive Dashboard Snapshot -> KPI dashboard

Application-specific fallback visuals now cover hydrogen service topology, LNG compressor recycle/anti-surge architecture, steam conditioning arrangement, and refinery letdown/cavitation-flashing review.

## Live View vs Export Synchronization

The live proposal page, PDF export, DOCX export, and diagram endpoint all use deterministic section classification through the same visualization service. This avoids generating unrelated diagrams for the app view and exports.

The live detail page remains a continuous-scroll proposal document. Each section displays content, source status, selected visualization type, inline visual rendering, and secondary controls for diagram regeneration or type change.

## Knowledge Vault Retrieval

Severe-service vault retrieval now uses application-specific terms:

- Hydrogen: hydrogen compatibility, leakage class, high-integrity sealing, traceability, hazardous area accessories, material compatibility, embrittlement
- LNG: compressor recycle, anti-surge, fast response, acoustic fatigue, severe-service trim, actuator/accessory package
- Refinery: cavitation, flashing, NACE, erosion/corrosion, hydrotest, QA/QC
- Steam conditioning: desuperheating, pressure letdown, thermal cycling, noise attenuation, actuator controls

This improves demo proposals that previously showed zero vault-sourced contribution even when relevant demo knowledge existed.

## QA Check

Run:

```bash
npm run check:severe-service-demo
```

The deterministic check asserts:

- Hydrogen classifies as Hydrogen Process Control / Export Header Control, not refinery.
- LNG classifies as LNG Compressor Recycle / Anti-Surge and not General.
- Required sections include Datasheet Summary, Drawings and Technical Visuals, and Preliminary Engineering Calculation Summary.
- Vault retrieval terms are present.
- Scope and QA visuals are not Gantt.
- Project Timeline is Gantt.
- Datasheet Summary maps to a matrix-style visual.

## Known Limitations

- Final certified valve sizing is intentionally outside scope.
- Some fields depend on RFP extraction quality; missing process data is carried as TBD and routed to engineering validation.
- Diagram payloads are deterministic Mermaid/native export layouts, not CAD or certified P&ID deliverables.
- Manual override remains available for legacy templates, but the severe-service demo path is designed for automatic intelligence review and approval.

## Future Roadmap

- Persist selected visualization payloads per section for full audit history.
- Add richer RFP source citation spans per generated section.
- Add engineer approval state for calculation summary, datasheet summary, and deviations.
- Expand golden checks to exercise live PDF/DOCX binary export in CI with a seeded test database.
