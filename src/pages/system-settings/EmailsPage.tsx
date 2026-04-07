import { EmailTemplatesTab } from "@/components/settings/EmailTemplatesTab";
import { useEmailTemplates } from "@/hooks/useEmailTemplates";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";

export default function EmailsPage() {
  const { templates, loading, updateTemplate, toggleTemplate, createTemplate, deleteTemplate } = useEmailTemplates();

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="✉️ Email Templates"
        description="Manage email templates for order confirmations, notifications and more"
      />
      <EmailTemplatesTab
        templates={templates}
        loading={loading}
        onUpdateTemplate={updateTemplate}
        onToggleTemplate={toggleTemplate}
        onCreateTemplate={createTemplate}
        onDeleteTemplate={deleteTemplate}
      />
    </div>
  );
}
