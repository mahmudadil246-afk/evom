import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useStoreSettings } from "@/hooks/useStoreSettings";
import { 
  Search, 
  Save, 
  CheckCircle2, 
  AlertCircle,
  Loader2,
  ExternalLink
} from "lucide-react";
import { toast } from "sonner";

export function GoogleSearchConsoleSettings() {
  const { settings, loading, saving, updateMultipleSettings, getSettingValue } = useStoreSettings();
  
  const [verificationContent, setVerificationContent] = useState("");

  useEffect(() => {
    if (!loading && settings.length > 0) {
      setVerificationContent(getSettingValue("GOOGLE_SITE_VERIFICATION") || "");
    }
  }, [loading, settings]);

  const handleSave = async () => {
    // Strip meta tag wrapper if user pastes the full tag
    let value = verificationContent.trim();
    const metaMatch = value.match(/content="([^"]+)"/);
    if (metaMatch) {
      value = metaMatch[1];
      setVerificationContent(value);
    }

    const success = await updateMultipleSettings([
      { key: "GOOGLE_SITE_VERIFICATION", value },
    ]);
    
    if (success) {
      toast.success(value 
        ? "Google Search Console verification tag saved! It will appear on next page load." 
        : "Verification tag removed.");
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

  const isConfigured = Boolean(verificationContent);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white border overflow-hidden">
              <img src="/logos/google-search-console.png" alt="Google Search Console" className="h-8 w-8 object-contain" />
            </div>
            <div>
              <CardTitle className="flex items-center gap-2">
                Google Search Console
                {isConfigured ? (
                  <Badge variant="outline" className="bg-success/10 text-success border-success/20">
                    <CheckCircle2 className="mr-1 h-3 w-3" />
                    Verified
                  </Badge>
                ) : (
                  <Badge variant="outline" className="bg-warning/10 text-warning border-warning/20">
                    <AlertCircle className="mr-1 h-3 w-3" />
                    Not Configured
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>
                Verify site ownership for Google Search Console
              </CardDescription>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="gsc-verification">Verification Meta Tag Content</Label>
          <Input
            id="gsc-verification"
            value={verificationContent}
            onChange={(e) => setVerificationContent(e.target.value)}
            placeholder="Paste verification code or full meta tag"
            className="font-mono"
          />
          <p className="text-xs text-muted-foreground">
            You can paste the full meta tag or just the content value
          </p>
        </div>

        <Button onClick={handleSave} disabled={saving} className="gap-2">
          <Save className="h-4 w-4" />
          {saving ? "Saving..." : "Save Settings"}
        </Button>

        <div className="rounded-lg bg-muted/50 p-4 space-y-3">
          <h4 className="font-medium">How to verify your site:</h4>
          <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
            <li>Go to <a href="https://search.google.com/search-console" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-1">Google Search Console <ExternalLink className="h-3 w-3" /></a></li>
            <li>Add your site URL as a property</li>
            <li>Choose "HTML tag" as the verification method</li>
            <li>Copy the meta tag content value and paste it here</li>
            <li>After saving, go back to Search Console and click "Verify"</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  );
}
