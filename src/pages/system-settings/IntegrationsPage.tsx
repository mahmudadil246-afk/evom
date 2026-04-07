import { IntegrationsSettings } from "@/components/settings/IntegrationsSettings";
import { AutoReplySettings } from "@/components/settings/AutoReplySettings";
import { CannedResponsesSettings } from "@/components/settings/CannedResponsesSettings";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";

export default function IntegrationsPage() {
  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="🔌 Integrations"
        description="Third-party integrations, auto-reply and quick response templates"
      />
      <IntegrationsSettings />
      <AutoReplySettings />
      <CannedResponsesSettings />
    </div>
  );
}
