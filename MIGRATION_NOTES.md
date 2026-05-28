# Migration Notes

## Remaining Risks

- Database decision: start fresh on Neon unless confirmed real customer/proposal data exists in Abacus. Current demo/test data should not be migrated.
- Existing Abacus production data is not automatically migrated. Users, organizations, proposals, vault documents, RFP uploads, compliance checklists, TBE responses, and uploaded files need an explicit export/import plan.
- Uploaded files in Abacus storage must be copied to Azure Blob Storage and database `cloud_storage_path` values must be preserved or remapped.
- AI-assisted parsing, proposal generation, diagrams, PDF rendering, and notification delivery still call Abacus endpoints through `ABACUSAI_API_KEY`. The app can deploy independently, but those runtime features remain dependent on Abacus until replacement providers are implemented.
- Email notifications currently use Abacus notification ids. Independent production should replace these with a provider such as Resend, Postmark, SES, or SendGrid.
- The first Neon deployment depends on checked-in Prisma migrations. Future schema changes must add migrations before deployment.
- `npm ci` currently reports 17 dependency vulnerabilities. These were not remediated in this migration-prep pass because dependency upgrades can change runtime behavior and should be handled as a separate hardening task.
- Prisma 6.7 generates the client to the default `node_modules/@prisma/client` path. Prisma warns this default will change in Prisma 7; keep Prisma pinned or plan an explicit output path upgrade later.
- Azure Blob Storage connection strings are high-value secrets. Use a dedicated production storage account/container and rotate keys after setup if the connection string was exposed outside Vercel.
- `NEXTAUTH_SECRET` must be stable across deployments. Rotating it will invalidate sessions.
- DNS cutover for `winsproposal.com` can take time. Keep the old deployment available until Vercel is verified.

## Suggested Cutover Order

1. Deploy the app to a Vercel preview environment.
2. Create a fresh Neon database unless real customer data must be preserved.
3. Configure Azure Blob Storage and verify uploads in preview.
4. Import or seed required production data.
5. Smoke test auth, upload, parsing, generation, proposal edit, approval, and exports.
6. Attach `winsproposal.com` to Vercel.
7. Run production verification and manual smoke tests.
8. Retire Abacus only after data, files, AI/PDF, and email paths are verified.
