import { useRef } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight, ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useFeaturedProducts } from "@/hooks/useFeaturedProducts";
import { useLanguage } from "@/contexts/LanguageContext";
import { formatPrice } from "@/lib/formatPrice";

interface NewArrivalsSectionProps {
  title?: string;
  subtitle?: string;
  badge?: string;
  count?: number;
}

export function NewArrivalsSection({
  title,
  subtitle,
  badge,
  count = 8,
}: NewArrivalsSectionProps) {
  const { t } = useLanguage();
  const displayTitle = title || t('store.newArrivals');
  const displaySubtitle = subtitle || "";
  const displayBadge = badge || t('newArrivals.new');
  const { products, loading } = useFeaturedProducts(count);
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (dir: "left" | "right") => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollBy({ left: dir === "left" ? -320 : 320, behavior: "smooth" });
  };

  // Use latest products (sorted by created_at desc)
  const newProducts = [...products].slice(0, count);

  return (
    <section className="py-10 bg-store-card">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="h-5 w-5 text-store-accent" />
              <span className="text-sm font-semibold text-store-primary uppercase tracking-widest">{displayBadge}</span>
            </div>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground">
              {displayTitle}
            </h2>
            {displaySubtitle && <p className="text-muted-foreground mt-1">{displaySubtitle}</p>}
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="icon"
              onClick={() => scroll("left")}
              className="rounded-full h-9 w-9"
              aria-label="Scroll left"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => scroll("right")}
              className="rounded-full h-9 w-9"
              aria-label="Scroll right"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button variant="outline" asChild>
              <Link to="/products?filter=new">
                {t('newArrivals.viewAll')} <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>

        {/* Horizontal scroll container */}
        {loading ? (
          <div className="flex gap-4 overflow-hidden">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex-shrink-0 w-56 md:w-64 h-80 bg-store-muted rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : newProducts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">{t('newArrivals.comingSoon')}</p>
          </div>
        ) : (
          <div
            ref={scrollRef}
            className="flex gap-4 overflow-x-auto scrollbar-hide pb-4"
            style={{ scrollSnapType: "x mandatory" }}
          >
            {newProducts.map((product) => {
              const hasDiscount = product.compare_at_price && product.compare_at_price > product.price;
              const discountPct = hasDiscount
                ? Math.round(((product.compare_at_price! - product.price) / product.compare_at_price!) * 100)
                : 0;

              return (
                <Link
                  key={product.id}
                  to={`/product/${product.slug}`}
                  className="flex-shrink-0 w-48 md:w-56 group"
                  style={{ scrollSnapAlign: "start" }}
                >
                  <div className="relative overflow-hidden rounded-xl aspect-[3/4] bg-store-muted mb-3">
                    {product.images?.[0] ? (
                      <img
                        src={product.images[0]}
                        alt={product.name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">
                        {t('newArrivals.noImage')}
                      </div>
                    )}
                    <div className="absolute top-2 left-2 flex flex-col gap-1">
                      <Badge className="bg-store-primary text-store-primary-foreground text-xs px-2 py-0.5">
                        {t('newArrivals.new')}
                      </Badge>
                      {hasDiscount && (
                        <Badge className="bg-destructive text-destructive-foreground text-xs px-2 py-0.5">
                          -{discountPct}%
                        </Badge>
                      )}
                    </div>
                    <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </div>
                  <div className="px-1">
                    <h3 className="font-medium text-sm text-foreground line-clamp-2 mb-1 group-hover:text-store-primary transition-colors">
                      {product.name}
                    </h3>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-store-primary">{formatPrice(product.price)}</span>
                      {hasDiscount && (
                        <span className="text-xs text-muted-foreground line-through">{formatPrice(product.compare_at_price!)}</span>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
