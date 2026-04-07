import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface ThemeSetting {
  id: string;
  setting_key: string;
  setting_value: string | null;
  category: string;
  description: string | null;
}

export function useSiteThemeSettings() {
  const [settings, setSettings] = useState<ThemeSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("site_theme_settings" as any)
        .select("*")
        .order("category");

      if (error) throw error;
      setSettings((data as any[]) || []);
    } catch (error: any) {
      console.error("Error fetching theme settings:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const getValue = useCallback((key: string): string => {
    return settings.find((s) => s.setting_key === key)?.setting_value || "";
  }, [settings]);

  const getByCategory = useCallback((category: string): ThemeSetting[] => {
    return settings.filter((s) => s.category === category);
  }, [settings]);

  const updateSetting = useCallback(async (key: string, value: string) => {
    try {
      setSaving(true);
      const { error } = await supabase
        .from("site_theme_settings" as any)
        .update({ setting_value: value, updated_at: new Date().toISOString() } as any)
        .eq("setting_key", key);

      if (error) throw error;

      setSettings((prev) =>
        prev.map((s) =>
          s.setting_key === key ? { ...s, setting_value: value } : s
        )
      );
      return true;
    } catch (error: any) {
      console.error("Error updating theme setting:", error);
      toast.error("Failed to update setting");
      return false;
    } finally {
      setSaving(false);
    }
  }, []);

  const updateMultiple = useCallback(async (updates: { key: string; value: string }[]) => {
    try {
      setSaving(true);
      for (const update of updates) {
        const { error } = await supabase
          .from("site_theme_settings" as any)
          .update({ setting_value: update.value, updated_at: new Date().toISOString() } as any)
          .eq("setting_key", update.key);
        if (error) throw error;
      }

      setSettings((prev) => {
        const newSettings = [...prev];
        for (const update of updates) {
          const idx = newSettings.findIndex((s) => s.setting_key === update.key);
          if (idx >= 0) {
            newSettings[idx] = { ...newSettings[idx], setting_value: update.value };
          }
        }
        return newSettings;
      });
      
      toast.success("Theme settings saved!");
      return true;
    } catch (error: any) {
      console.error("Error updating theme settings:", error);
      toast.error("Failed to save settings");
      return false;
    } finally {
      setSaving(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  return { settings, loading, saving, getValue, getByCategory, updateSetting, updateMultiple, refetch: fetchSettings };
}
