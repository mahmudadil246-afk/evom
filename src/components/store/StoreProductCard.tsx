import { useState } from "react";
import { Link } from "react-router-dom";
import { ShoppingBag, Heart, Package, Layers, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useCart } from "@/contexts/CartContext";
import { useWishlist } from "@/contexts/WishlistContext";
import { ProductQuickView } from "@/components/store/ProductQuickView";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";
import { formatPrice } from "@/lib/formatPrice";

interface Product {
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

interface StoreProductCardProps {
  product: Product;
  viewMode?: "grid" | "list";
}

export function StoreProductCard({ product, viewMode = "grid" }: StoreProductCardProps) {
  const { addItem } = useCart();
  const { addItem: addToWishlist, removeItem: removeFromWishlist, isInWishlist } = useWishlist();
  const [quickViewOpen, setQuickViewOpen] = useState(false);
  const { t } = useLanguage();

  const inWishlist = isInWishlist(product.id);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      comparePrice: product.compare_price || undefined,
      image: product.image_url || "/placeholder.svg",
    });
  };

  const handleWishlistToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (inWishlist) {
      removeFromWishlist(product.id);
    } else {
      addToWishlist(product.id);
    }
  };

  const discount = product.compare_price 
    ? Math.round((1 - product.price / product.compare_price) * 100)
    : 0;

  const isNew = product.created_at 
    ? (Date.now() - new Date(product.created_at).getTime()) < 7 * 24 * 60 * 60 * 1000
    : false;

  const productUrl = `/product/${product.slug || product.id}`;
  const isVariable = product.product_type === 'variable';
  const isGrouped = product.product_type === 'grouped';
  const isBundle = product.product_type === 'bundle';
  const showFromPrice = isVariable || isGrouped;
  const needsVariantSelection = isVariable || isGrouped;

  if (viewMode === "list") {
    return (
      <Card className="overflow-hidden">
        <div className="flex">
          <Link to={productUrl} className="relative w-32 sm:w-48 flex-shrink-0">
            <img src={product.image_url || "/placeholder.svg"} alt={product.name} className="w-full h-full object-cover aspect-square" loading="lazy" />
            {discount > 0 && (
              <Badge className="absolute top-2 left-2 bg-store-secondary text-store-primary-foreground">{discount}% OFF</Badge>
            )}
            {isNew && !discount && (
              <Badge className="absolute top-2 left-2 bg-store-primary text-store-primary-foreground">{t('store.new')}</Badge>
            )}
          </Link>
          <CardContent className="flex-1 p-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <p className="text-xs text-muted-foreground">{product.category}</p>
                {isBundle && <Badge variant="outline" className="text-[10px] px-1.5 py-0"><Package className="h-2.5 w-2.5 mr-0.5" />{t('store.bundle')}</Badge>}
                {isVariable && <Badge variant="outline" className="text-[10px] px-1.5 py-0"><Layers className="h-2.5 w-2.5 mr-0.5" />{t('store.variable')}</Badge>}
              </div>
              <Link to={productUrl}>
                <h3 className="font-medium text-foreground hover:text-store-primary transition-colors">{product.name}</h3>
              </Link>
              <div className="flex items-center gap-2 mt-2">
                <span className="font-bold text-foreground">
                  {showFromPrice ? `${t('store.from')} ` : ''}{formatPrice(product.price)}
                </span>
                {product.compare_price && (
                  <span className="text-sm text-muted-foreground line-through">{formatPrice(product.compare_price)}</span>
                )}
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <Button 
                className="flex-1 bg-store-primary hover:bg-store-primary/90"
                onClick={needsVariantSelection ? undefined : handleAddToCart}
                asChild={needsVariantSelection}
                disabled={product.stock === 0}
              >
                {needsVariantSelection ? (
                   <Link to={productUrl}>
                    <ShoppingBag className="h-4 w-4 mr-2" />
                    {t('store.selectOptions')}
                  </Link>
                ) : (
                  <>
                    <ShoppingBag className="h-4 w-4 mr-2" />
                    {product.stock === 0 ? t('store.outOfStock') : t('store.addToCart')}
                  </>
                )}
              </Button>
              <Button variant="outline" size="icon" onClick={(e) => { e.preventDefault(); e.stopPropagation(); setQuickViewOpen(true); }}>
                <Eye className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={handleWishlistToggle} className={inWishlist ? "text-store-secondary" : ""}>
                <Heart className={cn("h-4 w-4", inWishlist && "fill-current")} />
              </Button>
            </div>
          </CardContent>
        </div>
      </Card>
    );
  }

  return (
    <>
    <Card className="group overflow-hidden border-0 shadow-md hover:shadow-xl transition-all duration-300">
      <Link to={productUrl}>
        <div className="relative aspect-[3/4] overflow-hidden bg-muted">
          <img src={product.image_url || "/placeholder.svg"} alt={product.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" loading="lazy" />
          <div className="absolute top-3 left-3 flex flex-col gap-1.5">
            {discount > 0 && (
              <Badge className="bg-store-secondary text-store-primary-foreground">{discount}% OFF</Badge>
            )}
            {isNew && !discount && (
              <Badge className="bg-store-primary text-store-primary-foreground">{t('store.new')}</Badge>
            )}
            {isBundle && (
              <Badge variant="outline" className="bg-background/80 backdrop-blur-sm text-xs">
                <Package className="h-3 w-3 mr-1" /> {t('store.bundle')}
              </Badge>
            )}
          </div>
          {product.stock === 0 && (
            <div className="absolute inset-0 bg-foreground/50 flex items-center justify-center">
              <Badge variant="secondary" className="text-lg">{t('store.outOfStock')}</Badge>
            </div>
          )}
          <div className="absolute top-3 right-3 flex flex-col gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button variant="secondary" size="icon" className={cn("rounded-full bg-store-card/90 backdrop-blur-sm", inWishlist && "text-store-secondary")} onClick={handleWishlistToggle}>
              <Heart className={cn("h-4 w-4", inWishlist && "fill-current")} />
            </Button>
            <Button variant="secondary" size="icon" className="rounded-full bg-store-card/90 backdrop-blur-sm" onClick={(e) => { e.preventDefault(); e.stopPropagation(); setQuickViewOpen(true); }}>
              <Eye className="h-4 w-4" />
            </Button>
          </div>
          <div className="absolute inset-x-0 bottom-0 p-3 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
            {needsVariantSelection ? (
              <Button className="w-full bg-store-primary hover:bg-store-primary/90" asChild>
                <Link to={productUrl}>{t('store.selectOptions')}</Link>
              </Button>
            ) : (
              <Button className="w-full bg-store-primary hover:bg-store-primary/90" onClick={handleAddToCart} disabled={product.stock === 0}>
                <ShoppingBag className="h-4 w-4 mr-2" />
                {t('store.addToCart')}
              </Button>
            )}
          </div>
        </div>
      </Link>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-1">
          <p className="text-xs text-muted-foreground">{product.category}</p>
          {isVariable && <Badge variant="outline" className="text-[9px] px-1 py-0">{t('store.variable')}</Badge>}
        </div>
        <Link to={productUrl}>
          <h3 className="font-medium text-foreground hover:text-store-primary transition-colors line-clamp-1">{product.name}</h3>
        </Link>
        <div className="flex items-center gap-2 mt-2">
          <span className="font-bold text-foreground">
            {showFromPrice ? `${t('store.from')} ` : ''}{formatPrice(product.price)}
          </span>
          {product.compare_price && (
            <span className="text-sm text-muted-foreground line-through">{formatPrice(product.compare_price)}</span>
          )}
        </div>
      </CardContent>
    </Card>
    <ProductQuickView product={product} open={quickViewOpen} onOpenChange={setQuickViewOpen} />
    </>
  );
}
