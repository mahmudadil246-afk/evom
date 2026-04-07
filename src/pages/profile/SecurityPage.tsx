import { TwoFactorSetup } from '@/components/profile/TwoFactorSetup';
import { RecoveryCodes } from '@/components/profile/RecoveryCodes';
import { TrustedDevices } from '@/components/profile/TrustedDevices';
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";

export default function SecurityPage() {
  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Security"
        description="Manage two-factor authentication, recovery codes, and trusted devices"
      />

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left: 2FA + Trusted Devices */}
        <div className="space-y-6">
          <TwoFactorSetup />
          <TrustedDevices />
        </div>

        {/* Right: Recovery Codes */}
        <div className="space-y-6">
          <RecoveryCodes />
        </div>
      </div>
    </div>
  );
}
