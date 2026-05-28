# WinsProposal Independent Deployment

This app is prepared for deployment outside Abacus with:

- GitHub as source control
- Vercel for Next.js hosting
- Neon Postgres for the production database
- Azure Blob Storage for uploaded RFP and vault files
- `winsproposal.com` as the production domain

## 1. Push To GitHub

From `winsproposal/nextjs_space`:

```bash
git init
git add .
git commit -m "Prepare independent production deployment"
git branch -M main
git remote add origin git@github.com:YOUR_ORG/winsproposal.git
git push -u origin main
```

Do not commit `.env`, `.next`, `node_modules`, local zip bundles, or generated build output.

## 2. Create Neon Database

Use a fresh production database unless there is confirmed customer/proposal data in Abacus that must be retained. Demo and test data should not be migrated.

1. Create a Neon project.
2. Create a production database.
3. Copy the pooled PostgreSQL connection string.
4. Use it as `DATABASE_URL` in Vercel.

The Prisma datasource already reads `DATABASE_URL` from the environment.

## 3. Configure Azure Blob Storage

1. Create a storage account and blob container, for example `winsproposal-production`.
2. Enable Blob CORS for browser uploads from:
   - `https://winsproposal.com`
   - Vercel preview URLs, if previews need uploads
3. Allow `PUT`, `GET`, `HEAD`, and `OPTIONS`.
4. Allow headers `content-type`, `x-ms-blob-type`, and `content-disposition`.
5. Store the Azure values in Vercel environment variables.

Required Azure variables:

```bash
AZURE_STORAGE_CONNECTION_STRING=
AZURE_STORAGE_CONTAINER_NAME=
AZURE_STORAGE_ACCOUNT_NAME=
```

## 4. Configure Vercel

1. Import the GitHub repository into Vercel.
   - If using the Vercel CLI, make sure the Vercel account has a GitHub Login Connection before running `vercel git connect`.
2. Set the project root to this folder if the repo contains parent directories:
   - `winsproposal/nextjs_space`
3. Use the default install command:
   - `npm ci`
4. Use the build command:
   - `npm run vercel-build`
5. Add environment variables from `.env.example`.

Minimum required production variables:

```bash
DATABASE_URL=
NEXTAUTH_URL=https://winsproposal.com
NEXTAUTH_SECRET=
AZURE_STORAGE_CONNECTION_STRING=
AZURE_STORAGE_CONTAINER_NAME=
AZURE_STORAGE_ACCOUNT_NAME=
```

Current app features also still call Abacus-hosted AI/PDF/email endpoints. Keep these variables populated until those integrations are replaced:

```bash
ABACUSAI_API_KEY=
WEB_APP_ID=
NOTIF_ID_DEMO_REQUEST_SUBMISSION=
NOTIF_ID_TEAM_INVITE=
```

## 5. Apply Database Migrations

After Vercel has environment variables configured, run the production migration from a trusted machine or CI job:

```bash
npm ci
npm run prisma:generate
npm run prisma:migrate:deploy
```

For Vercel, run `npm run prisma:migrate:deploy` as a one-time deployment step before opening the app to users. Do not use `prisma db push` for production schema changes.

## 6. Attach Domain

1. In Vercel, add `winsproposal.com` to the project domains.
2. Follow Vercel's DNS instructions at the DNS provider.
3. Set:
   - `NEXTAUTH_URL=https://winsproposal.com`
4. Redeploy after changing auth/domain environment variables.

## 7. Verify Production

After deployment:

```bash
npm run verify:production -- https://winsproposal.com
```

Also smoke test:

- Sign up or sign in.
- Upload an RFP to Azure Blob Storage.
- Parse the RFP.
- Generate a proposal.
- Edit a proposal section.
- Run the approval flow.
- Export PDF and DOCX.

## 8. Future Releases

For every future change:

```bash
npm ci
npm run prisma:generate
npm run build
```

Then push to GitHub and let Vercel deploy from `main`.

## Cutover Rule

Do not add more product features until the independent Vercel production deployment is verified. Keep the Abacus deployment live only until `winsproposal.com` is serving the Vercel build and smoke tests pass.
