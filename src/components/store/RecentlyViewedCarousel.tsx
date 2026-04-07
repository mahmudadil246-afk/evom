import { Link } from "react-router-dom";
import { useRecentlyViewed } from "@/hooks/useRecentlyViewed";
import { formatPrice } from "@/lib/formatPrice";
import { useLanguage } from "@/contexts/LanguageContext";
import { Clock } from "lucide-react";

export function RecentlyViewedCarousel() {
  const { items } = useRecentlyViewed();
  const { t } = useLanguage();

  if (items.length === 0) return null;

  return (
    <section className="py-10 bg-store-background">
      <div className="container mx-auto px-4">
        <div className="flex items-center gap-2 mb-6">
          <Clock className="h-5 w-5 text-muted-foreground" />
          <h2 className="font-display text-xl md:text-2xl font-bold text-foreground">
            {t('store.recentlyViewed') || "Recently Viewed"}
          </h2>
        </div>

        <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory scrollbar-hide pb-2 -mx-1 px-1">
          {items.slice(0, 10).map((item) => (
            <Link
              key={item.id}
              to={`/product/${item.id}`}
              className="flex-shrink-0 w-36 md:w-44 snap-start group"
            >
              <div className="aspect-square rounded-xl overflow-hidden bg-store-muted mb-2">
                <img
                  src={item.image || "/placeholder.svg"}
                  alt={item.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                />
              </div>
              <p className="text-sm font-medium text-foreground line-clamp-1 group-hover:text-store-primary transition-colors">
                {item.name}
              </p>
              <p className="text-sm font-bold text-foreground">{formatPrice(item.price)}</p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
