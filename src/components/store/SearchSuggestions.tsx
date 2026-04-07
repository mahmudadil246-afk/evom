import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Search, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { OptimizedImage } from "@/components/ui/optimized-image";
import { formatPrice } from "@/lib/formatPrice";

interface SuggestionProduct {
  id: string;
  name: string;
  slug: string;
  price: number;
  compare_at_price: number | null;
  first_image: string | null;
}

interface SearchSuggestionsProps {
  query: string;
  visible: boolean;
  onClose: () => void;
  onSelect: (query: string) => void;
}

export function SearchSuggestions({ query, visible, onClose, onSelect }: SearchSuggestionsProps) {
  const [results, setResults] = useState<SuggestionProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!query || query.length < 2) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      const { data } = await supabase
        .from("products")
        .select("id, name, slug, price, compare_at_price, images")
        .eq("is_active", true)
        .is("deleted_at", null)
        .ilike("name", `%${query}%`)
        .limit(6);

      if (data) {
        setResults(
          data.map((p) => ({
            id: p.id,
            name: p.name,
            slug: p.slug,
            price: p.price,
            compare_at_price: p.compare_at_price,
            first_image: (p.images as string[])?.[0] || null,
          }))
        );
      }
      setLoading(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  if (!visible || query.length < 2) return null;

  return (
    <div
      ref={containerRef}
      className="absolute top-full left-0 right-0 mt-1 bg-background border border-store-muted rounded-xl shadow-xl z-50 overflow-hidden max-h-[400px] overflow-y-auto"
    >
      {loading && (
        <div className="p-4 text-center text-sm text-muted-foreground">Searching...</div>
      )}

      {!loading && results.length === 0 && (
        <div className="p-4 text-center text-sm text-muted-foreground">
          No products found for "<span className="font-medium text-foreground">{query}</span>"
        </div>
      )}

      {!loading && results.length > 0 && (
        <>
          <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b border-store-muted/50">
            Products
          </div>
          {results.map((product) => (
            <button
              key={product.id}
              className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-store-muted/40 transition-colors text-left"
              onClick={() => {
                navigate(`/products/${product.slug}`);
                onClose();
              }}
            >
              <div className="w-10 h-10 rounded-lg bg-store-muted/30 overflow-hidden shrink-0">
                {product.first_image ? (
                  <OptimizedImage
                    src={product.first_image}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Search className="h-4 w-4 text-muted-foreground" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{product.name}</p>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-store-primary">
                    {formatPrice(product.price)}
                  </span>
                  {product.compare_at_price && product.compare_at_price > product.price && (
                    <span className="text-xs line-through text-muted-foreground">
                      {formatPrice(product.compare_at_price)}
                    </span>
                  )}
                </div>
              </div>
            </button>
          ))}
          <button
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 text-sm font-medium text-store-primary hover:bg-store-muted/30 border-t border-store-muted/50 transition-colors"
            onClick={() => {
              onSelect(query);
              onClose();
            }}
          >
            <TrendingUp className="h-4 w-4" />
            See all results for "{query}"
          </button>
        </>
      )}
    </div>
  );
}
