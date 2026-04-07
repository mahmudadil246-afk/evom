import { Link } from 'react-router-dom';
import { Heart, ShoppingBag, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { DelayedLoader } from "@/components/ui/DelayedLoader";
import { ProductGridSkeleton } from "@/components/skeletons";
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SEOHead } from '@/components/SEOHead';
import { useWishlist } from '@/contexts/WishlistContext';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';
import { formatPrice } from "@/lib/formatPrice";

export default function Wishlist() {
  const { items, loading, removeItem } = useWishlist();
  const { addItem: addToCart } = useCart();
  const { user } = useAuth();
  const { t } = useLanguage();

  const handleAddToCart = (item: typeof items[0]) => {
    const imageUrl = item.images && item.images.length > 0 ? item.images[0] : '/placeholder.svg';
    addToCart({ id: item.product_id, name: item.name, price: item.price, comparePrice: item.compare_at_price || undefined, image: imageUrl });
    toast.success('Added to cart');
  };

  const handleRemove = async (productId: string) => { await removeItem(productId); };

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }}>
          <div className="w-32 h-32 mx-auto mb-6 rounded-full bg-store-muted flex items-center justify-center">
            <Heart className="w-16 h-16 text-muted-foreground" />
          </div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <h1 className="font-display text-2xl font-bold mb-3">{t('store.loginToViewWishlist')}</h1>
          <p className="text-muted-foreground mb-8 max-w-md mx-auto">{t('store.signInToSave')}</p>
          <Button size="lg" className="bg-store-primary hover:bg-store-primary/90" asChild><Link to="/login">{t('store.signIn')}</Link></Button>
        </motion.div>
      </div>
    );
  }

  if (loading) {
    return (
      <DelayedLoader>
        <div className="container mx-auto px-4 py-8">
          <ProductGridSkeleton count={8} />
        </div>
      </DelayedLoader>
    );
  }

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5, type: "spring" }}>
          <div className="w-32 h-32 mx-auto mb-6 rounded-full bg-store-muted flex items-center justify-center">
            <Heart className="w-16 h-16 text-muted-foreground" />
          </div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <h1 className="font-display text-2xl font-bold mb-3">{t('store.wishlistEmpty')}</h1>
          <p className="text-muted-foreground mb-8 max-w-md mx-auto">{t('store.wishlistEmptyDesc')}</p>
          <Button size="lg" className="bg-store-primary hover:bg-store-primary/90" asChild><Link to="/products">{t('store.browseProducts')}</Link></Button>
        </motion.div>
      </div>
    );
  }

  return (
    <>
      <SEOHead title={t('store.myWishlist')} description="Your saved favorite products." canonicalPath="/wishlist" noIndex />

      {/* Hero */}
      <section className="relative bg-gradient-to-r from-store-primary to-store-secondary py-10 overflow-hidden">
        <div className="absolute -top-20 -right-20 w-72 h-72 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-store-accent/10 rounded-full blur-3xl" />
        <div className="container mx-auto px-4 relative z-10">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                <Heart className="h-5 w-5 text-store-primary-foreground" />
              </div>
              <h1 className="font-display text-2xl md:text-3xl font-bold text-store-primary-foreground">My Wishlist</h1>
            </div>
            <p className="text-store-primary-foreground/80 mt-1">{items.length} {items.length === 1 ? t('store.itemSaved') : t('store.itemsSaved')}</p>
          </motion.div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-8">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {items.map((item, index) => {
            const discount = item.compare_at_price ? Math.round((1 - item.price / item.compare_at_price) * 100) : 0;
            const imageUrl = item.images && item.images.length > 0 ? item.images[0] : '/placeholder.svg';
            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05, duration: 0.4 }}
              >
                <Card className="group overflow-hidden border-0 shadow-md hover:shadow-xl transition-all duration-300">
                  <Link to={`/product/${item.product_id}`}>
                    <div className="relative aspect-[3/4] overflow-hidden bg-muted">
                      <img src={imageUrl} alt={item.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                      {discount > 0 && <Badge className="absolute top-3 left-3 bg-store-secondary text-store-primary-foreground">{discount}% OFF</Badge>}
                      {item.quantity === 0 && <div className="absolute inset-0 bg-foreground/50 flex items-center justify-center"><Badge variant="secondary" className="text-lg">{t('store.outOfStock')}</Badge></div>}
                    </div>
                  </Link>
                  <CardContent className="p-4">
                    <p className="text-xs text-muted-foreground mb-1">{item.category}</p>
                    <Link to={`/product/${item.product_id}`}><h3 className="font-medium text-foreground hover:text-store-primary transition-colors line-clamp-1">{item.name}</h3></Link>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="font-bold text-foreground">{formatPrice(item.price)}</span>
                      {item.compare_at_price && <span className="text-sm text-muted-foreground line-through">{formatPrice(item.compare_at_price)}</span>}
                    </div>
                    <div className="flex gap-2 mt-4">
                      <Button className="flex-1 bg-store-primary hover:bg-store-primary/90" onClick={() => handleAddToCart(item)} disabled={item.quantity === 0}><ShoppingBag className="h-4 w-4 mr-2" />{t('store.addToCart')}</Button>
                      <Button variant="outline" size="icon" className="text-destructive hover:text-destructive" onClick={() => handleRemove(item.product_id)}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>
    </>
  );
}