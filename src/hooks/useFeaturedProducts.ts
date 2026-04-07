import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface FeaturedProduct {
  id: string;
  name: string;
  slug: string;
  price: number;
  compare_at_price: number | null;
  images: string[];
  category: string | null;
  created_at: string;
}

async function fetchFeaturedProducts(limit: number): Promise<FeaturedProduct[]> {
  const { data, error } = await supabase.rpc("get_featured_products_lite", {
    p_limit: limit,
  });

  if (error || !data) {
    console.error("Error fetching featured products:", error);
    return [];
  }

  return (data as any[]).map((p) => ({
    id: p.id,
    name: p.name,
    slug: p.slug || "",
    price: Number(p.price),
    compare_at_price: p.compare_at_price ? Number(p.compare_at_price) : null,
    images: p.first_image ? [p.first_image] : [],
    category: p.category,
    created_at: p.created_at,
  }));
}

export function useFeaturedProducts(limit: number = 8) {
  const { data: products = [], isLoading: loading, refetch } = useQuery({
    queryKey: ["featured-products", limit],
    queryFn: () => fetchFeaturedProducts(limit),
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
  });

  const isNewProduct = (createdAt: string) => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return new Date(createdAt) > thirtyDaysAgo;
  };

  return { products, loading, isNewProduct, refetch };
}
