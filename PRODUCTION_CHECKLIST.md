# WinsProposal Production Checklist

## Verified

- GitHub repository exists: `mohan69/winsproposal`.
- Vercel project exists: `winsproposal`.
- Fresh Neon database schema migration has been applied.
- Vercel production deployment builds successfully.
- Public Vercel deployment access returns HTTP 200.
- Public verification passed:

```bash
npm run verify:production -- https://winsproposal-31a25dfh4-mohans-projects-1e3437ac.vercel.app
```

## Before DNS Cutover

- Confirm `AZURE_STORAGE_CONNECTION_STRING`, `AZURE_STORAGE_CONTAINER_NAME`, and `AZURE_STORAGE_ACCOUNT_NAME` are added to Vercel production env vars.
- Confirm Azure Blob CORS allows `https://winsproposal.com` and `https://www.winsproposal.com`.
- Add `winsproposal.com` and `www.winsproposal.com` to the Vercel project.
- Confirm Vercel Authentication remains disabled for production/public access.
- Confirm `NEXTAUTH_URL` is `https://winsproposal.com`.
- Lower DNS TTL if possible.

## DNS Cutover

Follow `DNS_CUTOVER.md`.

## After DNS Cutover

- Run:

```bash
npm run verify:production -- https://winsproposal.com
```

- Smoke test auth, dashboard access, upload, proposal generation, approval workflow, PDF export, and DOCX export.
- Rotate the Neon password after production is stable.
- Keep Abacus live until Vercel production is verified.

## Known Follow-Ups

- Vercel GitHub auto-deploy is not connected yet because Vercel needs a GitHub Login Connection.
- Runtime AI/PDF/email paths still depend on transitional Abacus environment variables.
- npm reports 17 dependency vulnerabilities; handle dependency hardening separately.
