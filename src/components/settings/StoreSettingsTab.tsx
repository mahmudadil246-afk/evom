import { UploadSettings } from "@/components/settings/UploadSettings";
import { MaintenanceModeSettings } from "@/components/settings/MaintenanceModeSettings";

export function StoreSettingsTab() {
  return (
    <div className="space-y-6">
      <UploadSettings />
      <MaintenanceModeSettings />
    </div>
  );
}
