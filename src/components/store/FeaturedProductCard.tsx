import { Link } from "react-router-dom";
import { Heart } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useCart } from "@/contexts/CartContext";
import { useWishlist } from "@/contexts/WishlistContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { formatPrice } from "@/lib/formatPrice";

interface FeaturedProductCardProps {
  product: {
    id: string;
    name: string;
    slug?: string;
    price: number;
    compare_at_price: number | null;
    images: string[];
    category: string | null;
  };
  isNew?: boolean;
}

export function FeaturedProductCard({ product, isNew }: FeaturedProductCardProps) {
  const { addItem } = useCart();
  const { addItem: addToWishlist, removeItem: removeFromWishlist, isInWishlist } = useWishlist();
  const { t } = useLanguage();

  const imageUrl = product.images.length > 0 ? product.images[0] : "/placeholder.svg";
  const secondImage = product.images.length > 1 ? product.images[1] : null;
  const discount = product.compare_at_price
    ? Math.round((1 - product.price / product.compare_at_price) * 100)
    : 0;
  const wishlisted = isInWishlist(product.id);

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    addItem({ id: product.id, name: product.name, price: product.price, comparePrice: product.compare_at_price || undefined, image: imageUrl });
  };

  const handleWishlistToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (wishlisted) {
      removeFromWishlist(product.id);
    } else {
      addToWishlist(product.id);
    }
  };

  return (
    <Card className="group overflow-hidden border-0 shadow-md hover:shadow-xl transition-all duration-300">
      <Link to={`/product/${product.slug || product.id}`} className="relative aspect-[3/4] overflow-hidden block">
        <img src={imageUrl} alt={product.name} className={`w-full h-full object-cover transition-all duration-500 group-hover:scale-110 ${secondImage ? "group-hover:opacity-0" : ""}`} loading="lazy" />
        {secondImage && (
          <img src={secondImage} alt={product.name} className="absolute inset-0 w-full h-full object-cover opacity-0 group-hover:opacity-100 transition-all duration-500 group-hover:scale-110" loading="lazy" />
        )}
        <div className="absolute top-3 left-3 flex flex-col gap-2">
          {isNew && <Badge className="bg-store-highlight text-store-primary-foreground">{t('store.new')}</Badge>}
          {discount > 0 && <Badge className="bg-store-secondary text-store-primary-foreground">{discount}% OFF</Badge>}
        </div>
        {/* Wishlist Heart */}
        <button
          onClick={handleWishlistToggle}
          className={`absolute top-3 right-3 w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300 ${
            wishlisted
              ? "bg-red-500 text-white scale-100"
              : "bg-white/80 text-muted-foreground opacity-0 group-hover:opacity-100 hover:bg-white hover:text-red-500"
          }`}
          aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
        >
          <Heart className={`h-4 w-4 ${wishlisted ? "fill-current" : ""}`} />
        </button>
        <div className="absolute inset-x-0 bottom-0 p-3 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
          <Button className="w-full bg-store-primary hover:bg-store-primary/90" onClick={handleQuickAdd}>{t('store.quickAdd')}</Button>
        </div>
      </Link>
      <CardContent className="p-4">
        <p className="text-xs text-muted-foreground mb-1">{product.category || t('store.uncategorized')}</p>
        <Link to={`/product/${product.slug || product.id}`}>
          <h3 className="font-medium text-foreground hover:text-store-primary transition-colors line-clamp-1">{product.name}</h3>
        </Link>
        <div className="flex items-center gap-2 mt-2">
          <span className="font-bold text-foreground">{formatPrice(product.price)}</span>
          {product.compare_at_price && <span className="text-sm text-muted-foreground line-through">{formatPrice(product.compare_at_price)}</span>}
        </div>
      </CardContent>
    </Card>
  );
}
