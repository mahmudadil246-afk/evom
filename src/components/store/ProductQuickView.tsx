import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { ShoppingBag, Heart, Minus, Plus, Layers, Package, ShoppingCart, Check, Box } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { useCart } from "@/contexts/CartContext";
import { useWishlist } from "@/contexts/WishlistContext";
import { useProductVariants } from "@/hooks/useProductVariants";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { formatPrice } from "@/lib/formatPrice";

interface QuickViewProduct {
  id: string;
  name: string;
  slug?: string;
  price: number;
  compare_price: number | null;
  image_url: string | null;
  category: string | null;
  stock: number;
  product_type?: string | null;
  created_at?: string | null;
}

interface GroupChildProduct {
  id: string;
  name: string;
  price: number;
  images: string[];
  quantity: number;
  selected: boolean;
  childQuantity: number;
}

interface BundleChildProduct {
  id: string;
  name: string;
  price: number;
  images: string[];
  quantity: number;
  bundleQty: number;
}

interface ProductQuickViewProps {
  product: QuickViewProduct;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProductQuickView({ product, open, onOpenChange }: ProductQuickViewProps) {
  const { addItem } = useCart();
  const { addItem: addToWishlist, removeItem: removeFromWishlist, isInWishlist } = useWishlist();
  const { variants } = useProductVariants(open ? product.id : null);
  const { t } = useLanguage();
  const inWishlist = isInWishlist(product.id);

  const [quantity, setQuantity] = useState(1);
  const [selectedVariant, setSelectedVariant] = useState<string | null>(null);
  const [fullProduct, setFullProduct] = useState<{ description: string | null; images: string[] } | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [groupChildren, setGroupChildren] = useState<GroupChildProduct[]>([]);
  const [bundleChildren, setBundleChildren] = useState<BundleChildProduct[]>([]);

  const isSimple = !product.product_type || product.product_type === "simple";
  const isVariable = product.product_type === "variable";
  const isGrouped = product.product_type === "grouped";
  const isBundle = product.product_type === "bundle";

  // Fetch full product details + children when modal opens
  useEffect(() => {
    if (!open) return;
    setQuantity(1);
    setSelectedVariant(null);
    setSelectedImageIndex(0);
    setGroupChildren([]);
    setBundleChildren([]);

    const fetchDetails = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("products")
        .select("description, images")
        .eq("id", product.id)
        .single();
      if (data) {
        setFullProduct({ description: data.description, images: data.images || [] });
      }

      // Fetch grouped children
      if (isGrouped) {
        const { data: groupItems } = await supabase
          .from("product_group_items")
          .select("child_product_id, quantity")
          .eq("parent_product_id", product.id)
          .order("sort_order", { ascending: true });
        if (groupItems && groupItems.length > 0) {
          const childIds = groupItems.map((g: any) => g.child_product_id);
          const { data: childProducts } = await supabase
            .from("products")
            .select("id, name, price, images, quantity")
            .in("id", childIds);
          if (childProducts) {
            const ordered = childIds.map((cid) => {
              const cp = (childProducts as any[]).find((p) => p.id === cid);
              return cp ? { id: cp.id, name: cp.name, price: Number(cp.price), images: cp.images || [], quantity: cp.quantity || 0, selected: true, childQuantity: 1 } : null;
            }).filter(Boolean) as GroupChildProduct[];
            setGroupChildren(ordered);
          }
        }
      }

      // Fetch bundle children
      if (isBundle) {
        const { data: bundleItems } = await supabase
          .from("product_group_items")
          .select("child_product_id, quantity")
          .eq("parent_product_id", product.id)
          .order("sort_order", { ascending: true });
        if (bundleItems && bundleItems.length > 0) {
          const childIds = bundleItems.map((b: any) => b.child_product_id);
          const { data: childProducts } = await supabase
            .from("products")
            .select("id, name, price, images, quantity")
            .in("id", childIds);
          if (childProducts) {
            const ordered = childIds.map((cid, idx) => {
              const cp = (childProducts as any[]).find((p) => p.id === cid);
              const bi = (bundleItems as any[])[idx];
              return cp ? { id: cp.id, name: cp.name, price: Number(cp.price), images: cp.images || [], quantity: cp.quantity || 0, bundleQty: bi?.quantity || 1 } : null;
            }).filter(Boolean) as BundleChildProduct[];
            setBundleChildren(ordered);
          }
        }
      }

      setLoading(false);
    };
    fetchDetails();
  }, [open, product.id]);

  const images = fullProduct?.images?.length ? fullProduct.images : [product.image_url || "/placeholder.svg"];

  const activeVariant = useMemo(() => {
    if (!selectedVariant) return null;
    return variants.find((v) => v.id === selectedVariant) || null;
  }, [selectedVariant, variants]);

  // Price calculations per type
  const selectedGroupChildren = groupChildren.filter((c) => c.selected);

