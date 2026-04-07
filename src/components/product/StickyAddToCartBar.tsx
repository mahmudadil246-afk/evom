import { Button } from '@/components/ui/button';
import { ShoppingBag } from 'lucide-react';
import { formatPrice } from "@/lib/formatPrice";
import { cn } from '@/lib/utils';

interface StickyAddToCartBarProps {
  productName: string;
  displayPrice: number;
  productImage?: string;
  onAddToCart: () => void;
  onBuyNow: () => void;
  visible: boolean;
}

export function StickyAddToCartBar({ productName, displayPrice, productImage, onAddToCart, onBuyNow, visible }: StickyAddToCartBarProps) {
  return (
    <>
      <div className={cn(
        "fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-t border-border shadow-[0_-4px_20px_rgba(0,0,0,0.1)] transition-transform duration-300",
        visible ? "translate-y-0" : "translate-y-full"
      )}>
        <div className="container mx-auto px-3 sm:px-4 py-2.5 sm:py-3 flex items-center gap-3">
          {/* Product thumbnail - desktop only */}
          {productImage && (
            <div className="hidden sm:block h-10 w-10 rounded-lg overflow-hidden border border-border shrink-0">
              <img src={productImage} alt={productName} className="h-full w-full object-cover" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate text-foreground">{productName}</p>
            <p className="text-base sm:text-lg font-bold text-store-primary">{formatPrice(displayPrice)}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button
              size="sm"
              className="bg-store-primary hover:bg-store-primary/90 h-9 sm:h-10 px-3 sm:px-5 text-xs sm:text-sm"
              onClick={onAddToCart}
            >
              <ShoppingBag className="h-4 w-4 mr-1.5" />
              <span className="hidden xs:inline">Add to Cart</span>
              <span className="xs:hidden">Add</span>
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-9 sm:h-10 px-3 sm:px-5 text-xs sm:text-sm border-store-primary text-store-primary hover:bg-store-primary/10"
              onClick={onBuyNow}
            >
              Buy Now
            </Button>
          </div>
        </div>
      </div>
      {visible && <div className="h-16 sm:h-[68px]" />}
    </>
  );
}
