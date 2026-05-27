# Pilot Readiness P1 Fixes

## Build Gate

- Confirmed the P0 branch passed `npm run build` before starting P1 work.

## Demo Load Reliability

- Removed proposal-detail auto-generation of Mermaid diagrams on page load.
- Diagram generation remains available through the existing manual per-section buttons.

## Export Reliability

- PDF and DOCX exports now skip fresh LLM diagram generation by default.
- Diagram-rich exports remain available at the API level with `?includeDiagrams=true`.
- Existing UI export buttons use the fast default path.

## Rendering/Deployment Overhead

- Removed the global `force-dynamic` setting from `app/layout.tsx`.
- Removed the unused global Abacus ChatLLM browser script from the root layout.
- Production build now prerenders eligible pages as static content.

## TBE Workflow Consistency

- The TBE panel now derives displayed evaluation tags from saved responses or the proposal template.
- TBE generation passes the proposal template to the backend.
- `getTbeTagsForTemplate` now accepts template IDs, template names, and subtype-enriched template names such as `Valve OEM Template — Gate Valve`.

## Validation

- `npm run build` completed successfully after P1 changes.
