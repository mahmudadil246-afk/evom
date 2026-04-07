import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useStoreSettingsCache } from "@/hooks/useStoreSettingsCache";

interface MaintenanceConfig {
  enabled: boolean;
  message: string;
  allowed_ips: string[];
  estimated_end: string | null;
}

const DEFAULT_CONFIG: MaintenanceConfig = {
  enabled: false,
  message: "We're currently performing scheduled maintenance. We'll be back shortly!",
  allowed_ips: [],
  estimated_end: null,
};

export function useMaintenanceMode() {
  const [config, setConfig] = useState<MaintenanceConfig>(DEFAULT_CONFIG);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchConfig = async () => {
    try {
      const { data, error } = await supabase
        .from("store_settings" as any)
        .select("setting_value")
        .eq("key", "MAINTENANCE_MODE")
        .single();

      if (error && error.code !== "PGRST116") throw error;

      if (data && (data as any).setting_value) {
        const val = (data as any).setting_value;
        const parsed = typeof val === "string" ? JSON.parse(val) : val;
        setConfig({ ...DEFAULT_CONFIG, ...parsed });
      }
    } catch (error) {
      console.error("Error fetching maintenance config:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  const updateConfig = async (updates: Partial<MaintenanceConfig>) => {
    setSaving(true);
    try {
      const newConfig = { ...config, ...updates };
      const { error } = await supabase
        .from("store_settings" as any)
        .upsert({
          key: "MAINTENANCE_MODE",
          setting_value: JSON.stringify(newConfig),
          value: JSON.stringify(newConfig),
        } as any, { onConflict: "key" });

      if (error) throw error;
      setConfig(newConfig);
      return true;
    } catch (error) {
      console.error("Error updating maintenance config:", error);
      return false;
    } finally {
      setSaving(false);
    }
  };

  return { config, loading, saving, updateConfig };
}

// Lightweight hook — reads from shared store_settings cache (no extra DB call)
export function useMaintenanceCheck() {
  const { data: settings, isLoading } = useStoreSettingsCache();

  const result = useMemo(() => {
    if (!settings) {
      return { isMaintenanceMode: false, message: DEFAULT_CONFIG.message, estimatedEnd: null };
    }
    const raw = settings["MAINTENANCE_MODE"];
    if (!raw) {
      return { isMaintenanceMode: false, message: DEFAULT_CONFIG.message, estimatedEnd: null };
    }
    try {
      const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
      return {
        isMaintenanceMode: parsed.enabled === true,
        message: parsed.message || DEFAULT_CONFIG.message,
        estimatedEnd: parsed.estimated_end || null,
      };
    } catch {
      return { isMaintenanceMode: false, message: DEFAULT_CONFIG.message, estimatedEnd: null };
    }
  }, [settings]);

  return { ...result, loading: isLoading };
}
