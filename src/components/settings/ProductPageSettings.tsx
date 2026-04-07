import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Shield, Truck, RefreshCw, CreditCard, Lock, Plus, X, Save, Loader2, Ruler } from "lucide-react";
import { useStoreSettings } from "@/hooks/useStoreSettings";
import { toast } from "sonner";

interface TrustBadge {
  icon: string;
  label: string;
  enabled: boolean;
}

interface SizeRow {
  size: string;
  chest: string;
  waist: string;
  hip: string;
}

const defaultTrustBadges: TrustBadge[] = [
  { icon: "truck", label: "Free Shipping", enabled: true },
  { icon: "refresh", label: "7-Day Returns", enabled: true },
  { icon: "lock", label: "SSL Secured", enabled: true },
  { icon: "credit-card", label: "Safe Payment", enabled: true },
];

const defaultSizeGuide: SizeRow[] = [
  { size: "S", chest: "36-38", waist: "28-30", hip: "36-38" },
  { size: "M", chest: "38-40", waist: "30-32", hip: "38-40" },
  { size: "L", chest: "40-42", waist: "32-34", hip: "40-42" },
  { size: "XL", chest: "42-44", waist: "34-36", hip: "42-44" },
  { size: "XXL", chest: "44-46", waist: "36-38", hip: "44-46" },
];

const iconOptions = [
  { value: "truck", label: "Truck (Shipping)" },
  { value: "refresh", label: "Refresh (Returns)" },
  { value: "lock", label: "Lock (Security)" },
  { value: "credit-card", label: "Credit Card (Payment)" },
  { value: "shield", label: "Shield (Protection)" },
];

