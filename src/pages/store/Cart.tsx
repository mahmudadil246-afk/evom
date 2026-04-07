import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Minus, Plus, X, ShoppingBag, ArrowLeft, Truck, Tag, Loader2, Sparkles, Heart, Bookmark, Share2, MessageSquare, PackageCheck, CheckSquare, Square, AlertTriangle } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { useCart } from "@/contexts/CartContext";
import { useCoupon } from "@/hooks/useCoupon";
import { useAutoDiscountRules } from "@/hooks/useAutoDiscountRules";
import { useWishlist } from "@/contexts/WishlistContext";
import { FreeShippingProgress } from "@/components/store/FreeShippingProgress";
import { SEOHead } from "@/components/SEOHead";
import { toast } from "sonner";
import { useShippingRates } from "@/hooks/useShippingRates";
import { formatPrice } from "@/lib/formatPrice";

export default function Cart() {
  const { items, removeItem, updateQuantity, updateItemNote, subtotal, clearCart, savedItems, saveForLater, moveToCart, removeSavedItem, selectedKeys, toggleSelected, selectAll, deselectAll, selectedItems, selectedSubtotal, selectedCount } = useCart();
  const { t } = useLanguage();
  const { appliedCoupon, loading: couponLoading, validateCoupon, removeCoupon } = useCoupon();
  const { calculateDiscount: calculateAutoDiscount, getActiveRules } = useAutoDiscountRules();
  const { addItem: addToWishlist } = useWishlist();
  const { rates } = useShippingRates();
  const [couponCode, setCouponCode] = useState("");
  const [expandedNotes, setExpandedNotes] = useState<Record<string, boolean>>({});
  const [stockData, setStockData] = useState<Record<string, number>>({});
  const navigate = useNavigate();

  // Fetch real-time stock for cart items
  useEffect(() => {
    const fetchStock = async () => {
      if (items.length === 0) return;
      const productIds = [...new Set(items.map(i => i.id))];
      const { data } = await (await import("@/integrations/supabase/client")).supabase
        .from('products')
        .select('id, quantity')
        .in('id', productIds);
      if (data) {
        const map: Record<string, number> = {};
        data.forEach(p => { map[p.id] = p.quantity; });
        setStockData(map);
      }
    };
    fetchStock();
  }, [items.length]);

  
  const checkoutSubtotal = selectedSubtotal;
  const autoDiscount = calculateAutoDiscount(checkoutSubtotal);
  const activeAutoRules = getActiveRules().filter(rule => 
    rule.rule_type === "cart_total" && rule.min_purchase && checkoutSubtotal >= rule.min_purchase
  );
  
  const couponDiscount = appliedCoupon?.discountAmount || 0;
  const discount = Math.max(couponDiscount, autoDiscount);
  const isAutoDiscountApplied = autoDiscount > couponDiscount && autoDiscount > 0;
  
  // Dynamic shipping cost from DB rates, fallback to default
  const shippingCost = (() => {
    // Find a matching rate based on order amount
    const matchingRate = rates.find(r => 
      r.is_active && 
      (r.min_order_amount === null || checkoutSubtotal >= r.min_order_amount) &&
      (r.max_order_amount === null || checkoutSubtotal <= r.max_order_amount)
    );
    if (matchingRate) return matchingRate.rate;
    // Fallback: free shipping over 2000, else 100
    return checkoutSubtotal >= 2000 ? 0 : 100;
  })();
  const total = checkoutSubtotal - discount + shippingCost;

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    await validateCoupon(couponCode, checkoutSubtotal);
  };

  const handleRemoveCoupon = () => {
    removeCoupon();
    setCouponCode("");
  };

  const handleProceedToCheckout = () => {
    if (selectedItems.length === 0) {
      toast.error("Please select at least one item to checkout");
      return;
    }
    navigate("/checkout", {
      state: isAutoDiscountApplied ? {
        autoDiscount, autoDiscountRuleName: activeAutoRules[0]?.name || "Auto Discount",
      } : appliedCoupon ? {
        couponId: appliedCoupon.coupon.id, couponCode: appliedCoupon.coupon.code, discountAmount: appliedCoupon.discountAmount,
      } : undefined,
    });
  };

  const handleShareCart = () => {
    const cartSummary = items.map(i => `${i.name} x${i.quantity}`).join('\n');
    const text = `My Cart:\n${cartSummary}\nTotal: ${formatPrice(subtotal)}`;
    if (navigator.share) {
      navigator.share({ title: 'My Shopping Cart', text });
    } else {
      navigator.clipboard.writeText(text);
      toast.success("Cart copied to clipboard!");
    }
  };

  const handleMoveToWishlist = (item: typeof items[0]) => {
    addToWishlist(item.id);
    removeItem(item.id, item.size, item.color);
  };

  const getItemKey = (item: { id: string; size?: string; color?: string }) => `${item.id}-${item.size}-${item.color}`;

  const handleQuantityInput = (item: typeof items[0], value: string) => {
    const num = parseInt(value, 10);
    const maxStock = stockData[item.id] ?? 99;
    if (!isNaN(num) && num > 0 && num <= maxStock) {
      updateQuantity(item.id, num, item.size, item.color);
    } else if (!isNaN(num) && num > maxStock) {
      updateQuantity(item.id, maxStock, item.size, item.color);
      toast.error(`Only ${maxStock} available in stock`);
    }
  };

  const getStockWarning = (item: typeof items[0]) => {
    const stock = stockData[item.id];
    if (stock === undefined) return null;
    if (stock <= 0) return { text: "Out of Stock", critical: true };
    if (stock <= 5) return { text: `Only ${stock} left in stock`, critical: false };
    if (item.quantity > stock) return { text: `Only ${stock} available`, critical: true };
    return null;
  };

  if (items.length === 0 && savedItems.length === 0) {
    return (
      <>
        <div className="container mx-auto px-4 py-16 text-center">
          <div className="w-32 h-32 mx-auto mb-6 rounded-full bg-store-muted flex items-center justify-center">
            <ShoppingBag className="w-16 h-16 text-muted-foreground" />
          </div>
          <h1 className="font-display text-2xl font-bold mb-3">{t('store.cartEmpty')}</h1>
          <p className="text-muted-foreground mb-8 max-w-md mx-auto">
            {t('store.cartEmptyDesc')}
          </p>
          <Button size="lg" className="bg-store-primary hover:bg-store-primary/90" asChild>
            <Link to="/products">{t('store.startShopping')}</Link>
          </Button>
        </div>
      </>
    );
  }

  return (
    <>
      <SEOHead title={t('store.shoppingCart')} description="Review your shopping cart items and proceed to checkout." canonicalPath="/cart" noIndex />
      {/* Page Header */}
      <section className="relative bg-gradient-to-r from-store-primary to-store-secondary py-10 overflow-hidden">
        <div className="absolute -top-20 -right-20 w-72 h-72 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-store-accent/10 rounded-full blur-3xl" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
              <ShoppingBag className="h-5 w-5 text-store-primary-foreground" />
            </div>
            <div>
              <h1 className="font-display text-2xl md:text-3xl font-bold text-store-primary-foreground">
                {t('store.shoppingCart')}
              </h1>
              <p className="text-store-primary-foreground/70 text-sm">{items.length} {items.length === 1 ? 'item' : 'items'} in your bag</p>
            </div>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-8">
        {/* Free Shipping Progress Bar */}
        <FreeShippingProgress subtotal={checkoutSubtotal} threshold={2000} className="mb-6" />

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-3">
                <Checkbox
                  checked={items.length > 0 && selectedKeys.size === items.length}
                  onCheckedChange={(checked) => checked ? selectAll() : deselectAll()}
                />
                <p className="text-muted-foreground">
                  {selectedKeys.size > 0 
                    ? `${selectedKeys.size} of ${items.length} selected`
                    : `${items.length} ${items.length === 1 ? 'item' : 'items'} in your cart`
                  }
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={handleShareCart}>
                  <Share2 className="h-4 w-4 mr-1" /> {t('store.share')}
                </Button>
                <Button variant="ghost" size="sm" onClick={clearCart}>
                  {t('store.clearCart')}
                </Button>
              </div>
            </div>

            {items.map((item) => {
              const key = getItemKey(item);
              const isSelected = selectedKeys.has(key);
              return (
                <Card key={key} className={`transition-colors ${isSelected ? 'ring-2 ring-store-primary/30' : 'opacity-70'}`}>
                  <CardContent className="p-4">
                    <div className="flex gap-4">
                      <div className="flex items-start pt-1">
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => toggleSelected(key)}
                        />
                      </div>
                      <Link to={`/product/${item.id}`} className="flex-shrink-0">
                        <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-lg overflow-hidden bg-muted">
                          <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                        </div>
                      </Link>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between gap-2">
                          <div>
                            <Link to={`/product/${item.id}`}>
                              <h3 className="font-medium text-foreground hover:text-store-primary transition-colors">{item.name}</h3>
                            </Link>
                            {(item.size || item.color) && (
                              <p className="text-sm text-muted-foreground mt-1">
                                {item.size && `${t('store.sizeLabel')}: ${item.size}`}{item.size && item.color && ' • '}{item.color && `${t('store.colorLabel')}: ${item.color}`}
                              </p>
                            )}
                            {/* Stock Warning */}
                            {(() => {
                              const warning = getStockWarning(item);
                              if (warning) return (
                                <p className={`text-xs mt-1 flex items-center gap-1 ${warning.critical ? 'text-destructive font-medium' : 'text-warning'}`}>
                                  <AlertTriangle className="h-3 w-3" /> {warning.text}
                                </p>
                              );
                              return null;
                            })()}
                            {/* Estimated Delivery */}
                            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                              <PackageCheck className="h-3 w-3" /> {t('store.estimatedDelivery')}
                            </p>
                          </div>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive flex-shrink-0"
                            onClick={() => removeItem(item.id, item.size, item.color)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>

                        <div className="flex items-center justify-between mt-4">
                          <div className="flex items-center gap-1 border rounded-lg">
                            <Button variant="ghost" size="icon" className="h-8 w-8"
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
                              className="w-12 h-8 text-center border-0 p-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            />
                            <Button variant="ghost" size="icon" className="h-8 w-8"
                              onClick={() => {
                                const maxStock = stockData[item.id] ?? 99;
                                if (item.quantity >= maxStock) {
                                  toast.error(`Only ${maxStock} available in stock`);
                                  return;
                                }
                                updateQuantity(item.id, item.quantity + 1, item.size, item.color);
                              }}
                              disabled={stockData[item.id] !== undefined && item.quantity >= stockData[item.id]}
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-foreground">{formatPrice(item.price * item.quantity)}</p>
                            {item.comparePrice && (
                              <p className="text-sm text-muted-foreground line-through">{formatPrice(item.comparePrice * item.quantity)}</p>
                            )}
                          </div>
                        </div>

                        {/* Action buttons */}
                        <div className="flex gap-2 mt-3 flex-wrap">
                          <Button variant="ghost" size="sm" className="h-7 text-xs px-2"
                            onClick={() => saveForLater(item.id, item.size, item.color)}
                          >
                            <Bookmark className="h-3 w-3 mr-1" /> {t('store.saveForLater')}
                          </Button>
                          <Button variant="ghost" size="sm" className="h-7 text-xs px-2"
                            onClick={() => handleMoveToWishlist(item)}
                          >
                            <Heart className="h-3 w-3 mr-1" /> {t('store.wishlist')}
                          </Button>
                          <Button variant="ghost" size="sm" className="h-7 text-xs px-2"
                            onClick={() => setExpandedNotes(prev => ({ ...prev, [key]: !prev[key] }))}
                          >
                            <MessageSquare className="h-3 w-3 mr-1" /> {item.note ? t('store.editNote') : t('store.addNote')}
                          </Button>
                        </div>

                        {/* Item Note */}
                        {expandedNotes[key] && (
                          <div className="mt-2">
                            <Input
                              placeholder="e.g. Gift wrap this item"
                              value={item.note || ''}
                              onChange={(e) => updateItemNote(item.id, e.target.value.slice(0, 200), item.size, item.color)}
                              maxLength={200}
                              className="h-8 text-sm"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}

            {/* Saved for Later */}
            {savedItems.length > 0 && (
              <div className="mt-8">
                <h2 className="font-display text-lg font-semibold mb-4 flex items-center gap-2">
                  <Bookmark className="h-5 w-5" /> {t('store.savedForLater')} ({savedItems.length})
                </h2>
                <div className="space-y-3">
                  {savedItems.map((item) => (
                    <Card key={getItemKey(item)} className="bg-muted/30">
                      <CardContent className="p-3">
                        <div className="flex gap-3 items-center">
                          <div className="w-16 h-16 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                            <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-sm truncate">{item.name}</h4>
                            <p className="text-sm font-semibold">{formatPrice(item.price)}</p>
                          </div>
                          <div className="flex gap-1">
                            <Button variant="outline" size="sm" className="h-8 text-xs"
                              onClick={() => moveToCart(item.id, item.size, item.color)}
                            >{t('store.moveToCart')}
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive"
                              onClick={() => removeSavedItem(item.id, item.size, item.color)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            <Button variant="outline" asChild>
              <Link to="/products">
                <ArrowLeft className="h-4 w-4 mr-2" /> {t('store.continueShopping')}
              </Link>
            </Button>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle>{t('store.orderSummary')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Coupon Code */}
                {appliedCoupon ? (
                  <div className="flex items-center justify-between p-3 bg-store-accent/10 rounded-lg border border-store-accent">
                    <div className="flex items-center gap-2">
                      <Tag className="h-4 w-4 text-store-accent" />
                      <div>
                        <p className="font-medium text-sm">{appliedCoupon.coupon.code}</p>
                        <p className="text-xs text-muted-foreground">
                          {appliedCoupon.coupon.discount_type === 'percentage'
                            ? `${appliedCoupon.coupon.discount_value}% off`
                            : `${formatPrice(appliedCoupon.coupon.discount_value)} off`}
                        </p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" onClick={handleRemoveCoupon} className="text-destructive hover:text-destructive">
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Input
                      placeholder={t('store.couponCode')}
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      onKeyDown={(e) => e.key === 'Enter' && handleApplyCoupon()}
                    />
                    <Button variant="outline" onClick={handleApplyCoupon} disabled={couponLoading || !couponCode.trim()}>
                      {couponLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : t('store.apply')}
                    </Button>
                  </div>
                )}

                <Separator />

                {/* Totals */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{t('store.subtotal')} ({selectedCount} {t('store.items')})</span>
                    <span>{formatPrice(checkoutSubtotal)}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-sm text-store-accent">
                      <span className="flex items-center gap-1">
                        {isAutoDiscountApplied && <Sparkles className="h-3 w-3" />}
                        {isAutoDiscountApplied ? "Auto Discount" : t('store.discount')}
                      </span>
                      <span>-{formatPrice(discount)}</span>
                    </div>
                  )}
                  {isAutoDiscountApplied && activeAutoRules.length > 0 && (
                    <p className="text-xs text-store-accent">✨ {activeAutoRules[0].name} applied!</p>
                  )}
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{t('store.shipping')}</span>
                    <span className={shippingCost === 0 ? 'text-green-600 dark:text-green-400' : ''}>{shippingCost === 0 ? t('store.free') : formatPrice(shippingCost)}</span>
                  </div>
                </div>

                <Separator />

                <div className="flex justify-between font-semibold text-lg">
                  <span>{t('store.total')}</span>
                  <span>{formatPrice(total)}</span>
                </div>

                <Button size="lg" className="w-full bg-store-primary hover:bg-store-primary/90" onClick={handleProceedToCheckout} disabled={selectedItems.length === 0}>
                  {t('store.proceedToCheckout')} ({selectedCount} {t('store.items')})
                </Button>

                <p className="text-xs text-center text-muted-foreground">Taxes calculated at checkout</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}
