import { Link } from "react-router-dom";
import { Minus, Plus, X, ShoppingBag, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useCart } from "@/contexts/CartContext";
import { useAutoDiscountRules } from "@/hooks/useAutoDiscountRules";
import { FreeShippingProgress } from "@/components/store/FreeShippingProgress";
import { useLanguage } from "@/contexts/LanguageContext";
import { formatPrice } from "@/lib/formatPrice";

export function CartDrawer() {
  const { items, isOpen, setIsOpen, removeItem, updateQuantity, subtotal, itemCount } = useCart();
  const { t } = useLanguage();
  const { calculateDiscount: calculateAutoDiscount, getActiveRules } = useAutoDiscountRules();

  const autoDiscount = calculateAutoDiscount(subtotal);
  const activeAutoRules = getActiveRules().filter(rule => 
    rule.rule_type === "cart_total" && rule.min_purchase && subtotal >= rule.min_purchase
  );
  

  const handleQuantityInput = (item: typeof items[0], value: string) => {
    const num = parseInt(value, 10);
    if (!isNaN(num) && num > 0 && num <= 99) {
      updateQuantity(item.id, num, item.size, item.color);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetContent className="w-full sm:max-w-md flex flex-col">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5 text-store-primary" />
            {t('store.cart')} ({itemCount} {itemCount === 1 ? t('store.item') : t('store.items')})
          </SheetTitle>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center py-12">
            <div className="w-24 h-24 rounded-full bg-store-muted flex items-center justify-center mb-4">
              <ShoppingBag className="w-12 h-12 text-muted-foreground" />
            </div>
            <h3 className="font-display font-semibold text-lg mb-2">{t('store.cartEmpty')}</h3>
            <p className="text-muted-foreground mb-6">{t('store.cartEmptyDesc')}</p>
            <Button onClick={() => setIsOpen(false)} className="bg-store-primary hover:bg-store-primary/90" asChild>
              <Link to="/products">{t('store.startShopping')}</Link>
            </Button>
          </div>
        ) : (
          <>
            {/* Free Shipping Progress */}
            <FreeShippingProgress subtotal={subtotal} threshold={2000} className="mx-1 mt-2" />

            <div className="flex-1 overflow-y-auto py-4 space-y-4">
              {items.map((item) => (
                <div key={`${item.id}-${item.size}-${item.color}`} className="flex gap-4 p-3 rounded-lg bg-store-muted/50">
                  <div className="w-20 h-20 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                    <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm truncate">{item.name}</h4>
                    {(item.size || item.color) && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {item.size && `${t('store.sizeLabel')}: ${item.size}`}{item.size && item.color && ' • '}{item.color && `${t('store.colorLabel')}: ${item.color}`}
                      </p>
                    )}
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center gap-1">
                        <Button variant="outline" size="icon" className="h-7 w-7"
                          onClick={() => updateQuantity(item.id, item.quantity - 1, item.size, item.color)}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <Input
                          type="number"
                          min={1}
                          max={99}
                          value={item.quantity}
                          onChange={(e) => handleQuantityInput(item, e.target.value)}
                          className="w-10 h-7 text-center border-0 p-0 text-sm font-medium [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                        <Button variant="outline" size="icon" className="h-7 w-7"
                          onClick={() => updateQuantity(item.id, item.quantity + 1, item.size, item.color)}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-sm">{formatPrice(item.price * item.quantity)}</p>
                        {item.comparePrice && (
                          <p className="text-xs text-muted-foreground line-through">{formatPrice(item.comparePrice * item.quantity)}</p>
                        )}
                      </div>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-destructive flex-shrink-0"
                    onClick={() => removeItem(item.id, item.size, item.color)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>

            <div className="border-t pt-4 space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t('store.subtotal')}</span>
                <span className="font-semibold">{formatPrice(subtotal)}</span>
              </div>
              {autoDiscount > 0 && (
                <div className="flex justify-between text-sm text-store-accent">
                  <span className="flex items-center gap-1"><Sparkles className="h-3 w-3" /> Auto Discount</span>
                  <span>-{formatPrice(autoDiscount)}</span>
                </div>
              )}
              {activeAutoRules.length > 0 && autoDiscount > 0 && (
                <p className="text-xs text-store-accent">✨ {activeAutoRules[0].name} applied!</p>
              )}
              <p className="text-xs text-muted-foreground text-center">{t('store.shippingTaxNote')}</p>
              <div className="grid gap-2">
                <Button className="w-full bg-store-primary hover:bg-store-primary/90" size="lg" asChild onClick={() => setIsOpen(false)}>
                  <Link to="/checkout">{t('store.checkout')}</Link>
                </Button>
                <Button variant="outline" className="w-full" onClick={() => setIsOpen(false)} asChild>
                  <Link to="/cart">{t('store.viewCart')}</Link>
                </Button>
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
