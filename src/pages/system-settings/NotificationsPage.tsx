import { EmailApiConfig } from "@/components/settings/EmailApiConfig";
import { AllEmailNotifications } from "@/components/settings/AllEmailNotifications";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";

export default function NotificationsPage() {
  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="🔔 Alerts & Email API"
        description="Configure email API and manage notification preferences"
      />
      <EmailApiConfig />
      <AllEmailNotifications />
    </div>
  );
}
