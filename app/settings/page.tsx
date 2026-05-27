import { AppSidebar } from "@/components/app-sidebar";
import { SettingsClient } from "./_components/settings-client";

export default function SettingsPage() {
  return (
    <AppSidebar>
      <SettingsClient />
    </AppSidebar>
  );
}
