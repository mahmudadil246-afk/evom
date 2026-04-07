import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useStoreSettings } from "@/hooks/useStoreSettings";
import { 
  Share2, 
  Save, 
  CheckCircle2, 
  AlertCircle,
  Loader2,
  ExternalLink
} from "lucide-react";
import { toast } from "sonner";

export function MetaPixelSettings() {
  const { settings, loading, saving, updateMultipleSettings, getSettingValue } = useStoreSettings();
  
  const [pixelId, setPixelId] = useState("");
  const [isEnabled, setIsEnabled] = useState(false);

  useEffect(() => {
    if (!loading && settings.length > 0) {
      setPixelId(getSettingValue("META_PIXEL_ID") || "");
      setIsEnabled(getSettingValue("META_PIXEL_ENABLED") === "true");
    }
  }, [loading, settings]);

  const handleSave = async () => {
    if (pixelId && !pixelId.match(/^\d+$/)) {
      toast.error("Invalid Pixel ID. It should be a numeric value.");
      return;
    }

    const success = await updateMultipleSettings([
      { key: "META_PIXEL_ID", value: pixelId },
      { key: "META_PIXEL_ENABLED", value: isEnabled.toString() },
    ]);
    
    if (success) {
      toast.success(isEnabled && pixelId 
        ? "Meta Pixel saved! It will be active on next page load." 
        : "Meta Pixel settings saved. Tracking is disabled.");
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

  const isConfigured = Boolean(pixelId);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white border overflow-hidden">
              <img src="/logos/meta-pixel.svg" alt="Meta Pixel" className="h-8 w-8 object-contain" />
            </div>
            <div>
              <CardTitle className="flex items-center gap-2">
                Meta Pixel (Facebook)
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
                Track conversions and optimize Facebook/Instagram ads
              </CardDescription>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Enable Meta Pixel</Label>
            <p className="text-sm text-muted-foreground">
              Load Meta Pixel tracking code on your store
            </p>
          </div>
          <Switch checked={isEnabled} onCheckedChange={setIsEnabled} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="meta-pixel-id">Pixel ID</Label>
          <Input
            id="meta-pixel-id"
            value={pixelId}
            onChange={(e) => setPixelId(e.target.value.replace(/\D/g, ''))}
            placeholder="1234567890123456"
            className="font-mono"
          />
          <p className="text-xs text-muted-foreground">Example: 1234567890123456</p>
        </div>

        <Button onClick={handleSave} disabled={saving} className="gap-2">
          <Save className="h-4 w-4" />
          {saving ? "Saving..." : "Save Settings"}
        </Button>

        <div className="rounded-lg bg-muted/50 p-4 space-y-3">
          <h4 className="font-medium">How to get your Pixel ID:</h4>
          <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
            <li>Go to <a href="https://business.facebook.com/events_manager" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-1">Meta Events Manager <ExternalLink className="h-3 w-3" /></a></li>
            <li>Select your Pixel under "Data Sources"</li>
            <li>Copy the Pixel ID (numeric value)</li>
            <li>Paste it here and enable tracking</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  );
}
