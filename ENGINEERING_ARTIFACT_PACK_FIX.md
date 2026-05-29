# Engineering Artifact Pack Fix

## Purpose

This update moves severe-service proposal generation from section prose plus generic diagrams to a proposal-stage engineering pack. The target workflow is:

1. User uploads or selects an RFP.
2. WinsProposal runs RFP Intelligence.
3. The system infers template, application, valve/service type, standards, line items, risks, proposal structure, and required engineering artifacts.
4. User reviews the System Inference Summary.
5. User clicks Accept & Generate.
6. Manual template/type override remains available only in Advanced Override.
7. The generated proposal includes structured engineering artifacts for review, export, and management presentation.

All engineering outputs remain proposal-stage intelligence only.

Required disclaimer:

> Preliminary proposal-stage engineering estimate. Final sizing/design must be validated by qualified engineers using company-approved tools and standards.

## Inference Behavior

The severe-service classifier evaluates RFP title, summary, line items, process conditions, technical specifications, compliance requirements, standards, and engineering review points.

Expected mappings:

- Hydrogen Process Control Valve Package -> Hydrogen Process Control / Export Header Control
- LNG Compressor Recycle Valve Package -> LNG Compressor Recycle / Anti-Surge
- Refinery Severe-Service Control Valve Package -> Refinery Severe-Service
- Steam Conditioning Valve Package -> Steam Conditioning

Hydrogen signals are prioritized ahead of refinery signals so hydrogen RFPs with severe-service, NACE, QA/QC, or high-pressure wording do not fall into refinery classification.

## Artifact Model

The artifact layer is implemented without a schema migration. Artifacts are deterministically built from:

- proposalId
- sectionId
- section title
- inferred application/template metadata
- source RFP extracted data

Supported artifact types:

- datasheet_summary
- calculation_summary
- drawing_package
- pfd_style_flow
- pid_style_control_loop
- valve_assembly_architecture
- actuator_accessory_block
- material_compatibility_matrix
- inspection_test_plan
- tbe_matrix
- deviation_register
- risk_register
- qa_dossier_workflow
- delivery_schedule
- compliance_matrix
- kpi_dashboard
- scope_breakdown

Each artifact includes:

- artifactType
- applicationType
- sourceRfpReferences
- structured payload tables/visuals
- renderedLayoutType
- proposal-stage disclaimer where applicable

## Datasheet Logic

The Datasheet Summary is now tag-specific and driven by RFP line items.

Hydrogen rows support:

- HV-H2-3101A/B/C/D
- FV-H2-3150A/B
- PV-H2-3190
- DOC-H2

Hydrogen columns:

- Tag / Ref
- Item
- Qty
- Size / Class
- Service
- Fluid
- Inlet Pressure
- Outlet Pressure
- Temperature
- Leakage Class
- Valve Configuration
- Actuator / Accessories
- Documentation
- Review Status

LNG rows support:

- XV-CRV-9101A/B/C
- ASP-9101A/B/C
- DOC-9101

LNG columns:

- Tag / Ref
- Item
- Qty
- Size / Class
- Service
- Flow Cases
- Response Requirement
- Valve Configuration
- Accessory Package
- Documentation
- Review Status

Datasheets render as native tables in:

- live proposal page
- PDF export
- DOCX export

They are no longer presented as generic TBE rows.

## Calculation Summary Logic

The Preliminary Engineering Calculation Summary is now structured into tables:

- Process inputs
- Assumptions and missing data
- Pressure-drop/risk flags
- Standards basis

Hydrogen risk flags include:

- hydrogen compatibility
- embrittlement screening
- leakage class feasibility
- material compatibility
- hazardous area accessory certification
- traceability dossier completeness

LNG compressor recycle risk flags include:

- high pressure drop
- choked-flow risk
- acoustic fatigue
- fast response / anti-surge duty
- actuator response assumptions
- gas composition missing
- outlet piping/noise data missing

The Cv/Kv field remains an indicative placeholder unless validated data and approved sizing tools are available.

## Drawing Package Logic

The Drawings and Technical Visuals section now produces multiple named proposal-grade visuals.

Hydrogen:

- Hydrogen service system topology
- Control valve + actuator/accessory architecture
- Material compatibility and traceability workflow
- Leakage class / sealing review flow
- Inspection and dossier workflow

LNG compressor recycle:

- Compressor recycle / anti-surge architecture
- Fast response control loop
- Severe-service trim selection flow
- Acoustic/noise risk review flow
- Inspection and test workflow

Refinery severe-service:

- Process pressure letdown flow
- Cavitation/flashing risk tree
- NACE/material compliance workflow
- Valve/trim/accessory architecture

Steam conditioning:

- Steam letdown/desuperheating arrangement
- Temperature control loop
- Noise attenuation review flow
- Thermal cycling risk workflow

The UI labels these as proposal-grade engineering artifacts and technical visuals, not Mermaid.

## Shared Live/Export Rendering

The shared helper is `lib/engineering-artifacts.ts`.

Core functions:

- classifySectionArtifactType()
- buildEngineeringArtifact()
- buildSectionArtifacts()
- artifactToMarkdown()
- renderArtifactForPdf()

The live proposal page, PDF export, and DOCX export all build artifacts from the same RFP payload and section metadata. Output format renderers differ, but the underlying artifact data is shared.

## Continuous Layout

The app remains a continuous proposal document.

PDF export now keeps the cover and TOC as separate pages, then lets proposal body sections flow continuously with natural page breaks. Artifact tables and visual cards use avoid-break styling where practical.

DOCX export keeps cover and TOC separation but no longer forces every proposal section onto a new page. Compliance and TBE annex-style sections may still start separately.

## Knowledge Vault Matching

Vault retrieval remains application-aware:

Hydrogen:

- hydrogen compatibility
- high-integrity sealing
- leakage class
- traceability
- material compatibility
- hazardous-area accessories
- embrittlement assumptions
- dossier workflow

LNG:

- compressor recycle
- anti-surge
- fast response
- severe-service trim
- acoustic fatigue
- noise/vibration
- actuator/accessory package
- inspection/test clauses

## Validation

Run:

```bash
npm run verify:severe-service-demo
```

For live generation and export verification:

```bash
$env:VERIFY_LIVE_EXPORTS="true"; npm run verify:severe-service-demo
```

The script checks:

- correct inferred Hydrogen and LNG template/application
- 18+ sections
- datasheet summary present
- calculation summary present
- drawing package present
- vault matching terms present
- no General template
- hydrogen is not refinery
- Scope and QA are not Gantt
- Datasheet uses tag-specific artifact rows
- PDF/DOCX export succeeds when live verification is enabled

## Known Limitations

- Artifacts are rebuilt deterministically from proposal/RFP data rather than stored as a new database table.
- Outputs are proposal-stage engineering artifacts, not certified final design deliverables.
- Drawing visuals are compact proposal-grade blocks, not CAD/P&ID files.
- Final sizing, acoustics, actuator dynamics, and materials must be validated by qualified engineers using company-approved tools and standards.

## Roadmap

- Persist artifact JSON per proposal section for audit history.
- Add source clause references at row/cell level.
- Add engineer approval workflow for datasheets, calculations, and deviations.
- Add optional formal paginated export mode for customer submissions that require one section per page.
