import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { Zap, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useFeaturedProducts } from "@/hooks/useFeaturedProducts";
import { useLanguage } from "@/contexts/LanguageContext";
import { formatPrice } from "@/lib/formatPrice";

interface FlashSaleSectionProps {
  title?: string;
  subtitle?: string;
  badge?: string;
  endTime?: string | null;
  count?: number;
}

function useCountdown(endTime: string | null) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    if (!endTime) return;

    const update = () => {
      const end = new Date(endTime).getTime();
      const now = Date.now();
      const diff = end - now;

      if (diff <= 0) {
        setExpired(true);
        return;
      }
      setTimeLeft({
        days: Math.floor(diff / 86400000),
        hours: Math.floor((diff % 86400000) / 3600000),
        minutes: Math.floor((diff % 3600000) / 60000),
        seconds: Math.floor((diff % 60000) / 1000),
      });
    };

    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, [endTime]);

  return { timeLeft, expired };
}

function TimerBlock({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <div className="w-14 h-14 md:w-16 md:h-16 bg-white/15 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/20 relative overflow-hidden">
        <span className="font-display text-2xl md:text-3xl font-bold text-white leading-none relative z-10">
          {String(value).padStart(2, "0")}
        </span>
        <div className="absolute inset-0 bg-white/5 animate-pulse" />
      </div>
      <span className="text-white/70 text-xs mt-1.5 uppercase tracking-wider font-medium">{label}</span>
    </div>
  );
}

export function FlashSaleSection({
  title,
  subtitle,
  badge,
  endTime,
  count = 4,
}: FlashSaleSectionProps) {
  const { t } = useLanguage();
  const displayTitle = title || t('store.flashSale');
  const displaySubtitle = subtitle || "";
  const displayBadge = badge || `⚡ ${t('store.flashSale')}`;
  const { products: allProducts, loading } = useFeaturedProducts(8);
  // Stable default: midnight tonight (or 24h from first mount)
  const stableEndTime = useMemo(() => {
    if (endTime) return endTime;
    const tomorrow = new Date();
    tomorrow.setHours(23, 59, 59, 999);
    return tomorrow.toISOString();
  }, [endTime]);
  const { timeLeft, expired } = useCountdown(stableEndTime);

  // Show products with discount
  const saleProducts = allProducts.filter(p => p.compare_at_price && p.compare_at_price > p.price).slice(0, count);
  const displayProducts = saleProducts.length > 0 ? saleProducts : allProducts.slice(0, count);

  if (expired && endTime) return null;

  return (
    <section className="py-10 bg-gradient-to-br from-store-primary via-store-secondary to-store-primary text-white">
      <div className="container mx-auto px-4">
        {/* Header with countdown */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-12">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Zap className="h-6 w-6 text-store-accent fill-current" />
              <Badge className="bg-store-accent text-store-accent-foreground text-sm px-3">
                {displayBadge}
              </Badge>
            </div>
            <h2 className="font-display text-3xl md:text-4xl font-bold">{displayTitle}</h2>
            {displaySubtitle && <p className="text-white/75 mt-1">{displaySubtitle}</p>}
          </div>

          {/* Countdown - always visible */}
          {!expired && (
            <div className="flex items-center gap-2 md:gap-3">
              <span className="text-white/60 text-sm font-medium mr-1 hidden md:block">Ends in</span>
              <TimerBlock value={timeLeft.days} label={t('flashSale.days')} />
              <span className="text-white/40 text-2xl font-bold mb-4">:</span>
              <TimerBlock value={timeLeft.hours} label={t('flashSale.hours')} />
              <span className="text-white/40 text-2xl font-bold mb-4">:</span>
              <TimerBlock value={timeLeft.minutes} label={t('flashSale.mins')} />
              <span className="text-white/40 text-2xl font-bold mb-4">:</span>
              <TimerBlock value={timeLeft.seconds} label={t('flashSale.secs')} />
            </div>
          )}
        </div>

        {/* Products */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-72 bg-white/10 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : displayProducts.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {displayProducts.map((product) => {
              const hasDiscount = product.compare_at_price && product.compare_at_price > product.price;
              const discountPct = hasDiscount
                ? Math.round(((product.compare_at_price! - product.price) / product.compare_at_price!) * 100)
                : 0;

              return (
                <Link
                  key={product.id}
                  to={`/product/${product.slug}`}
                  className="group bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-2xl overflow-hidden border border-white/15 transition-all duration-300 hover:scale-[1.02]"
                >
                  <div className="relative aspect-square overflow-hidden">
                    {product.images?.[0] ? (
                      <img
                        src={product.images[0]}
                        alt={product.name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full bg-white/10 flex items-center justify-center text-white/50 text-sm">
                        {t('flashSale.noImage')}
                      </div>
                    )}
                    {hasDiscount && (
                      <div className="absolute top-2 left-2 bg-store-accent text-store-accent-foreground text-xs font-bold px-2 py-1 rounded-lg">
                        -{discountPct}%
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <h3 className="font-medium text-sm text-white line-clamp-1 mb-1">{product.name}</h3>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-store-accent">{formatPrice(product.price)}</span>
                      {hasDiscount && (
                        <span className="text-xs text-white/50 line-through">{formatPrice(product.compare_at_price!)}</span>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : null}

        {/* CTA */}
        <div className="text-center mt-10">
          <Button
            size="lg"
            className="bg-store-accent text-store-accent-foreground hover:bg-store-accent/90 font-semibold px-10"
            asChild
          >
            <Link to="/products?filter=sale">
              {t('flashSale.shopAllSale')} <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
