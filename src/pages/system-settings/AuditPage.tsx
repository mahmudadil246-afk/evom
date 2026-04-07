import { AuditLogTab } from "@/components/settings/AuditLogTab";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";

export default function AuditPage() {
  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="📋 Audit Log"
        description="Track all admin actions and system changes"
      />
      <AuditLogTab />
    </div>
  );
}
