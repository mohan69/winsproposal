import { AppSidebar } from "@/components/app-sidebar";
import { ProposalsClient } from "./_components/proposals-client";

export default function ProposalsPage() {
  return (
    <AppSidebar>
      <ProposalsClient />
    </AppSidebar>
  );
}
