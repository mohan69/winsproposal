-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('admin', 'bid_manager', 'reviewer', 'team_member');

-- CreateEnum
CREATE TYPE "Industry" AS ENUM ('Valves', 'Pumps', 'EPC', 'General');

-- CreateEnum
CREATE TYPE "ProposalStatus" AS ENUM ('Draft', 'Final');

-- CreateEnum
CREATE TYPE "ApprovalStatus" AS ENUM ('none', 'pending_approval', 'approved', 'rejected');

-- CreateEnum
CREATE TYPE "InviteStatus" AS ENUM ('pending', 'accepted', 'expired');

-- CreateEnum
CREATE TYPE "CompanySize" AS ENUM ('startup', 'sme', 'mid_market', 'enterprise', 'conglomerate');

-- CreateEnum
CREATE TYPE "SourceType" AS ENUM ('vault', 'generated');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'team_member',
    "company_name" TEXT,
    "organization_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vault_documents" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "file_type" TEXT NOT NULL,
    "document_type" TEXT,
    "cloud_storage_path" TEXT,
    "is_public" BOOLEAN NOT NULL DEFAULT false,
    "industry" "Industry" NOT NULL DEFAULT 'General',
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "extracted_sections_count" INTEGER NOT NULL DEFAULT 0,
    "uploaded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vault_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vault_sections" (
    "id" TEXT NOT NULL,
    "document_id" TEXT NOT NULL,
    "section_title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "section_type" TEXT,
    "industry_tags" TEXT[] DEFAULT ARRAY[]::TEXT[],

    CONSTRAINT "vault_sections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rfp_uploads" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "file_type" TEXT NOT NULL,
    "cloud_storage_path" TEXT,
    "is_public" BOOLEAN NOT NULL DEFAULT false,
    "extracted_data" JSONB,
    "uploaded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rfp_uploads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "proposals" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "rfp_id" TEXT,
    "template_type" TEXT NOT NULL DEFAULT 'General',
    "title" TEXT NOT NULL,
    "status" "ProposalStatus" NOT NULL DEFAULT 'Draft',
    "industry" "Industry" NOT NULL DEFAULT 'General',
    "vault_sections_used" INTEGER NOT NULL DEFAULT 0,
    "vault_documents_used" INTEGER NOT NULL DEFAULT 0,
    "win_score" INTEGER,
    "company_size" "CompanySize",
    "approval_status" "ApprovalStatus" NOT NULL DEFAULT 'none',
    "approved_by_id" TEXT,
    "approved_at" TIMESTAMP(3),
    "rejection_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "proposals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "proposal_sections" (
    "id" TEXT NOT NULL,
    "proposal_id" TEXT NOT NULL,
    "section_title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "source_type" "SourceType" NOT NULL DEFAULT 'generated',
    "source_id" TEXT,
    "order_index" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "proposal_sections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vault_text_entries" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "industry" "Industry" NOT NULL DEFAULT 'General',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vault_text_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "compliance_checklists" (
    "id" TEXT NOT NULL,
    "proposal_id" TEXT NOT NULL,
    "checklist_items" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "compliance_checklists_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tbe_responses" (
    "id" TEXT NOT NULL,
    "rfp_id" TEXT NOT NULL,
    "line_item_index" INTEGER NOT NULL,
    "tag" TEXT NOT NULL,
    "response_text" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tbe_responses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "linkedin_posts" (
    "id" TEXT NOT NULL,
    "post_text" TEXT NOT NULL,
    "hashtags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "topic" TEXT NOT NULL,
    "character_count" INTEGER NOT NULL,
    "suggested_day" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "linkedin_posts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "demo_requests" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "company" TEXT NOT NULL,
    "industry" TEXT,
    "rfps_per_month" TEXT,
    "message" TEXT,
    "submitted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "demo_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organizations" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "logo_url" TEXT,
    "brand_color" TEXT,
    "created_by_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "organizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "team_invites" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'team_member',
    "invited_by_id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "status" "InviteStatus" NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "team_invites_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "go_no_go_assessments" (
    "id" TEXT NOT NULL,
    "rfp_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "responses" JSONB NOT NULL,
    "total_score" INTEGER NOT NULL,
    "max_score" INTEGER NOT NULL,
    "recommendation" TEXT NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "go_no_go_assessments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_organization_id_idx" ON "users"("organization_id");

-- CreateIndex
CREATE INDEX "vault_documents_user_id_idx" ON "vault_documents"("user_id");

-- CreateIndex
CREATE INDEX "vault_sections_document_id_idx" ON "vault_sections"("document_id");

-- CreateIndex
CREATE INDEX "rfp_uploads_user_id_idx" ON "rfp_uploads"("user_id");

-- CreateIndex
CREATE INDEX "proposals_user_id_idx" ON "proposals"("user_id");

-- CreateIndex
CREATE INDEX "proposal_sections_proposal_id_idx" ON "proposal_sections"("proposal_id");

-- CreateIndex
CREATE INDEX "vault_text_entries_user_id_idx" ON "vault_text_entries"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "compliance_checklists_proposal_id_key" ON "compliance_checklists"("proposal_id");

-- CreateIndex
CREATE INDEX "tbe_responses_rfp_id_idx" ON "tbe_responses"("rfp_id");

-- CreateIndex
CREATE UNIQUE INDEX "tbe_responses_rfp_id_line_item_index_tag_key" ON "tbe_responses"("rfp_id", "line_item_index", "tag");

-- CreateIndex
CREATE UNIQUE INDEX "team_invites_token_key" ON "team_invites"("token");

-- CreateIndex
CREATE INDEX "team_invites_organization_id_idx" ON "team_invites"("organization_id");

-- CreateIndex
CREATE INDEX "team_invites_token_idx" ON "team_invites"("token");

-- CreateIndex
CREATE UNIQUE INDEX "go_no_go_assessments_rfp_id_key" ON "go_no_go_assessments"("rfp_id");

-- CreateIndex
CREATE INDEX "go_no_go_assessments_rfp_id_idx" ON "go_no_go_assessments"("rfp_id");

-- CreateIndex
CREATE INDEX "go_no_go_assessments_user_id_idx" ON "go_no_go_assessments"("user_id");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vault_documents" ADD CONSTRAINT "vault_documents_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vault_sections" ADD CONSTRAINT "vault_sections_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "vault_documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rfp_uploads" ADD CONSTRAINT "rfp_uploads_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proposals" ADD CONSTRAINT "proposals_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proposals" ADD CONSTRAINT "proposals_rfp_id_fkey" FOREIGN KEY ("rfp_id") REFERENCES "rfp_uploads"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proposal_sections" ADD CONSTRAINT "proposal_sections_proposal_id_fkey" FOREIGN KEY ("proposal_id") REFERENCES "proposals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vault_text_entries" ADD CONSTRAINT "vault_text_entries_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "compliance_checklists" ADD CONSTRAINT "compliance_checklists_proposal_id_fkey" FOREIGN KEY ("proposal_id") REFERENCES "proposals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tbe_responses" ADD CONSTRAINT "tbe_responses_rfp_id_fkey" FOREIGN KEY ("rfp_id") REFERENCES "rfp_uploads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team_invites" ADD CONSTRAINT "team_invites_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "go_no_go_assessments" ADD CONSTRAINT "go_no_go_assessments_rfp_id_fkey" FOREIGN KEY ("rfp_id") REFERENCES "rfp_uploads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

