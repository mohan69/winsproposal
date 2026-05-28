# WinsProposal DNS Cutover Runbook

Do not start DNS cutover until public Vercel verification passes.

## Current Verified Vercel Deployment

- Vercel deployment URL: `https://winsproposal-31a25dfh4-mohans-projects-1e3437ac.vercel.app`
- Vercel project alias: `https://winsproposal-mohans-projects-1e3437ac.vercel.app`
- Public verification status: passed

Verification command:

```bash
npm run verify:production -- https://winsproposal-31a25dfh4-mohans-projects-1e3437ac.vercel.app
```

## Current DNS Observation

As of the last local check, both records resolve away from Vercel:

```text
winsproposal.com      -> 66.71.220.1
www.winsproposal.com  -> 66.71.220.1
```

## Pre-Cutover Checklist

- Vercel production deployment is public and returns HTTP 200.
- `npm run verify:production -- <vercel-url>` passes.
- Neon migration has been applied with `npm run prisma:migrate:deploy`.
- Vercel production env vars include:
  - `DATABASE_URL`
  - `NEXTAUTH_URL=https://winsproposal.com`
  - `NEXTAUTH_SECRET`
  - `AZURE_STORAGE_CONNECTION_STRING`
  - `AZURE_STORAGE_CONTAINER_NAME`
  - `AZURE_STORAGE_ACCOUNT_NAME`
  - transitional Abacus vars while those runtime dependencies remain
- Azure Blob CORS allows `https://winsproposal.com` and `https://www.winsproposal.com`.
- A rollback owner is available during cutover.
- DNS TTL is lowered before cutover if the DNS provider supports it.

## Add Domain In Vercel

In the Vercel project `winsproposal`, add:

```text
winsproposal.com
www.winsproposal.com
```

Keep `winsproposal.com` as the primary production domain.

## DNS Records

At the DNS provider, update records to Vercel:

```text
Type: A
Name: @
Value: 76.76.21.21

Type: CNAME
Name: www
Value: cname.vercel-dns.com
```

Remove conflicting A, AAAA, or CNAME records for `@` and `www`.

## Post-Cutover Verification

Wait for DNS propagation, then run:

```bash
nslookup winsproposal.com
nslookup www.winsproposal.com
npm run verify:production -- https://winsproposal.com
```

Manual smoke checks:

- Open `https://winsproposal.com`.
- Sign up or sign in.
- Confirm dashboard/proposals routes load after auth.
- Upload a small RFP and confirm Azure Blob upload succeeds.
- Generate or parse a proposal only after confirming transitional AI credentials are present.
- Export PDF and DOCX.
- Confirm no Vercel Authentication page appears.

## Rollback

If the Vercel production domain fails after cutover:

1. Restore previous DNS records for `winsproposal.com` and `www`.
2. Keep the Vercel deployment available for debugging.
3. Do not delete the Neon database.
4. Re-run verification against both the Vercel URL and restored production URL.

## After Successful Cutover

- Rotate the Neon database password because it was exposed during setup.
- Replace transitional Abacus AI/PDF/email integrations.
- Connect Vercel to GitHub for automatic deployments from `main`.
- Keep Abacus live only until `winsproposal.com` has been verified on Vercel.
