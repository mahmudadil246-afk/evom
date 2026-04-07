import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { logAuditAction } from "@/lib/auditLog";
import { 
  PAYMENT_METHOD_DEFINITIONS, 
  getPaymentMethodDefinition,
  SYSTEM_METHOD_IDS,
  type PaymentMethodDefinition 
} from "@/data/paymentMethodDefinitions";

// Database config - only what's stored in DB
export interface PaymentMethodConfig {
  id: string;
  code: string;
  name: string;
  is_active: boolean;
  is_manual: boolean;
  sort_order: number;
  // Config fields
  account_details: any;
  config: any;
  description: string | null;
  display_name: string | null;
  instructions: string | null;
  logo_url: string | null;
  supports_verification: boolean;
}

// Combined payment method (definition + config)
export interface PaymentMethod extends PaymentMethodConfig {
  name_bn: string;
  icon: string;
  default_logo?: string;
  type: PaymentMethodDefinition["type"];
  configFields: PaymentMethodDefinition["configFields"];
  instructions_bn?: string;
  // Convenience accessors
  method_id: string;
  is_enabled: boolean;
  is_configured: boolean;
  test_mode: boolean;
  display_order: number;
  // Account detail fields
  account_number: string | null;
  account_type: string | null;
  qr_code_url: string | null;
  bank_accounts: string | null;
  payable_to: string | null;
  // Config fields
  api_key: string | null;
  secret_key: string | null;
  merchant_id: string | null;
  cod_charge_enabled: string | null;
  cod_charge_type: string | null;
  cod_charge_value: string | null;
  // bKash dual-mode fields
  payment_mode: string | null;
  app_key: string | null;
  app_secret: string | null;
  api_username: string | null;
  api_password: string | null;
  // Cheque fields
  auto_processing_enabled: string | null;
}

