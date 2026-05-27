# WinsProposal Deployment Checklist

Use this checklist for every pilot-readiness publish.

## Local Gate

Run from `winsproposal/nextjs_space`:

```powershell
npm install
npx prisma generate
npm run build
```

Do not publish if the build fails.

## Publish

This workspace does not contain a Git remote, deployment CLI, or readable Abacus deployment config. Publish the latest workspace through the configured Abacus/deployment provider for:

- `https://winsproposal.com`
- `https://winsproposal.abacusai.app`

## Live Gate

After publish, run:

```powershell
npm run verify:live
powershell -ExecutionPolicy Bypass -File scripts/verify-live-publish.ps1 -BaseUrl https://winsproposal.abacusai.app
```

The live gate must pass before using the environment for enterprise pilot demos.

## Current Pilot Signals Checked

- The removed global Abacus AppLLM script is not present in public pages.
- Direct Draft/Final status toggle feedback is not present in loaded Next.js bundles.
- Removed automatic diagram generation UI path is not present in loaded Next.js bundles.

## Manual Smoke Check

- Sign in.
- Open `/proposals`.
- Confirm proposal list loads without client errors.
- Open one proposal.
- Confirm approval flow remains available.
- Confirm Draft/Final direct status controls are not visible.
- Export PDF and DOCX from a representative proposal.
