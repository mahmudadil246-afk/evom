import { PaymentSettings } from "@/components/settings/PaymentSettings";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";

export default function PaymentsPage() {
  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="💳 Payment Methods"
        description="Configure payment gateways and manual payment options"
      />
      <PaymentSettings />
    </div>
  );
}
