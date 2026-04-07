import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface CategoryRow {
  id: string;
  name: string;
  slug: string;
  parent_id: string | null;
  sort_order: number | null;
  image_url: string | null;
}

async function fetchCategories(): Promise<CategoryRow[]> {
  const { data, error } = await supabase
    .from("categories")
    .select("id, name, slug, parent_id, sort_order, image_url")
    .eq("is_active", true)
    .is("deleted_at", null)
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  if (error) {
    console.error("Error fetching categories:", error);
    return [];
  }
  return ((data as any[]) || []).map(cat => ({
    ...cat,
    image_url: cat.image_url && typeof cat.image_url === 'string' && cat.image_url.startsWith('data:') ? null : cat.image_url,
  }));
}

export function useCategoriesCache() {
  return useQuery({
    queryKey: ["categories-active"],
    queryFn: fetchCategories,
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
}