export function usePaymentMethods() {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchPaymentMethods = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("payment_methods")
        .select("*")
        .order("sort_order");

      if (error) throw error;

      // Merge DB config with hardcoded definitions
      const methods: PaymentMethod[] = (data || []).map((config: any) => {
        const methodId = config.code || config.name;
        const definition = getPaymentMethodDefinition(methodId);
        
        // Parse config and account_details
        let parsedConfig: any = {};
        let parsedAccountDetails: any = {};
        
        try {
          if (config.config) {
            parsedConfig = typeof config.config === 'string' 
              ? JSON.parse(config.config) 
              : config.config;
          }
        } catch { /* ignore */ }
        
        try {
          if (config.account_details) {
            parsedAccountDetails = typeof config.account_details === 'string' 
              ? JSON.parse(config.account_details) 
              : config.account_details;
          }
        } catch { /* ignore */ }

        if (!definition) {
          // Custom method - create basic definition
          return {
            ...config,
            method_id: methodId,
            is_enabled: config.is_active ?? false,
            is_configured: !!config.account_details,
            test_mode: parsedConfig.test_mode ?? false,
            display_order: config.sort_order ?? 0,
            account_number: parsedAccountDetails.account_number ?? null,
            account_type: parsedAccountDetails.account_type ?? null,
            qr_code_url: parsedAccountDetails.qr_code_url ?? null,
            bank_accounts: parsedAccountDetails.bank_accounts ? JSON.stringify(parsedAccountDetails.bank_accounts) : null,
            payable_to: parsedAccountDetails.payable_to ?? null,
            api_key: parsedConfig.api_key ?? null,
            secret_key: parsedConfig.secret_key ?? null,
            merchant_id: parsedConfig.merchant_id ?? null,
            cod_charge_enabled: parsedConfig.cod_charge_enabled ?? null,
            cod_charge_type: parsedConfig.cod_charge_type ?? null,
            cod_charge_value: parsedConfig.cod_charge_value ?? null,
            payment_mode: parsedConfig.payment_mode ?? null,
            app_key: parsedConfig.app_key ?? null,
            app_secret: parsedConfig.app_secret ?? null,
            api_username: parsedConfig.api_username ?? null,
            api_password: parsedConfig.api_password ?? null,
            auto_processing_enabled: parsedConfig.auto_processing_enabled ?? null,
            name_bn: config.name,
            icon: "💳",
            type: "custom" as const,
            configFields: [],
          };
        }

        return {
          ...config,
          method_id: methodId,
          is_enabled: config.is_active ?? false,
          is_configured: !!config.account_details,
          test_mode: parsedConfig.test_mode ?? false,
          display_order: config.sort_order ?? 0,
          // Account detail fields
          account_number: parsedAccountDetails.account_number ?? null,
          account_type: parsedAccountDetails.account_type ?? null,
          qr_code_url: parsedAccountDetails.qr_code_url ?? null,
          bank_accounts: parsedAccountDetails.bank_accounts ? JSON.stringify(parsedAccountDetails.bank_accounts) : null,
          payable_to: parsedAccountDetails.payable_to ?? null,
          // Config fields
          api_key: parsedConfig.api_key ?? null,
          secret_key: parsedConfig.secret_key ?? null,
          merchant_id: parsedConfig.merchant_id ?? null,
          cod_charge_enabled: parsedConfig.cod_charge_enabled ?? null,
          cod_charge_type: parsedConfig.cod_charge_type ?? null,
          cod_charge_value: parsedConfig.cod_charge_value ?? null,
          // bKash dual-mode fields
          payment_mode: parsedConfig.payment_mode ?? null,
          app_key: parsedConfig.app_key ?? null,
          app_secret: parsedConfig.app_secret ?? null,
          api_username: parsedConfig.api_username ?? null,
          api_password: parsedConfig.api_password ?? null,
          // Cheque fields
          auto_processing_enabled: parsedConfig.auto_processing_enabled ?? null,
           // Definition fields
           name_bn: definition.name_bn,
           icon: definition.icon,
           default_logo: definition.default_logo,
           type: definition.type,
           configFields: definition.configFields,
           instructions_bn: definition.instructions_bn,
        };
      });

      setPaymentMethods(methods);
    } catch (error: any) {
      console.error("Error fetching payment methods:", error);
      if (!error.message?.includes("permission")) {
        toast.error("Failed to load payment methods");
      }
    } finally {
      setLoading(false);
    }
  };

  const updatePaymentMethod = async (id: string, updates: Partial<PaymentMethodConfig>) => {
    try {
      setSaving(true);
      const { error } = await supabase
        .from("payment_methods")
        .update(updates)
        .eq("id", id);

      if (error) throw error;

      // Refetch to get fully merged data with definitions
      await fetchPaymentMethods();
      
      toast.success("Payment method updated");
      return true;
    } catch (error: any) {
      console.error("Error updating payment method:", error);
      toast.error(error.message || "Failed to update payment method");
      return false;
    } finally {
      setSaving(false);
    }
  };

  const toggleEnabled = async (id: string, enabled: boolean) => {
    const method = paymentMethods.find(m => m.id === id);
    logAuditAction({ action: "update", resource_type: "payment", resource_id: id, description: `Payment method "${method?.name}" ${enabled ? "enabled" : "disabled"}`, new_value: { is_active: enabled } });
    return updatePaymentMethod(id, { is_active: enabled });
  };

  const toggleTestMode = async (id: string, testMode: boolean) => {
    const method = paymentMethods.find(m => m.id === id);
    if (!method) return false;
    
    const newConfig = { ...((method.config as any) || {}), test_mode: testMode };
    return updatePaymentMethod(id, { config: newConfig });
  };

  const reorderPaymentMethods = async (reorderedMethods: PaymentMethod[]) => {
    try {
      setSaving(true);
      setPaymentMethods(reorderedMethods);
      
      const updates = reorderedMethods.map((method, index) => 
        supabase
          .from("payment_methods")
          .update({ sort_order: index + 1 })
          .eq("id", method.id)
      );
      
      const results = await Promise.all(updates);
      const hasError = results.some(r => r.error);
      
      if (hasError) {
        throw new Error("Failed to update order");
      }
      
      toast.success("Payment method order updated");
      return true;
    } catch (error: any) {
      console.error("Error reordering payment methods:", error);
      toast.error("Failed to update order");
      fetchPaymentMethods();
      return false;
    } finally {
      setSaving(false);
    }
  };

  const configurePaymentMethod = async (id: string, config: Partial<PaymentMethodConfig>) => {
    return updatePaymentMethod(id, config);
  };

  const uploadImage = async (methodId: string, file: File, prefix: string = ""): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${prefix}${methodId}-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('payment-logos')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('payment-logos')
        .getPublicUrl(fileName);

      return publicUrl;
    } catch (error: any) {
      console.error("Error uploading image:", error);
      toast.error("Failed to upload image");
      return null;
    }
  };

  useEffect(() => {
    fetchPaymentMethods();
  }, []);

  return {
    paymentMethods,
    loading,
    saving,
    updatePaymentMethod,
    toggleEnabled,
    toggleTestMode,
    configurePaymentMethod,
    uploadImage,
    reorderPaymentMethods,
    refetch: fetchPaymentMethods,
  };
}

export { SYSTEM_METHOD_IDS };
