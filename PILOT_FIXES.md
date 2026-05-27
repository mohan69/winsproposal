# Pilot Readiness P0 Fixes

## Access Control

- Added ownership/organization checks before proposal section updates in `app/api/proposals/[id]/sections/route.ts`.
- Added ownership/organization checks before vault section updates and deletes in `app/api/vault/[id]/sections/route.ts`.
- Added ownership/organization checks before RFP parsing writes in `app/api/rfp/parse/route.ts`.
- Added ownership/organization checks before vault document processing writes in `app/api/vault/process/route.ts`.

## PDF/HTML Export Safety

- Updated `lib/pdf-template.ts` to escape user, vault, RFP, proposal, TBE, and AI-generated text before HTML rendering.
- Sanitized brand colors to strict hex values.
- Sanitized image URLs for organization logos and diagram URLs to `http`/`https` only.
- Preserved supported markdown formatting after escaping raw text.

## Approval Workflow

- Removed direct Draft/Final status toggles from `app/proposals/_components/proposals-client.tsx`.
- Removed direct Draft/Final status toggles from `app/proposals/[id]/_components/proposal-detail-client.tsx`.
- Preserved the existing submit/approve/reject workflow through `app/api/proposals/[id]/approval/route.ts`.

## Deployment Portability

- Removed the hardcoded Prisma client output path from `prisma/schema.prisma`.
- Re-enabled production build linting by removing `eslint.ignoreDuringBuilds` from `next.config.js`.
- Aligned ESLint dependencies with the Next 14 stack so `npm install` can resolve cleanly.
- Added/updated `package-lock.json` through `npm install`.

## Validation

- `npm install` completed successfully.
- `npx prisma generate` completed successfully and generated Prisma Client to `node_modules/@prisma/client`.
- `npm run build` completed successfully with linting and type checking enabled.
- Next.js printed an SWC lockfile patch warning during build; `npm install` was run again afterward as instructed by the warning.

## Notes

- npm reports existing dependency vulnerabilities: 1 low, 3 moderate, and 13 high. Broad dependency remediation was not run because it is outside the requested P0 scope.
- Prisma 6.7.0 warns that default client output will be deprecated in Prisma 7. This change intentionally keeps the current default portable output requested for this pilot pass.
