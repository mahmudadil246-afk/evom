import { useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { siteContentRegistry, getPageDef, getSectionDef, type SectionDef } from "@/config/siteContentRegistry";

export interface SiteContentOverride {
  id: string;
  page_slug: string;
  section_key: string;
  is_enabled: boolean | null;
  title: string | null;
  subtitle: string | null;
  badge_text: string | null;
  image_url: string | null;
  content: Record<string, any>;
  sort_order: number | null;
  updated_at: string;
}

export interface MergedSection {
  def: SectionDef;
  override: SiteContentOverride | null;
  // Merged values
  isEnabled: boolean;
  title: string | null;
  subtitle: string | null;
  badgeText: string | null;
  imageUrl: string | null;
  content: Record<string, any>;
  sortOrder: number | null;
}

const QUERY_KEY = ["site-content-overrides"];

async function fetchAllOverrides(): Promise<SiteContentOverride[]> {
  const { data, error } = await supabase
    .from("site_content_overrides")
    .select("*")
    .order("sort_order", { ascending: true });

  if (error) {
    console.error("Error fetching site content overrides:", error);
    return [];
  }
  return (data as any[]) || [];
}

function mergeContent(defaults: Record<string, any>, overrides: Record<string, any>): Record<string, any> {
  const merged = { ...defaults };
  for (const key of Object.keys(overrides)) {
    const val = overrides[key];
    // Treat empty arrays as "not set" — fall back to default
    if (Array.isArray(val) && val.length === 0 && Array.isArray(defaults[key]) && defaults[key].length > 0) {
      continue;
    }
    merged[key] = val;
  }
  return merged;
}

function mergeSection(def: SectionDef, override: SiteContentOverride | null): MergedSection {
  return {
    def,
    override,
    isEnabled: override?.is_enabled ?? def.defaultEnabled,
    title: override?.title ?? def.defaultTitle ?? null,
    subtitle: override?.subtitle ?? def.defaultSubtitle ?? null,
    badgeText: override?.badge_text ?? def.defaultBadge ?? null,
    imageUrl: override?.image_url ?? null,
    content: mergeContent(def.defaultContent || {}, override?.content || {}),
    sortOrder: override?.sort_order ?? null,
  };
}

export function useSiteContent(pageSlug?: string) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: allOverrides = [], isLoading: loading } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: fetchAllOverrides,
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });

  const refetch = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: QUERY_KEY });
  }, [queryClient]);

  const getOverride = (pSlug: string, sKey: string) =>
    allOverrides.find((o) => o.page_slug === pSlug && o.section_key === sKey) || null;

  const getSectionConfig = (pSlug: string, sKey: string): MergedSection | null => {
    const def = getSectionDef(pSlug, sKey);
    if (!def) return null;
    return mergeSection(def, getOverride(pSlug, sKey));
  };

  const getPageSections = (pSlug: string): MergedSection[] => {
    const pageDef = getPageDef(pSlug);
    if (!pageDef) return [];
    const pageOverrides = allOverrides.filter((o) => o.page_slug === pSlug);

    return pageDef.sections.map((def) => {
      const override = pageOverrides.find((o) => o.section_key === def.key) || null;
      return mergeSection(def, override);
    }).sort((a, b) => {
      const aOrder = a.sortOrder ?? 999;
      const bOrder = b.sortOrder ?? 999;
      return aOrder - bOrder;
    });
  };

  const updateSection = async (
    pSlug: string,
    sKey: string,
    updates: Partial<Omit<SiteContentOverride, "id" | "page_slug" | "section_key" | "updated_at">>
  ) => {
    const existing = getOverride(pSlug, sKey);

    if (existing) {
      const { error } = await supabase
        .from("site_content_overrides")
        .update({ ...updates, updated_at: new Date().toISOString() } as any)
        .eq("id", existing.id);

      if (error) {
        toast({ title: "Error", description: "Failed to update section", variant: "destructive" });
        return false;
      }
    } else {
      const { error } = await supabase
        .from("site_content_overrides")
        .insert({
          page_slug: pSlug,
          section_key: sKey,
          ...updates,
        } as any);

      if (error) {
        toast({ title: "Error", description: "Failed to create override", variant: "destructive" });
        return false;
      }
    }

    toast({ title: "Success", description: "Section updated" });
    refetch();
    return true;
  };

  const toggleSection = async (pSlug: string, sKey: string, enabled: boolean) => {
    return updateSection(pSlug, sKey, { is_enabled: enabled });
  };

  // Convenience: get merged section for a specific page (used by store pages)
  const section = (sKey: string): MergedSection | null => {
    if (!pageSlug) return null;
    return getSectionConfig(pageSlug, sKey);
  };

  const sections = pageSlug ? getPageSections(pageSlug) : [];

  return {
    allOverrides,
    loading,
    sections,
    section,
    getSectionConfig,
    getPageSections,
    updateSection,
    toggleSection,
    refetch,
    registry: siteContentRegistry,
  };
}

/**
 * Backward-compatible hook for store pages that used usePageContent(slug).
 * Returns { data, loading } where data has title, subtitle, content shape.
 */
export function usePageContent(slug: string) {
  const { section, loading } = useSiteContent(slug);
  const mainContent = section("main_content");

  const data = mainContent
    ? {
        title: mainContent.title,
        subtitle: mainContent.subtitle,
        content: mainContent.content,
        is_enabled: mainContent.isEnabled,
      }
    : null;

  return { data, loading };
}

