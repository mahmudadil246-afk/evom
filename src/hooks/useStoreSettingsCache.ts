import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface StoreSettingsMap {
  [key: string]: string;
}

async function fetchStoreSettings(): Promise<StoreSettingsMap> {
  const { data, error } = await supabase
    .from("store_settings" as any)
    .select("key, setting_value");

  if (error) throw error;

  const map: StoreSettingsMap = {};
  if (data) {
    for (const item of data as any[]) {
      if (item.setting_value) {
        map[item.key] = item.setting_value;
      }
    }
  }
  return map;
}

export function useStoreSettingsCache() {
  return useQuery({
    queryKey: ["store-settings-public"],
    queryFn: fetchStoreSettings,
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000,
  });
}