  const displayPrice = isGrouped
    ? selectedGroupChildren.reduce((sum, c) => sum + c.price * c.childQuantity, 0)
    : isBundle
      ? product.price
      : activeVariant?.price ?? product.price;

  const displayComparePrice = isGrouped
    ? null
    : isBundle
      ? (bundleChildren.reduce((sum, c) => sum + c.price * c.bundleQty, 0) || null)
      : activeVariant?.compare_at_price ?? product.compare_price;

  const displayStock = isGrouped
    ? (selectedGroupChildren.length > 0 ? Math.min(...selectedGroupChildren.map((c) => Math.floor(c.quantity / c.childQuantity))) : 0)
    : activeVariant ? (activeVariant.quantity || 0) : product.stock;

  const discount = displayComparePrice && displayComparePrice > displayPrice
    ? Math.round((1 - displayPrice / displayComparePrice) * 100)
    : 0;

  const handleAddToCart = () => {
    if (isVariable && variants.length > 0 && !selectedVariant) {
      toast.error(t('store.pleaseSelectVariant'));
      return;
    }
    if (isGrouped) {
      if (selectedGroupChildren.length === 0) {
        toast.error(t('store.pleaseSelectProduct'));
        return;
      }
      selectedGroupChildren.forEach((child) => {
        addItem({
          id: child.id,
          name: child.name,
          price: child.price,
          image: child.images[0] || "/placeholder.svg",
        }, child.childQuantity);
      });
      toast.success(`${selectedGroupChildren.length} ${t('store.itemsAddedToCart')}`);
      onOpenChange(false);
      return;
    }

    const imageUrl = activeVariant?.image_url || images[0];
    addItem(
      {
        id: product.id,
        name: product.name + (activeVariant ? ` - ${activeVariant.name}` : ""),
        price: displayPrice,
        comparePrice: displayComparePrice || undefined,
        image: imageUrl,
        size: activeVariant?.name || undefined,
      },
      quantity
    );
    toast.success(t('store.addedToCart'));
    onOpenChange(false);
  };

  const handleWishlistToggle = () => {
    if (inWishlist) removeFromWishlist(product.id);
    else addToWishlist(product.id);
  };

  const toggleGroupChild = (childId: string) => {
    setGroupChildren((prev) => prev.map((c) => c.id === childId ? { ...c, selected: !c.selected } : c));
  };

  const updateChildQuantity = (childId: string, qty: number) => {
    setGroupChildren((prev) => prev.map((c) => c.id === childId ? { ...c, childQuantity: Math.max(1, Math.min(c.quantity, qty)) } : c));
  };

  const productTypeLabel = isSimple ? "Simple" : isVariable ? "Variable" : isGrouped ? "Grouped" : "Bundle";
  const ProductTypeIcon = isVariable ? Layers : isGrouped ? ShoppingCart : isBundle ? Package : Box;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-0">
          {/* Image Section */}
          <div className="relative bg-muted">
            <img
              src={images[selectedImageIndex] || "/placeholder.svg"}
              alt={product.name}
              className="w-full aspect-square object-cover"
            />
            <div className="absolute top-3 left-3 flex flex-col gap-1.5">
              {discount > 0 && (
                <Badge className="bg-store-secondary text-store-primary-foreground">
                  {discount}% OFF
                </Badge>
              )}
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-background/80 backdrop-blur-sm">
                <ProductTypeIcon className="h-2.5 w-2.5 mr-0.5" />
                {productTypeLabel}
              </Badge>
            </div>
            {images.length > 1 && (
              <div className="flex gap-1.5 p-3 overflow-x-auto">
                {images.slice(0, 5).map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedImageIndex(i)}
                    className={cn(
                      "w-14 h-14 rounded border-2 overflow-hidden flex-shrink-0 transition-colors",
                      selectedImageIndex === i ? "border-store-primary" : "border-transparent"
                    )}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Details Section */}
          <div className="p-5 flex flex-col gap-3">
            <DialogHeader className="p-0 space-y-1">
              <p className="text-xs text-muted-foreground">{product.category}</p>
              <DialogTitle className="text-lg font-semibold text-foreground leading-snug">
                {product.name}
              </DialogTitle>
            </DialogHeader>

            {/* Price */}
            <div className="flex items-baseline gap-2">
              {isGrouped && <span className="text-xs text-muted-foreground">{t('common.total')}: </span>}
              <span className="text-2xl font-bold text-foreground">
                {formatPrice(displayPrice)}
              </span>
              {displayComparePrice && displayComparePrice > displayPrice && (
                <span className="text-sm text-muted-foreground line-through">
                  {formatPrice(displayComparePrice)}
                </span>
              )}
              {isBundle && discount > 0 && (
                <Badge className="bg-store-secondary/10 text-store-secondary border-store-secondary/20 text-xs">
                  {t('store.save')} {discount}%
                </Badge>
              )}
            </div>

            {/* Stock */}
            {!isGrouped && (
              <p className={cn("text-sm font-medium", displayStock > 0 ? "text-success" : "text-destructive")}>
                {displayStock > 0 ? `${t('store.inStock')} (${displayStock})` : t('store.outOfStock')}
              </p>
            )}

            {/* Description */}
            {fullProduct?.description && (
              <p className="text-sm text-muted-foreground line-clamp-3">
                {fullProduct.description.replace(/<[^>]*>/g, "").slice(0, 200)}
                {fullProduct.description.length > 200 ? "..." : ""}
              </p>
            )}

            <Separator />

            {/* VARIABLE: Variant Selection */}
            {isVariable && variants.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-foreground">{t('store.selectVariant')}</p>
                <div className="flex flex-wrap gap-2">
                  {variants
                    .filter((v) => v.is_active)
                    .map((variant) => (
                      <Button
                        key={variant.id}
                        variant={selectedVariant === variant.id ? "default" : "outline"}
                        size="sm"
                        className={cn(
                          "text-xs",
                          selectedVariant === variant.id && "bg-store-primary hover:bg-store-primary/90"
                        )}
                        onClick={() => setSelectedVariant(variant.id)}
                        disabled={(variant.quantity || 0) === 0}
                      >
                        {variant.name}
                        {(variant.quantity || 0) === 0 && ` (${t('store.outOfStock')})`}
                      </Button>
                    ))}
                </div>
              </div>
            )}

