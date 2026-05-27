import { AppSidebar } from "@/components/app-sidebar";
import { ProposalDetailClient } from "./_components/proposal-detail-client";

export const dynamic = "force-dynamic";

export default function ProposalDetailPage({ params }: { params: { id: string } }) {
  return (
    <AppSidebar>
      <ProposalDetailClient proposalId={params?.id ?? ""} />
    </AppSidebar>
  );
}
