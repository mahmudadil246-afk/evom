import { Gift, Eye, EyeOff } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLanguage } from "@/contexts/LanguageContext";

interface GiftOptionsProps {
  isGift: boolean;
  onIsGiftChange: (checked: boolean) => void;
  giftMessage: string;
  onGiftMessageChange: (message: string) => void;
  hidePricing: boolean;
  onHidePricingChange: (checked: boolean) => void;
}

export function GiftOptions({
  isGift, onIsGiftChange, giftMessage, onGiftMessageChange, hidePricing, onHidePricingChange,
}: GiftOptionsProps) {
  const { t } = useLanguage();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Gift className="h-5 w-5 text-store-primary" />
          {t('store.giftOptions')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2">
          <Checkbox id="isGift" checked={isGift} onCheckedChange={(checked) => onIsGiftChange(checked as boolean)} />
          <Label htmlFor="isGift" className="text-sm font-normal cursor-pointer">🎁 {t('store.thisOrderIsGift')}</Label>
        </div>

        {isGift && (
          <div className="space-y-4 pl-6 border-l-2 border-store-primary/20">
            <div>
              <Label htmlFor="giftMessage" className="text-sm">{t('store.giftMessageOptional')}</Label>
              <Textarea
                id="giftMessage" value={giftMessage}
                onChange={(e) => onGiftMessageChange(e.target.value.slice(0, 300))}
                placeholder={t('store.giftMessagePlaceholder')} maxLength={300} className="mt-1 resize-none" rows={3}
              />
              <p className="text-xs text-muted-foreground mt-1">{giftMessage.length}/300</p>
            </div>

            <div className="flex items-center gap-2">
              <Checkbox id="hidePricing" checked={hidePricing} onCheckedChange={(checked) => onHidePricingChange(checked as boolean)} />
              <Label htmlFor="hidePricing" className="text-sm font-normal cursor-pointer flex items-center gap-1.5">
                {hidePricing ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                {t('store.hidePricing')}
              </Label>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}