import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/LanguageContext';
import { formatPrice } from "@/lib/formatPrice";

interface RelatedProduct {
  id: string;
  name: string;
  price: number;
  compare_at_price: number | null;
  images: string[];
  category: string | null;
}

interface RelatedProductsGridProps {
  products: RelatedProduct[];
}

export function RelatedProductsGrid({ products }: RelatedProductsGridProps) {
  const { t } = useLanguage();
  if (products.length === 0) return null;

  return (
    <div className="mt-12">
      <h2 className="font-display text-2xl font-bold mb-6">{t('store.relatedProducts')}</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {products.map((rp) => {
          const rpDiscount = rp.compare_at_price ? Math.round((1 - rp.price / rp.compare_at_price) * 100) : 0;
          return (
            <Link key={rp.id} to={`/product/${rp.id}`} className="group">
              <Card className="overflow-hidden border-0 shadow-md hover:shadow-xl transition-all">
                <div className="relative aspect-[3/4] overflow-hidden bg-muted">
                  <img src={rp.images?.[0] || '/placeholder.svg'} alt={rp.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                  {rpDiscount > 0 && <Badge className="absolute top-3 left-3 bg-store-secondary text-store-primary-foreground">{rpDiscount}% OFF</Badge>}
                </div>
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground mb-1">{rp.category}</p>
                  <h3 className="font-medium text-foreground line-clamp-1">{rp.name}</h3>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="font-bold">{formatPrice(rp.price)}</span>
                    {rp.compare_at_price && <span className="text-sm text-muted-foreground line-through">{formatPrice(rp.compare_at_price)}</span>}
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
