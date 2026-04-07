import { IPSecuritySettings } from "@/components/settings/IPSecuritySettings";
import { AccountLockouts } from "@/components/admin/AccountLockouts";
import { BlockedLoginAttempts } from "@/components/admin/BlockedLoginAttempts";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";

export default function SecurityPage() {
  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="🛡️ Security"
        description="IP blocking, rate limiting, account lockouts and login monitoring"
      />
      <IPSecuritySettings />
      <AccountLockouts />
      <BlockedLoginAttempts />
    </div>
  );
}