            {/* GROUPED: Child Product Selection */}
            {isGrouped && groupChildren.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-foreground">{t('store.selectProducts')} ({selectedGroupChildren.length}/{groupChildren.length})</p>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {groupChildren.map((child) => (
                    <div key={child.id} className={cn(
                      "flex items-center gap-3 p-2 rounded-lg border transition-colors",
                      child.selected ? "border-store-primary/30 bg-store-primary/5" : "border-border"
                    )}>
                      <Checkbox
                        checked={child.selected}
                        onCheckedChange={() => toggleGroupChild(child.id)}
                      />
                      <img src={child.images[0] || "/placeholder.svg"} alt={child.name} className="w-10 h-10 rounded object-cover" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{child.name}</p>
                        <p className="text-xs text-muted-foreground">{formatPrice(child.price)}</p>
                      </div>
                      {child.selected && (
                        <div className="flex items-center border rounded-md">
                          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => updateChildQuantity(child.id, child.childQuantity - 1)}>
                            <Minus className="h-2.5 w-2.5" />
                          </Button>
                          <span className="w-6 text-center text-xs">{child.childQuantity}</span>
                          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => updateChildQuantity(child.id, child.childQuantity + 1)}>
                            <Plus className="h-2.5 w-2.5" />
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* BUNDLE: Included Items */}
            {isBundle && bundleChildren.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-foreground">{t('store.bundleIncludes')} ({bundleChildren.length} {t('store.items')})</p>
                <div className="space-y-1.5 max-h-40 overflow-y-auto">
                  {bundleChildren.map((child) => (
                    <div key={child.id} className="flex items-center gap-3 p-2 rounded-lg bg-muted/50">
                      <Check className="h-3.5 w-3.5 text-success flex-shrink-0" />
                      <img src={child.images[0] || "/placeholder.svg"} alt={child.name} className="w-9 h-9 rounded object-cover" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{child.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {child.bundleQty > 1 ? `${child.bundleQty}x ` : ""}{formatPrice(child.price)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity */}
            {displayStock > 0 && !isGrouped && (
              <div className="flex items-center gap-3">
                <p className="text-sm font-medium text-foreground">{t('store.quantity')}</p>
                <div className="flex items-center border rounded-md">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setQuantity(Math.max(1, quantity - 1))}>
                    <Minus className="h-3 w-3" />
                  </Button>
                  <span className="w-10 text-center text-sm font-medium">{quantity}</span>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setQuantity(Math.min(displayStock, quantity + 1))}>
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2 mt-auto pt-2">
              <Button
                className="flex-1 bg-store-primary hover:bg-store-primary/90"
                onClick={handleAddToCart}
                disabled={displayStock === 0 && !isGrouped}
              >
                <ShoppingBag className="h-4 w-4 mr-2" />
                {isGrouped
                  ? `${t('store.addItemsToCart')} (${selectedGroupChildren.length})`
                  : isBundle
                    ? t('store.addBundleToCart')
                    : displayStock === 0
                      ? t('store.outOfStock')
                      : t('store.addToCart')}
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={handleWishlistToggle}
                className={inWishlist ? "text-store-secondary" : ""}
              >
                <Heart className={cn("h-4 w-4", inWishlist && "fill-current")} />
              </Button>
            </div>

            {/* View Full Details */}
            <Link
              to={`/product/${product.slug || product.id}`}
              onClick={() => onOpenChange(false)}
              className="text-sm text-store-primary hover:underline text-center"
            >
              {t('store.viewFullDetails')} →
            </Link>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
