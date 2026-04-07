import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Construction, Save, Loader2 } from "lucide-react";
import { useMaintenanceMode } from "@/hooks/useMaintenanceMode";
import { toast } from "sonner";

export function MaintenanceModeSettings() {
  const { config, loading, saving, updateConfig } = useMaintenanceMode();
  const [localMessage, setLocalMessage] = useState<string | null>(null);
  const [localEstimatedEnd, setLocalEstimatedEnd] = useState<string | null>(null);

  const message = localMessage ?? config.message;
  const estimatedEnd = localEstimatedEnd ?? config.estimated_end ?? "";

  const handleToggle = async (enabled: boolean) => {
    const success = await updateConfig({ enabled });
    if (success) {
      toast.success(enabled ? "🚧 Maintenance mode enabled" : "✅ Store is now live");
    } else {
      toast.error("Failed to update maintenance mode");
    }
  };

  const handleSaveDetails = async () => {
    const success = await updateConfig({
      message,
      estimated_end: estimatedEnd || null,
    });
    if (success) {
      toast.success("Maintenance settings saved");
      setLocalMessage(null);
      setLocalEstimatedEnd(null);
    } else {
      toast.error("Failed to save settings");
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 flex items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={config.enabled ? "border-destructive/50 bg-destructive/5" : ""}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Construction className="h-5 w-5 text-accent" />
            <div>
              <CardTitle className="flex items-center gap-2">
                Maintenance Mode
                {config.enabled && (
                  <Badge variant="destructive" className="text-xs">ACTIVE</Badge>
                )}
              </CardTitle>
              <CardDescription>
                When enabled, visitors will see a maintenance page instead of your store
              </CardDescription>
            </div>
          </div>
          <Switch
            checked={config.enabled}
            onCheckedChange={handleToggle}
            disabled={saving}
          />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {config.enabled && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
            <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <p>Your store is currently in maintenance mode. Visitors cannot access the store. Admin panel remains accessible.</p>
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="maintenanceMessage">Maintenance Message</Label>
          <Textarea
            id="maintenanceMessage"
            value={message}
            onChange={(e) => setLocalMessage(e.target.value)}
            placeholder="We're currently performing scheduled maintenance..."
            rows={3}
            maxLength={500}
          />
          <p className="text-xs text-muted-foreground">{message.length}/500 characters</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="estimatedEnd">Estimated End Time (optional)</Label>
          <Input
            id="estimatedEnd"
            type="datetime-local"
            value={estimatedEnd}
            onChange={(e) => setLocalEstimatedEnd(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            Visitors will see an estimated return time if set
          </p>
        </div>

        <Button
          onClick={handleSaveDetails}
          disabled={saving || (localMessage === null && localEstimatedEnd === null)}
          size="sm"
          className="gap-2"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save Details
        </Button>
      </CardContent>
    </Card>
  );
}
