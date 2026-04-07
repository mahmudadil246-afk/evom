import { useState, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface PageContent {
  id: string;
  page_slug: string;
  title: string | null;
  subtitle: string | null;
  content: Record<string, any>;
  is_enabled: boolean;
  updated_at: string;
  created_at: string;
}

export function usePageContents() {
  const [pages, setPages] = useState<PageContent[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchPages = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("page_contents" as any)
      .select("*")
      .order("page_slug", { ascending: true });

    if (error) {
      console.error("Error fetching page contents:", error);
    } else {
      setPages((data as any[]) || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchPages();
  }, [fetchPages]);

  const getPage = (slug: string) => pages.find((p) => p.page_slug === slug);

  const updatePage = async (id: string, updates: Partial<PageContent>) => {
    const { error } = await supabase
      .from("page_contents" as any)
      .update({ ...updates, updated_at: new Date().toISOString() } as any)
      .eq("id", id);

    if (error) {
      toast({ title: "Error", description: "Failed to update page content", variant: "destructive" });
      return false;
    }
    toast({ title: "Success", description: "Page content updated" });
    await fetchPages();
    return true;
  };

  return { pages, loading, getPage, updatePage, refetch: fetchPages };
}

// Hook for individual page content (used by store pages)
export function usePageContent(slug: string) {
  const { data, isLoading: loading } = useQuery({
    queryKey: ["page-content", slug],
    queryFn: async () => {
      const { data: row, error } = await supabase
        .from("page_contents" as any)
        .select("*")
        .eq("page_slug", slug)
        .maybeSingle();

      if (error || !row) return null;
      return row as unknown as PageContent;
    },
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });

  return { data: data ?? null, loading };
}
