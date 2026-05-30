# Drawing Intelligence Engine

Phase 1 adds deterministic proposal-stage drawing intelligence for severe-service control valve proposals. It converts RFP-derived engineering objects and proposal artifacts into structured drawing packages that can be rendered in the live proposal page, PDF export, and DOCX export.

## Drawing Model

Core module: `lib/drawing-intelligence.ts`

The engine returns `DrawingPackage` objects with:

- `proposalId`, `applicationType`, `drawingType`, `title`, `subtitle`
- `disclaimer`
- `symbols`, `connectors`, `annotations`
- `standardsAwareness`
- `titleBlock`, `revisionBlock`
- `tagsUsed`, `engineeringReviewNotes`, `reviewStatus`, `exportIncluded`

Every drawing is labeled:

> Proposal-stage technical drawing. Not for construction. Final engineering drawing/design must be validated by qualified engineers using company-approved tools and applicable licensed standards.

Default review status is:

`Generated - Engineering review required - Not for construction`

## Symbol Library

Core module: `lib/drawing-symbols.ts`

The reusable symbol library includes proposal-grade symbols for process boundaries, process flow lines, severe-service control valves, actuators, positioners, solenoids, boosters, airsets, limit switches, controllers, instrument and pneumatic signal lines, hold points, MDR packages, material certificates, and test reports.

Symbols are labeled as:

- Proposal-grade symbol
- P&ID-lite symbol
- PFD-style symbol

These are consistent proposal symbols only. They are not certified standard symbols.

## Supported Drawing Types

- `pfd_style_flow`
- `pid_lite_control_loop`
- `valve_package_schematic`
- `actuator_accessory_schematic`
- `material_traceability_workflow`
- `inspection_test_workflow`
- `risk_review_flow`
- `delivery_schedule`

Phase 1 generates application-specific packages for:

- Hydrogen Process Control / Export Header
- LNG Compressor Recycle / Anti-Surge
- Refinery Severe-Service Control Valve
- Steam Conditioning Valve

## Standards-Awareness Approach

The engine includes careful standards-awareness notes without claiming final compliance:

- ISA 75.01 / IEC 60534 sizing review awareness
- ASME B16.34 pressure-temperature rating review awareness
- API / project-specific test requirement awareness
- NACE MR0175 / ISO 15156 awareness where applicable
- Project ITP / QAP / MDR documentation review

Language is intentionally limited to awareness, review basis, project confirmation required, final validation required, and licensed standard validation required.

## Proposal-Stage Boundary

Generated outputs are not certified engineering drawings, construction drawings, final sizing records, or final design documents. They are demo-safe proposal-stage visuals intended to help commercial and application engineering teams explain package scope, control loops, risks, documentation workflows, and validation dependencies.

Final design, drawing release, sizing, material selection, testing, and compliance disposition must be validated by qualified engineers using company-approved tools and applicable licensed standards.

## Export Behavior

The integration path is intentionally single-model:

1. Proposal sections call `buildEngineeringArtifact(...)` in `lib/engineering-artifacts.ts`.
2. The "Drawings and Technical Visuals" section returns a `drawing_package` artifact with `drawingPackages` from `buildDrawingPackages(...)`.
3. Live UI renders those packages with `components/engineering-drawing.tsx`.
4. PDF export calls `renderArtifactForPdf(...)`, which renders each `DrawingPackage` with `renderDrawingPackageHtml(...)`.
5. DOCX export calls `buildDocxArtifactBlocks(...)`, which renders the same `DrawingPackage` data as structured drawing tables/cards.

Live proposal page:

- Uses `components/engineering-drawing.tsx`
- Renders drawing cards inline under "Drawings and Technical Visuals"
- Shows preview, drawing type, review status, tags, notes, standards-awareness notes, and proposal-stage disclaimer
- Suppresses legacy manual Mermaid/artifact visual controls when a structured engineering artifact is available

PDF export:

- Uses the same `DrawingPackage` model through `renderDrawingPackageHtml`
- Renders SVG/HTML drawing blocks with title block, symbols, connectors, annotations, notes, and disclaimer
- Drawing blocks are marked to avoid orphaned headers where the PDF engine supports page-break control
- Severe-service exports do not render the legacy generic PDF diagram fallback when a section has no structured artifact

DOCX export:

- Uses the same `DrawingPackage` model
- Renders a structured drawing table/card with title, drawing type, status, disclaimer, symbol layout, tags, review notes, and standards-awareness notes
- Severe-service DOCX export does not fall back to generic native diagrams when no structured artifact exists

## Legacy Fallback Removal

Phase 1 export integration removes the old drawing-section fallback paths that produced generic value-chain diagrams such as customer requirement, package, interface, controls/QA, and integrated-offer flows. Severe-service PDF and DOCX exports now render structured engineering artifacts only; when no structured artifact is available, the legacy generic diagram is skipped rather than inserted.

The generic `pfd_style_flow` and `pid_style_control_loop` section classifiers were also removed from process-condition and engineering-basis sections so export output does not show title-cased placeholder labels as structured artifact tables. True PFD-style and P&ID-lite outputs now come from `DrawingPackage` objects in the drawing engine.

## Verification Assertions

`npm run verify:severe-service-demo` validates the deterministic drawing model and severe-service process values.

When `VERIFY_LIVE_EXPORTS=true` is set, the script generates fresh Hydrogen and LNG proposals, exports PDF and DOCX, extracts text from the produced files, and fails if legacy fallback strings appear. It also asserts required drawing text:

- Hydrogen: Hydrogen Service System Topology, P&ID-lite Control Loop, Valve Package Schematic, Material Traceability / MDR Workflow, proposal-stage disclaimer, and Not for construction.
- LNG: Compressor Recycle / Anti-Surge Architecture, P&ID-lite Anti-Surge Control Loop, Valve Package Schematic, Acoustic / Noise Review Flow, proposal-stage disclaimer, and Not for construction.

The verifier also checks canonical demo process values for Hydrogen and LNG so known seeded inputs do not regress to `TBD`.

## Limitations

- Phase 1 drawing geometry is deterministic and template-driven, not CAD-authored.
- Symbols are proposal-grade approximations, not licensed standard symbol reproductions.
- No certified ASME/API/ISA/IEC compliance is claimed.
- No DXF, DWG, Visio, or CAD-native export is included yet.
- No company-specific valve sizing tool integration is included yet.
- No engineer approval persistence workflow is included yet; review status is generated in the drawing model.

## Roadmap

- Import customer P&ID templates
- Import company valve symbol library
- Export SVG/DXF
- Integrate with AutoCAD, BricsCAD, and Visio
- Connect to company-approved valve sizing tools
- Add standards/license-aware rules engine
- Add engineer approval workflow with persisted review states
- Add drawing revision routing and approval history
- Add customer clarification loops tied to missing process data
