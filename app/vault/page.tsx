import { AppSidebar } from "@/components/app-sidebar";
import { VaultTabs } from "./_components/vault-tabs";

export default function VaultPage() {
  return (
    <AppSidebar>
      <VaultTabs />
    </AppSidebar>
  );
}
