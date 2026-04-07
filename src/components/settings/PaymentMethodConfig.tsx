import { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Eye, EyeOff, Save, Loader2, Upload, X, ImageIcon, CheckCircle2, Percent, DollarSign } from "lucide-react";
import { PaymentMethod, PaymentMethodConfig as PaymentMethodConfigType } from "@/hooks/usePaymentMethods";
import { toast } from "sonner";
import { BankAccountsEditor } from "./BankAccountsEditor";
import { formatPrice } from "@/lib/formatPrice";

interface PaymentMethodConfigProps {
  method: PaymentMethod | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (id: string, config: Partial<PaymentMethodConfigType>) => Promise<boolean>;
  onUploadImage: (methodId: string, file: File, prefix?: string) => Promise<string | null>;
}

// Check if a field should be shown based on its dependsOn conditions
function shouldShowField(field: { dependsOn?: string; dependsOnValue?: string }, formData: Record<string, string>): boolean {
  if (!field.dependsOn) return true;
  const val = formData[field.dependsOn];
  if (field.dependsOnValue) {
    return val === field.dependsOnValue;
  }
  // Default: show if truthy
  return !!val && val !== "false";
}

export function PaymentMethodConfig({ method, open, onOpenChange, onSave, onUploadImage }: PaymentMethodConfigProps) {
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<Record<string, boolean>>({});
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  // Initialize form data when method changes
  useEffect(() => {
    if (method) {
      const initialData: Record<string, string> = {};
      method.configFields.forEach((field) => {
        const value = (method as any)[field.key];
        initialData[field.key] = value !== null && value !== undefined ? String(value) : "";
      });
      setFormData(initialData);
    }
  }, [method]);

  const handleInputChange = (key: string, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleFileSelect = async (key: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !method) return;

    if (!file.type.startsWith('image/')) {
      toast.error("Please select an image file");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image must be less than 2MB");
      return;
    }

    setUploading((prev) => ({ ...prev, [key]: true }));

    const prefix = key === "qr_code_url" ? "qr-" : "";
    const publicUrl = await onUploadImage(method.method_id, file, prefix);

    if (publicUrl) {
      handleInputChange(key, publicUrl);
      toast.success("Image uploaded successfully");
    }

    setUploading((prev) => ({ ...prev, [key]: false }));
  };

  const removeImage = (key: string) => {
    handleInputChange(key, "");
    if (fileInputRefs.current[key]) {
      fileInputRefs.current[key]!.value = "";
    }
  };

  const handleSave = async () => {
    if (!method) return;
    
    setSaving(true);
    
    // Fields that go into account_details JSON
    const accountDetailKeys = new Set(["account_number", "account_type", "qr_code_url", "bank_accounts", "payable_to"]);
    // Fields that go into config JSON
    const configKeys = new Set([
      "payment_mode", "app_key", "app_secret", "api_username", "api_password",
      "merchant_id", "api_key", "secret_key", "test_mode",
      "cod_charge_enabled", "cod_charge_type", "cod_charge_value",
      "auto_processing_enabled", "instructions",
    ]);

    const newAccountDetails: Record<string, any> = {};
    const newConfig: Record<string, any> = {};

    method.configFields.forEach((field) => {
      const val = formData[field.key] || null;
      if (accountDetailKeys.has(field.key)) {
        // bank_accounts is stored as parsed JSON array
        if (field.key === "bank_accounts" && val) {
          try { newAccountDetails[field.key] = JSON.parse(val); } catch { newAccountDetails[field.key] = []; }
        } else {
          newAccountDetails[field.key] = val;
        }
      } else if (configKeys.has(field.key)) {
        newConfig[field.key] = val;
      }
    });

    // Build the update payload
    const updatePayload: any = {
      account_details: newAccountDetails,
      config: newConfig,
    };

    // logo_url is a top-level column, not nested in JSON
    if (formData.logo_url !== undefined) {
      updatePayload.logo_url = formData.logo_url || null;
    }

    const success = await onSave(method.id, updatePayload);
    setSaving(false);
    
    if (success) {
      onOpenChange(false);
    }
  };

  if (!method) return null;

  const isCOD = method.method_id === "cod";
  const isBkash = method.method_id === "bkash";
  const isCheque = method.method_id === "cheque";

  // COD charge summary badge
  const codChargeBadge = isCOD && formData.cod_charge_enabled === "true" && formData.cod_charge_value ? (
    <Badge variant="secondary" className="ml-2 gap-1">
      {formData.cod_charge_type === "percentage" ? (
        <><Percent className="h-3 w-3" />{formData.cod_charge_value}% charge</>
      ) : (
        <><DollarSign className="h-3 w-3" />{formatPrice(Number(formData.cod_charge_value))} charge</>
      )}
    </Badge>
  ) : null;

  // bKash mode badge
  const bkashModeBadge = isBkash && formData.payment_mode ? (
    <Badge variant={formData.payment_mode === "api" ? "default" : "secondary"} className="ml-2">
      {formData.payment_mode === "api" ? "API Gateway" : "Manual"}
    </Badge>
  ) : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 flex-wrap">
            {formData.logo_url || method.default_logo ? (
              <img src={formData.logo_url || method.default_logo || ""} alt={method.name} className="h-8 w-8 object-contain rounded" />
            ) : (
              <span className="text-2xl">{method.icon}</span>
            )}
            Configure {method.name}
            {codChargeBadge}
            {bkashModeBadge}
          </DialogTitle>
          <DialogDescription>
            {method.description}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* No config fields */}
          {method.configFields.length === 0 && (
            <div className="rounded-lg bg-success/10 p-4 text-center">
              <CheckCircle2 className="h-12 w-12 mx-auto text-success mb-2" />
              <p className="font-medium">Ready to Use</p>
              <p className="text-sm text-muted-foreground">
                This payment method requires no additional configuration.
              </p>
            </div>
          )}

          {/* Dynamic config fields */}
          {method.configFields.map((field) => {
            // Check visibility
            if (!shouldShowField(field, formData)) return null;

            return (
              <div key={field.key} className="space-y-2">
                {field.type === "switch" ? (
                  <div className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <Label htmlFor={field.key}>{field.label}</Label>
                      {field.label_bn && (
                        <p className="text-xs text-muted-foreground">{field.label_bn}</p>
                      )}
                    </div>
                    <Switch
                      id={field.key}
                      checked={formData[field.key] === "true"}
                      onCheckedChange={(checked) => handleInputChange(field.key, checked ? "true" : "false")}
                    />
                  </div>
                ) : (
                  <>
                    <Label htmlFor={field.key}>
                      {field.label}
                      {field.required && <span className="text-destructive ml-1">*</span>}
                    </Label>
                    
                    {field.type === "text" && (
                      <Input
                        id={field.key}
                        value={formData[field.key] || ""}
                        onChange={(e) => handleInputChange(field.key, e.target.value)}
                        placeholder={field.placeholder}
                      />
                    )}

                    {field.type === "textarea" && (
                      <Textarea
                        id={field.key}
                        value={formData[field.key] || ""}
                        onChange={(e) => handleInputChange(field.key, e.target.value)}
                        placeholder={field.placeholder}
                        rows={4}
                        className="resize-none"
                      />
                    )}

                    {field.type === "number" && (
                      <Input
                        id={field.key}
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData[field.key] || ""}
                        onChange={(e) => handleInputChange(field.key, e.target.value)}
                        placeholder={field.placeholder}
                      />
                    )}

                    {field.type === "password" && (
                      <div className="relative">
                        <Input
                          id={field.key}
                          type={showPasswords[field.key] ? "text" : "password"}
                          value={formData[field.key] || ""}
                          onChange={(e) => handleInputChange(field.key, e.target.value)}
                          placeholder={field.placeholder || `Enter ${field.label}`}
                          className="pr-10"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                          onClick={() => setShowPasswords((prev) => ({ ...prev, [field.key]: !prev[field.key] }))}
                        >
                          {showPasswords[field.key] ? (
                            <EyeOff className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <Eye className="h-4 w-4 text-muted-foreground" />
                          )}
                        </Button>
                      </div>
                    )}

                    {field.type === "select" && (
                      <Select 
                        value={formData[field.key] || ""} 
                        onValueChange={(value) => handleInputChange(field.key, value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={`Select ${field.label}`} />
                        </SelectTrigger>
                        <SelectContent className="bg-popover">
                          {field.options?.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}

                    {field.type === "image" && (
                      <div className="flex items-start gap-4">
                        <div className="relative">
                          {formData[field.key] ? (
                            <div className={`relative ${field.key === "qr_code_url" ? "w-32 h-32" : "w-20 h-20"} rounded-lg border border-border overflow-hidden bg-muted`}>
                              <img 
                                src={formData[field.key]} 
                                alt={field.label} 
                                className="w-full h-full object-contain"
                              />
                              <Button
                                type="button"
                                variant="destructive"
                                size="icon"
                                className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                                onClick={() => removeImage(field.key)}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          ) : (
                            <div 
                              className={`${field.key === "qr_code_url" ? "w-32 h-32" : "w-20 h-20"} rounded-lg border-2 border-dashed border-border flex flex-col items-center justify-center bg-muted/50 cursor-pointer hover:border-primary/50 transition-colors`}
                              onClick={() => fileInputRefs.current[field.key]?.click()}
                            >
                              <ImageIcon className="h-8 w-8 text-muted-foreground" />
                              {field.key === "qr_code_url" && (
                                <span className="text-xs text-muted-foreground mt-1">QR Code</span>
                              )}
                            </div>
                          )}
                        </div>
                        <div className="flex-1 space-y-2">
                          <input
                            ref={(el) => { fileInputRefs.current[field.key] = el; }}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => handleFileSelect(field.key, e)}
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => fileInputRefs.current[field.key]?.click()}
                            disabled={uploading[field.key]}
                            className="gap-2"
                          >
                            {uploading[field.key] ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Upload className="h-4 w-4" />
                            )}
                            {uploading[field.key] ? "Uploading..." : `Upload ${field.label}`}
                          </Button>
                          <p className="text-xs text-muted-foreground">
                            PNG, JPG or SVG. Max 2MB.
                          </p>
                        </div>
                      </div>
                    )}

                    {field.type === "bank_accounts" && (
                      <BankAccountsEditor
                        value={formData[field.key] || "[]"}
                        onChange={(value) => handleInputChange(field.key, value)}
                      />
                    )}

                    {field.label_bn && (
                      <p className="text-xs text-muted-foreground">{field.label_bn}</p>
                    )}
                  </>
                )}
              </div>
            );
          })}

          {/* Gateway instructions panel */}
          {method.type === "gateway" && (
            <div className="rounded-lg bg-muted/50 p-3 text-sm text-muted-foreground space-y-1">
              {method.method_id === "sslcommerz" && (
                <><strong>How to get credentials:</strong><br />
                  1. Login to SSLCommerz merchant panel<br />
                  2. Go to API Credentials section<br />
                  3. Copy Store ID and Store Password</>
              )}
              {method.method_id === "shurjopay" && (
                <><strong>How to get credentials:</strong><br />
                  1. Register at ShurjoPay merchant portal<br />
                  2. Get your Merchant Username and Key from dashboard<br />
                  3. Use sandbox credentials for testing</>
              )}
              {method.method_id === "aamarpay" && (
                <><strong>How to get credentials:</strong><br />
                  1. Login to aamarPay merchant dashboard<br />
                  2. Go to Settings → API Keys<br />
                  3. Copy your Store ID and Signature Key</>
              )}
              {method.method_id === "stripe" && (
                <><strong>How to get credentials:</strong><br />
                  1. Login to dashboard.stripe.com<br />
                  2. Go to Developers → API keys<br />
                  3. Copy Publishable key and Secret key<br />
                  4. For Webhook Secret: Developers → Webhooks → Add endpoint</>
              )}
              {method.method_id === "paypal" && (
                <><strong>How to get credentials:</strong><br />
                  1. Login to developer.paypal.com<br />
                  2. Go to My Apps & Credentials<br />
                  3. Create app → Copy Client ID and Secret</>
              )}
              {method.method_id === "2checkout" && (
                <><strong>How to get credentials:</strong><br />
                  1. Login to 2Checkout (now Verifone) dashboard<br />
                  2. Go to Account → Integrations → Webhooks &amp; API<br />
                  3. Copy your Account Number and Secret Key</>
              )}
              {method.method_id === "payoneer" && (
                <><strong>How to get credentials:</strong><br />
                  1. Contact Payoneer to set up merchant integration<br />
                  2. Get your Partner ID, API Username and Password<br />
                  3. Use sandbox environment for testing</>
              )}
            </div>
          )}

          {/* bKash API mode info */}
          {isBkash && formData.payment_mode === "api" && (
            <div className="rounded-lg bg-primary/10 border border-primary/20 p-3 text-sm">
              <p className="font-medium text-primary">bKash Payment Gateway (API Mode)</p>
              <p className="text-muted-foreground mt-1">
                Customers will be redirected to bKash checkout page. Get credentials from the bKash merchant portal (merchants.bkash.com).
              </p>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving} className="gap-2">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save Configuration
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
