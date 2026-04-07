import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useStoreSettings } from "@/hooks/useStoreSettings";
import { 
  Code2, 
  Save, 
  CheckCircle2, 
  AlertCircle,
  Loader2,
  ExternalLink
} from "lucide-react";
import { toast } from "sonner";

export function GoogleTagManagerSettings() {
  const { settings, loading, saving, updateMultipleSettings, getSettingValue } = useStoreSettings();
  
  const [containerId, setContainerId] = useState("");
  const [isEnabled, setIsEnabled] = useState(false);

  useEffect(() => {
    if (!loading && settings.length > 0) {
      setContainerId(getSettingValue("GTM_CONTAINER_ID") || "");
      setIsEnabled(getSettingValue("GTM_ENABLED") === "true");
    }
  }, [loading, settings]);

  const handleSave = async () => {
    if (containerId && !containerId.match(/^GTM-[A-Z0-9]+$/)) {
      toast.error("Invalid Container ID format. It should start with 'GTM-' followed by alphanumeric characters.");
      return;
    }

    const success = await updateMultipleSettings([
      { key: "GTM_CONTAINER_ID", value: containerId },
      { key: "GTM_ENABLED", value: isEnabled.toString() },
    ]);
    
    if (success) {
      toast.success(isEnabled && containerId 
        ? "Google Tag Manager saved! It will be active on next page load." 
        : "Google Tag Manager settings saved. Tracking is disabled.");
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  const isConfigured = Boolean(containerId);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white border overflow-hidden">
              <img src="/logos/google-tag-manager.svg" alt="Google Tag Manager" className="h-8 w-8 object-contain" />
            </div>
            <div>
              <CardTitle className="flex items-center gap-2">
                Google Tag Manager
                {isConfigured && isEnabled ? (
                  <Badge variant="outline" className="bg-success/10 text-success border-success/20">
                    <CheckCircle2 className="mr-1 h-3 w-3" />
                    Active
                  </Badge>
                ) : isConfigured ? (
                  <Badge variant="outline" className="bg-muted text-muted-foreground">
                    Disabled
                  </Badge>
                ) : (
                  <Badge variant="outline" className="bg-warning/10 text-warning border-warning/20">
                    <AlertCircle className="mr-1 h-3 w-3" />
                    Not Configured
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>
                Manage all your tracking tags from one place
              </CardDescription>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Enable GTM</Label>
            <p className="text-sm text-muted-foreground">
              Load Google Tag Manager container on your store
            </p>
          </div>
          <Switch checked={isEnabled} onCheckedChange={setIsEnabled} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="gtm-container-id">Container ID</Label>
          <Input
            id="gtm-container-id"
            value={containerId}
            onChange={(e) => setContainerId(e.target.value.toUpperCase())}
            placeholder="GTM-XXXXXXX"
            className="font-mono"
          />
          <p className="text-xs text-muted-foreground">Example: GTM-ABC1234</p>
        </div>

        <Button onClick={handleSave} disabled={saving} className="gap-2">
          <Save className="h-4 w-4" />
          {saving ? "Saving..." : "Save Settings"}
        </Button>

        <div className="rounded-lg bg-muted/50 p-4 space-y-3">
          <h4 className="font-medium">How to get your Container ID:</h4>
          <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
            <li>Go to <a href="https://tagmanager.google.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-1">Google Tag Manager <ExternalLink className="h-3 w-3" /></a></li>
            <li>Select your container or create a new one</li>
            <li>Copy the Container ID from the top (starts with GTM-)</li>
            <li>Paste it here and enable tracking</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  );
}