export function ProductPageSettings() {
  const { getSettingValue, updateMultipleSettings, saving } = useStoreSettings();
  const [trustBadges, setTrustBadges] = useState<TrustBadge[]>(defaultTrustBadges);
  const [sizeGuide, setSizeGuide] = useState<SizeRow[]>(defaultSizeGuide);
  const [sizeGuideEnabled, setSizeGuideEnabled] = useState(true);
  const [sizeGuideNote, setSizeGuideNote] = useState("Between sizes? Go up for comfort.");
  const [localSaving, setLocalSaving] = useState(false);

  // Load from store_settings
  useEffect(() => {
    const badgesRaw = getSettingValue("PRODUCT_TRUST_BADGES");
    if (badgesRaw) {
      try { setTrustBadges(JSON.parse(badgesRaw)); } catch {}
    }
    const sizeRaw = getSettingValue("PRODUCT_SIZE_GUIDE");
    if (sizeRaw) {
      try { setSizeGuide(JSON.parse(sizeRaw)); } catch {}
    }
    const sizeEnabled = getSettingValue("PRODUCT_SIZE_GUIDE_ENABLED");
    if (sizeEnabled) setSizeGuideEnabled(sizeEnabled === "true");
    const note = getSettingValue("PRODUCT_SIZE_GUIDE_NOTE");
    if (note) setSizeGuideNote(note);
  }, [getSettingValue]);

  const handleSave = async () => {
    setLocalSaving(true);
    await updateMultipleSettings([
      { key: "PRODUCT_TRUST_BADGES", value: JSON.stringify(trustBadges) },
      { key: "PRODUCT_SIZE_GUIDE", value: JSON.stringify(sizeGuide) },
      { key: "PRODUCT_SIZE_GUIDE_ENABLED", value: String(sizeGuideEnabled) },
      { key: "PRODUCT_SIZE_GUIDE_NOTE", value: sizeGuideNote },
    ]);
    setLocalSaving(false);
  };

  // Trust badge handlers
  const updateBadge = (index: number, field: keyof TrustBadge, value: any) => {
    setTrustBadges(prev => prev.map((b, i) => i === index ? { ...b, [field]: value } : b));
  };
  const addBadge = () => {
    setTrustBadges(prev => [...prev, { icon: "shield", label: "New Badge", enabled: true }]);
  };
  const removeBadge = (index: number) => {
    setTrustBadges(prev => prev.filter((_, i) => i !== index));
  };

  // Size guide handlers
  const updateSizeRow = (index: number, field: keyof SizeRow, value: string) => {
    setSizeGuide(prev => prev.map((r, i) => i === index ? { ...r, [field]: value } : r));
  };
  const addSizeRow = () => {
    setSizeGuide(prev => [...prev, { size: "", chest: "", waist: "", hip: "" }]);
  };
  const removeSizeRow = (index: number) => {
    setSizeGuide(prev => prev.filter((_, i) => i !== index));
  };

  const getIconComponent = (iconName: string) => {
    switch (iconName) {
      case "truck": return Truck;
      case "refresh": return RefreshCw;
      case "lock": return Lock;
      case "credit-card": return CreditCard;
      case "shield": return Shield;
      default: return Shield;
    }
  };

  return (
    <div className="space-y-6">
      {/* Trust Badges */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-accent" />
                Trust Badges
              </CardTitle>
              <CardDescription>প্রোডাক্ট পেজে দেখানো ট্রাস্ট ব্যাজগুলো কাস্টমাইজ করুন</CardDescription>
            </div>
            <Button onClick={handleSave} disabled={localSaving || saving} size="sm" className="gap-2">
              {localSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {trustBadges.map((badge, index) => {
            const Icon = getIconComponent(badge.icon);
            return (
              <div key={index} className="flex items-center gap-3 p-3 rounded-lg border">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted shrink-0">
                  <Icon className="h-5 w-5 text-muted-foreground" />
                </div>
                <select
                  value={badge.icon}
                  onChange={(e) => updateBadge(index, "icon", e.target.value)}
                  className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                >
                  {iconOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
                <Input
                  value={badge.label}
                  onChange={(e) => updateBadge(index, "label", e.target.value)}
                  className="flex-1"
                  placeholder="Badge label"
                />
                <Switch
                  checked={badge.enabled}
                  onCheckedChange={(v) => updateBadge(index, "enabled", v)}
                />
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => removeBadge(index)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            );
          })}
          <Button variant="outline" size="sm" onClick={addBadge} className="gap-2">
            <Plus className="h-4 w-4" /> Add Badge
          </Button>
          <div className="mt-2">
            <p className="text-xs text-muted-foreground">প্রিভিউ:</p>
            <div className="grid grid-cols-4 gap-3 p-4 bg-muted rounded-lg mt-2">
              {trustBadges.filter(b => b.enabled).map((badge, i) => {
                const Icon = getIconComponent(badge.icon);
                return (
                  <div key={i} className="text-center">
                    <Icon className="h-5 w-5 mx-auto mb-1 text-primary" />
                    <p className="text-[10px] font-medium">{badge.label}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Size Guide */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Ruler className="h-5 w-5 text-accent" />
                Size Guide
              </CardTitle>
              <CardDescription>প্রোডাক্ট পেজে দেখানো সাইজ গাইড কাস্টমাইজ করুন</CardDescription>
            </div>
            <Switch checked={sizeGuideEnabled} onCheckedChange={setSizeGuideEnabled} />
          </div>
        </CardHeader>
        {sizeGuideEnabled && (
          <CardContent className="space-y-4">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2 font-medium">Size</th>
                    <th className="text-left p-2 font-medium">Chest</th>
                    <th className="text-left p-2 font-medium">Waist</th>
                    <th className="text-left p-2 font-medium">Hip</th>
                    <th className="w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  {sizeGuide.map((row, index) => (
                    <tr key={index} className="border-b">
                      <td className="p-1"><Input value={row.size} onChange={(e) => updateSizeRow(index, "size", e.target.value)} className="h-8" /></td>
                      <td className="p-1"><Input value={row.chest} onChange={(e) => updateSizeRow(index, "chest", e.target.value)} className="h-8" placeholder='e.g. 36-38' /></td>
                      <td className="p-1"><Input value={row.waist} onChange={(e) => updateSizeRow(index, "waist", e.target.value)} className="h-8" placeholder='e.g. 28-30' /></td>
                      <td className="p-1"><Input value={row.hip} onChange={(e) => updateSizeRow(index, "hip", e.target.value)} className="h-8" placeholder='e.g. 36-38' /></td>
                      <td className="p-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => removeSizeRow(index)}>
                          <X className="h-3 w-3" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Button variant="outline" size="sm" onClick={addSizeRow} className="gap-2">
              <Plus className="h-4 w-4" /> Add Size
            </Button>
            <Separator />
            <div className="space-y-2">
              <Label>Size Guide Note</Label>
              <Input
                value={sizeGuideNote}
                onChange={(e) => setSizeGuideNote(e.target.value)}
                placeholder="Between sizes? Go up for comfort."
              />
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
