import { BackupSettings } from "@/components/settings/BackupSettings";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";

export default function BackupPage() {
  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="💾 Backup & Restore"
        description="Create database backups and restore from previous snapshots"
      />
      <BackupSettings />
    </div>
  );
}
