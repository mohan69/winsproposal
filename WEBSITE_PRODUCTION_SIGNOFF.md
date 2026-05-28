# Website Production Signoff

Date: 2026-05-28

## Deployment

- Commit: `94691ed345edd33f0d0f00ccdf4c4fa26575433e`
- Message: `Improve enterprise landing page positioning`
- Vercel deployment: `dpl_GsMMW5tBzHfjAwQjVVVj8gk4xVaL`
- Production URL: `https://winsproposal-8gjld6koz-mohans-projects-1e3437ac.vercel.app`
- Production alias: `https://www.winsproposal.com`

## Build Verification

- `npm run build`: passed
- Vercel production build: passed

## Production Verification

Checked:

- `https://winsproposal.com`
- `https://www.winsproposal.com`

Results:

- Apex domain redirects to `https://www.winsproposal.com/`.
- `https://www.winsproposal.com/` returns `200 OK`.
- Existing production verification script passed for both domains.
- Next.js production bundles passed existing safety checks.

## Landing Page Checks

Verified on production:

- New hero headline is present: `Industrial Revenue Intelligence Platform`
- KPI strip is visible, including `50%`
- Before/After section is present: `From Manual Bid Chaos to Measurable Proposal Operations`
- AI-assisted technical visualization section is present
- Knowledge Vault section is present
- Executive dashboard section is present

## Auth and App Route Checks

Verified route behavior:

- `/login`: `200 OK`
- `/signup`: `200 OK`
- `/proposals`: redirects to `/login?callbackUrl=%2Fproposals`
- `/upload-rfp`: redirects to `/login?callbackUrl=%2Fupload-rfp`
- `/vault`: redirects to `/login?callbackUrl=%2Fvault`
- `/templates`: redirects to `/login?callbackUrl=%2Ftemplates`
- `/settings`: redirects to `/login?callbackUrl=%2Fsettings`
- `/team`: redirects to `/login?callbackUrl=%2Fteam`

Conclusion: production deployment is verified. Auth-protected app routes remain protected and reachable through the login flow.
