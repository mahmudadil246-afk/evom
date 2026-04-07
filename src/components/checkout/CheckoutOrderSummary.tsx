import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { ShieldCheck, Tag, X, Sparkles } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { formatPrice } from "@/lib/formatPrice";

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
  size?: string;
  color?: string;
}

interface CheckoutOrderSummaryProps {
  items: CartItem[];
  subtotal: number;
  discount: number;
  shippingCost: number;
  codCharge: number;
  total: number;
  isAutoDiscountApplied: boolean;
  couponCode: string;
  onCouponCodeChange: (code: string) => void;
  appliedCouponCode?: string | null;
  onApplyCoupon: () => void;
  onRemoveCoupon: () => void;
  couponLoading: boolean;
  processing: boolean;
  selectedZoneId: string;
  selectedRateId: string;
  acceptedTerms: boolean;
  selectedZoneName?: string;
  selectedRateName?: string;
  selectedRateMaxOrderAmount?: number | null;
}

export function CheckoutOrderSummary({
  items, subtotal, discount, shippingCost, codCharge, total,
  isAutoDiscountApplied, couponCode, onCouponCodeChange, appliedCouponCode,
  onApplyCoupon, onRemoveCoupon, couponLoading, processing,
  selectedZoneId, selectedRateId, acceptedTerms,
  selectedZoneName, selectedRateName, selectedRateMaxOrderAmount,
}: CheckoutOrderSummaryProps) {
  const { t } = useLanguage();
  return (
    <div className="lg:col-span-1">
      <Card className="sticky top-24">
        <CardHeader><CardTitle>{t('store.orderSummary')}</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {items.map((item) => (
              <div key={`${item.id}-${item.size}-${item.color}`} className="flex gap-3">
                <div className="w-16 h-16 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                  <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{item.name}</p>
                  {(item.size || item.color) && <p className="text-xs text-muted-foreground">{item.size} {item.color && `/ ${item.color}`}</p>}
                  <p className="text-sm">{formatPrice(item.price)} × {item.quantity}</p>
                </div>
              </div>
            ))}
          </div>

          <Separator />

          {appliedCouponCode ? (
            <div className="flex items-center justify-between p-3 bg-store-accent/10 rounded-lg border border-store-accent">
              <div className="flex items-center gap-2">
                <Tag className="h-4 w-4 text-store-accent" />
                <span className="font-medium text-sm">{appliedCouponCode}</span>
              </div>
              <Button variant="ghost" size="sm" onClick={onRemoveCoupon} className="text-destructive h-6 px-2"><X className="h-3 w-3" /></Button>
            </div>
          ) : (
            <div className="flex gap-2">
              <Input placeholder={t('store.couponCode')} value={couponCode} onChange={(e) => onCouponCodeChange(e.target.value.toUpperCase())} className="h-9" />
              <Button type="button" variant="outline" size="sm" onClick={onApplyCoupon} disabled={couponLoading || !couponCode.trim()}>{t('store.apply')}</Button>
            </div>
          )}

          <Separator />

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{t('store.subtotal')}</span>
              <span>{formatPrice(subtotal)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-sm text-store-accent">
                <span className="flex items-center gap-1">
                  {isAutoDiscountApplied && <Sparkles className="h-3 w-3" />}
                  {isAutoDiscountApplied ? t('store.autoDiscount') : t('store.discount')}
                </span>
                <span>-{formatPrice(discount)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">
                {t('store.shipping')}
                {selectedZoneName && selectedRateName && <span className="block text-xs">{selectedZoneName} • {selectedRateName}</span>}
              </span>
              <span className={shippingCost === 0 ? 'text-green-600' : ''}>{shippingCost === 0 ? t('store.free') : formatPrice(shippingCost)}</span>
            </div>
            {codCharge > 0 && (
              <div className="flex justify-between text-sm text-warning">
                <span>{t('store.codCharge')}</span>
                <span>+{formatPrice(codCharge)}</span>
              </div>
            )}
            {selectedRateMaxOrderAmount && subtotal < selectedRateMaxOrderAmount && (
              <p className="text-xs text-muted-foreground">{formatPrice((selectedRateMaxOrderAmount - subtotal))} {t('store.orderMoreForFree')}</p>
            )}
          </div>

          <Separator />

          <div className="flex justify-between font-semibold text-lg">
            <span>{t('store.total')}</span>
            <span>{formatPrice(total)}</span>
          </div>

          <Button type="submit" size="lg" className="w-full bg-store-primary hover:bg-store-primary/90" disabled={processing || !selectedZoneId || !selectedRateId || !acceptedTerms}>
            {processing ? t('store.processing') : `${t('store.reviewPlaceOrder')} • ${formatPrice(total)}`}
          </Button>

          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <ShieldCheck className="h-4 w-4" /><span>{t('store.secureCheckout')}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}