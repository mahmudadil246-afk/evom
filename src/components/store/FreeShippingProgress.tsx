import { Truck, Gift } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useLanguage } from "@/contexts/LanguageContext";
import { formatPrice } from "@/lib/formatPrice";

interface FreeShippingProgressProps {
  subtotal: number;
  threshold?: number;
  className?: string;
}

export function FreeShippingProgress({ subtotal, threshold = 2000, className }: FreeShippingProgressProps) {
  const { t } = useLanguage();
  const progress = Math.min((subtotal / threshold) * 100, 100);
  const remaining = threshold - subtotal;
  const isFree = subtotal >= threshold;


  return (
    <div className={`p-4 rounded-xl border ${isFree ? 'bg-green-50 border-green-200 dark:bg-green-950/30 dark:border-green-800' : 'bg-store-muted/50 border-border'} ${className}`}>
      <div className="flex items-center gap-2 mb-2">
        {isFree ? (
          <Gift className="h-5 w-5 text-green-600 dark:text-green-400" />
        ) : (
          <Truck className="h-5 w-5 text-store-primary" />
        )}
        <span className={`text-sm font-semibold ${isFree ? 'text-green-700 dark:text-green-300' : 'text-foreground'}`}>
          {isFree 
            ? t('store.gotFreeShipping')
            : `${formatPrice(remaining)} ${t('store.addMoreForFreeShipping')}`
          }
        </span>
      </div>
      <Progress 
        value={progress} 
        className={`h-2.5 ${isFree ? '[&>div]:bg-green-500' : '[&>div]:bg-store-primary'}`} 
      />
      <div className="flex justify-between mt-1.5 text-xs text-muted-foreground">
        <span>{formatPrice(subtotal)}</span>
        <span>{formatPrice(threshold)}</span>
      </div>
    </div>
  );
}