import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { FeaturedProductCard } from "./FeaturedProductCard";
import { FeaturedProductsSkeleton } from "./FeaturedProductsSkeleton";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/contexts/LanguageContext";
import { TrendingUp } from "lucide-react";

interface TrendingProductsSectionProps {
  title?: string;
  subtitle?: string;
  count?: number;
}

export function TrendingProductsSection({ title, subtitle, count = 4 }: TrendingProductsSectionProps) {
  const { t } = useLanguage();

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["trending-products", count],
    queryFn: async () => {
      // Fetch products ordered by created_at (most recent activity = trending)
      const { data } = await supabase
        .from("products")
        .select("id, name, slug, price, compare_at_price, images, category, created_at")
        .eq("is_active", true)
        .is("deleted_at", null)
        .order("created_at", { ascending: false })
        .limit(count);

      return (data || []).map((p) => ({
        id: p.id,
        name: p.name,
        slug: p.slug || "",
        price: Number(p.price),
        compare_at_price: p.compare_at_price ? Number(p.compare_at_price) : null,
        images: (p.images as string[]) || [],
        category: p.category,
        created_at: p.created_at,
      }));
    },
    staleTime: 5 * 60 * 1000,
  });

  if (!isLoading && products.length === 0) return null;

  return (
    <section className="py-10 bg-store-background">
      <div className="container mx-auto px-4">
        <div className="flex flex-col items-center text-center mb-10">
          <Badge className="bg-store-primary/10 text-store-primary border-0 text-xs uppercase tracking-wider mb-3 gap-1.5">
            <TrendingUp className="h-3 w-3" />
            Trending
          </Badge>
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground">
            {title || t('store.trendingNow') || "Trending Now"}
          </h2>
          {subtitle && <p className="text-muted-foreground mt-2">{subtitle}</p>}
        </div>

        {isLoading ? (
          <FeaturedProductsSkeleton />
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {products.map((product) => (
              <FeaturedProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
