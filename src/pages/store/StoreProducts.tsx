import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { Filter, Grid3X3, LayoutList, SlidersHorizontal, X, Star, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

import { SEOHead } from "@/components/SEOHead";
import { StoreProductCard } from "@/components/store/StoreProductCard";
import { supabase } from "@/integrations/supabase/client";
import { ProductGridSkeleton, FilterSkeleton } from "@/components/skeletons";
import { useLanguage } from "@/contexts/LanguageContext";
import { formatPrice } from "@/lib/formatPrice";
import { useCategoriesCache } from "@/hooks/useCategoriesCache";

interface Product {
  id: string;
  name: string;
  price: number;
  compare_at_price: number | null;
  images: string[];
  category: string | null;
  brand: string | null;
  tags: string[] | null;
  is_active: boolean;
  quantity: number;
  created_at: string;
  product_type: string | null;
  avgRating?: number;
  variantColors?: string[];
  variantSizes?: string[];
}

// Sort options will be created inside the component to use t()

/* ─── Collapsible Filter Section ─── */
function FilterSection({ title, defaultOpen = true, children }: { title: string; defaultOpen?: boolean; children: React.ReactNode }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger className="flex items-center justify-between w-full group">
        <h4 className="font-medium text-sm uppercase tracking-wide text-muted-foreground">{title}</h4>
        <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
      </CollapsibleTrigger>
      <CollapsibleContent className="pt-3">
        {children}
      </CollapsibleContent>
    </Collapsible>
  );
}

/* ─── Reusable Filter Panel ─── */
function FilterPanel({
  dbCategories, selectedCategories, toggleCategory,
  dbBrands, selectedBrands, toggleBrand,
  priceRange, setPriceRange,
  dbColors, selectedColors, toggleColor,
  dbSizes, selectedSizes, toggleSize,
  minRating, setMinRating,
  stockStatus, setStockStatus,
  dbTags, selectedTags, toggleTag,
  showSale, setShowSale,
  showNew, setShowNew,
  clearFilters, onApply,
}: {
  dbCategories: string[];
  selectedCategories: string[];
  toggleCategory: (cat: string) => void;
  dbBrands: string[];
  selectedBrands: string[];
  toggleBrand: (b: string) => void;
  priceRange: number[];
  setPriceRange: (v: number[]) => void;
  dbColors: { name: string; code: string | null }[];
  selectedColors: string[];
  toggleColor: (c: string) => void;
  dbSizes: string[];
  selectedSizes: string[];
  toggleSize: (s: string) => void;
  minRating: number;
  setMinRating: (r: number) => void;
  stockStatus: "all" | "in-stock" | "out-of-stock";
  setStockStatus: (v: "all" | "in-stock" | "out-of-stock") => void;
  dbTags: string[];
  selectedTags: string[];
  toggleTag: (t: string) => void;
  showSale: boolean;
  setShowSale: (v: boolean) => void;
  showNew: boolean;
  setShowNew: (v: boolean) => void;
  clearFilters: () => void;
  onApply?: () => void;
}) {
  return (
    <div className="space-y-5">
      {/* Categories */}
      {dbCategories.length > 0 && (
        <FilterSection title="Categories">
          <div className="space-y-2">
            {dbCategories.map((cat) => (
              <label key={cat} className="flex items-center gap-2 cursor-pointer text-sm">
                <Checkbox checked={selectedCategories.includes(cat)} onCheckedChange={() => toggleCategory(cat)} />
                <span>{cat}</span>
              </label>
            ))}
          </div>
        </FilterSection>
      )}

      {/* Brands */}
      {dbBrands.length > 0 && (
        <FilterSection title="Brands">
          <div className="space-y-2">
            {dbBrands.map((brand) => (
              <label key={brand} className="flex items-center gap-2 cursor-pointer text-sm">
                <Checkbox checked={selectedBrands.includes(brand)} onCheckedChange={() => toggleBrand(brand)} />
                <span>{brand}</span>
              </label>
            ))}
          </div>
        </FilterSection>
      )}

      {/* Price Range */}
      <FilterSection title="Price Range">
        <Slider value={priceRange} onValueChange={setPriceRange} max={10000} step={100} className="mb-2" />
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>{formatPrice(priceRange[0])}</span>
          <span>{formatPrice(priceRange[1])}</span>
        </div>
      </FilterSection>

      {/* Colors */}
      {dbColors.length > 0 && (
        <FilterSection title="Colors">
          <div className="flex flex-wrap gap-2">
            {dbColors.map((color) => {
              const isSelected = selectedColors.includes(color.name);
              return (
                <button
                  key={color.name}
                  onClick={() => toggleColor(color.name)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs transition-colors ${
                    isSelected ? "border-primary bg-primary/10 text-primary" : "border-border text-foreground hover:border-primary/50"
                  }`}
                  title={color.name}
                >
                  {color.code && (
                    <span
                      className="w-3 h-3 rounded-full border border-border/50 shrink-0"
                      style={{ backgroundColor: color.code }}
                    />
                  )}
                  <span>{color.name}</span>
                </button>
              );
            })}
          </div>
        </FilterSection>
      )}

      {/* Sizes */}
      {dbSizes.length > 0 && (
        <FilterSection title="Sizes">
          <div className="flex flex-wrap gap-1.5">
            {dbSizes.map((size) => {
              const isSelected = selectedSizes.includes(size);
              return (
                <button
                  key={size}
                  onClick={() => toggleSize(size)}
                  className={`px-2.5 py-1 rounded border text-xs font-medium transition-colors ${
                    isSelected ? "border-primary bg-primary text-primary-foreground" : "border-border text-foreground hover:border-primary/50"
                  }`}
                >
                  {size}
                </button>
              );
            })}
          </div>
        </FilterSection>
      )}

      {/* Rating */}
      <FilterSection title="Rating">
        <div className="space-y-1.5">
          {[4, 3, 2, 1].map((r) => (
            <button
              key={r}
              onClick={() => setMinRating(minRating === r ? 0 : r)}
              className={`flex items-center gap-1.5 w-full px-2 py-1 rounded text-sm transition-colors ${
                minRating === r ? "bg-primary/10 text-primary" : "hover:bg-muted"
              }`}
            >
              <div className="flex">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className={`h-3.5 w-3.5 ${i < r ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30"}`} />
                ))}
              </div>
              <span>& Up</span>
            </button>
          ))}
        </div>
      </FilterSection>

      {/* Stock Status */}
      <FilterSection title="Availability">
        <div className="space-y-2">
          {([["all", "All"], ["in-stock", "In Stock"], ["out-of-stock", "Out of Stock"]] as const).map(([val, label]) => (
            <label key={val} className="flex items-center gap-2 cursor-pointer text-sm">
              <Checkbox
                checked={stockStatus === val}
                onCheckedChange={() => setStockStatus(val)}
              />
              <span>{label}</span>
            </label>
          ))}
        </div>
      </FilterSection>

      {/* Tags */}
      {dbTags.length > 0 && (
        <FilterSection title="Tags" defaultOpen={false}>
          <div className="space-y-2">
            {dbTags.map((tag) => (
              <label key={tag} className="flex items-center gap-2 cursor-pointer text-sm">
                <Checkbox checked={selectedTags.includes(tag)} onCheckedChange={() => toggleTag(tag)} />
                <span>{tag}</span>
              </label>
            ))}
          </div>
        </FilterSection>
      )}

      {/* Quick Filters */}
      <FilterSection title="Quick Filters">
        <div className="space-y-2">
          <label className="flex items-center gap-2 cursor-pointer text-sm">
            <Checkbox checked={showSale} onCheckedChange={(checked) => setShowSale(checked as boolean)} />
            <span>On Sale</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer text-sm">
            <Checkbox checked={showNew} onCheckedChange={(checked) => setShowNew(checked as boolean)} />
            <span>New Arrivals</span>
          </label>
        </div>
      </FilterSection>

      <div className="flex gap-3">
        <Button variant="outline" className="flex-1" onClick={clearFilters}>Clear All</Button>
        {onApply && (
          <Button className="flex-1 bg-store-primary hover:bg-store-primary/90" onClick={onApply}>Apply</Button>
        )}
      </div>
    </div>
  );
}

export default function StoreProducts() {
  const { t } = useLanguage();
  const [searchParams] = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [filtersOpen, setFiltersOpen] = useState(false);

  // DB-driven filter options
  const [dbCategories, setDbCategories] = useState<string[]>([]);
  const [dbBrands, setDbBrands] = useState<string[]>([]);
  const [dbColors, setDbColors] = useState<{ name: string; code: string | null }[]>([]);
  const [dbSizes, setDbSizes] = useState<string[]>([]);
  const [dbTags, setDbTags] = useState<string[]>([]);
  const [ratingMap, setRatingMap] = useState<Record<string, number>>({});

  // Filter state
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    searchParams.get("category")?.split(",").filter(Boolean) || []
  );
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState([0, 10000]);
  const [sortBy, setSortBy] = useState(searchParams.get("sort") || "newest");
  const [showSale, setShowSale] = useState(searchParams.get("filter") === "sale");
  const [showNew, setShowNew] = useState(searchParams.get("filter") === "new");
  const [minRating, setMinRating] = useState(0);
  const [stockStatus, setStockStatus] = useState<"all" | "in-stock" | "out-of-stock">("all");

  // Use shared categories cache instead of separate fetch
  const { data: cachedCategories } = useCategoriesCache();
  
  useEffect(() => {
    if (cachedCategories) {
      setDbCategories(cachedCategories.map(c => c.name));
    }
  }, [cachedCategories]);

  useEffect(() => {
    fetchProducts();
    fetchBrands();
    fetchVariantOptions();
    fetchRatings();
  }, []);

  const fetchBrands = async () => {
    const { data } = await supabase.from("products").select("brand").eq("is_active", true).is("deleted_at", null).not("brand", "is", null);
    if (data) {
      const unique = [...new Set(data.map((p: any) => p.brand).filter(Boolean))].sort();
      setDbBrands(unique);
    }
  };

  const fetchVariantOptions = async () => {
    const { data } = await supabase.from("product_variants").select("color, color_code, size");
    if (data) {
      const colorMap = new Map<string, string | null>();
      const sizeSet = new Set<string>();
      for (const v of data as any[]) {
        if (v.color) colorMap.set(v.color, v.color_code || null);
        if (v.size) sizeSet.add(v.size);
      }
      setDbColors(Array.from(colorMap.entries()).map(([name, code]) => ({ name, code })).sort((a, b) => a.name.localeCompare(b.name)));
      setDbSizes(Array.from(sizeSet).sort());
    }
  };

  const fetchRatings = async () => {
    const { data } = await supabase.from("product_reviews").select("product_id, rating");
    if (data && data.length > 0) {
      const sums: Record<string, { total: number; count: number }> = {};
      for (const r of data as any[]) {
        if (!sums[r.product_id]) sums[r.product_id] = { total: 0, count: 0 };
        sums[r.product_id].total += r.rating;
        sums[r.product_id].count += 1;
      }
      const map: Record<string, number> = {};
      for (const [pid, s] of Object.entries(sums)) map[pid] = s.total / s.count;
      setRatingMap(map);
    }
  };

  const fetchProducts = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("products")
      .select("id, name, slug, price, compare_at_price, images, category, brand, tags, is_active, quantity, created_at, product_type")
      .eq("is_active", true)
      .is("deleted_at", null);

    if (!error && data) {
      const variableProductIds = data.filter(p => p.product_type === 'variable').map(p => p.id);
      let variantStockMap: Record<string, number> = {};
      let variantColorsMap: Record<string, string[]> = {};
      let variantSizesMap: Record<string, string[]> = {};

      if (variableProductIds.length > 0) {
        const { data: variants } = await supabase
          .from("product_variants")
          .select("product_id, quantity, color, size")
          .in("product_id", variableProductIds);
        if (variants) {
          for (const v of variants as any[]) {
            variantStockMap[v.product_id] = (variantStockMap[v.product_id] || 0) + (v.quantity || 0);
            if (v.color) {
              if (!variantColorsMap[v.product_id]) variantColorsMap[v.product_id] = [];
              if (!variantColorsMap[v.product_id].includes(v.color)) variantColorsMap[v.product_id].push(v.color);
            }
            if (v.size) {
              if (!variantSizesMap[v.product_id]) variantSizesMap[v.product_id] = [];
              if (!variantSizesMap[v.product_id].includes(v.size)) variantSizesMap[v.product_id].push(v.size);
            }
          }
        }
      }

      const groupedProductIds = data.filter(p => p.product_type === 'grouped').map(p => p.id);
      let groupStockMap: Record<string, number> = {};
      let groupPriceMap: Record<string, number> = {};
      if (groupedProductIds.length > 0) {
        const { data: groupItems } = await supabase
          .from("product_group_items")
          .select("parent_product_id, child_product_id")
          .in("parent_product_id", groupedProductIds);
        if (groupItems && groupItems.length > 0) {
          const childIds = [...new Set(groupItems.map((g: any) => g.child_product_id))];
          const { data: childProducts } = await supabase
            .from("products")
            .select("id, quantity, price")
            .in("id", childIds);
          if (childProducts) {
            const childMap: Record<string, { quantity: number; price: number }> = {};
            for (const cp of childProducts as any[]) {
              childMap[cp.id] = { quantity: cp.quantity || 0, price: Number(cp.price) || 0 };
            }
            for (const gi of groupItems as any[]) {
              const child = childMap[gi.child_product_id];
              if (!child) continue;
              const pid = gi.parent_product_id;
              groupStockMap[pid] = groupStockMap[pid] === undefined ? child.quantity : Math.min(groupStockMap[pid], child.quantity);
              if (!groupPriceMap[pid] || child.price < groupPriceMap[pid]) groupPriceMap[pid] = child.price;
            }
          }
        }
      }

      // Collect tags
      const allTags = new Set<string>();
      for (const p of data) {
        if (p.tags && Array.isArray(p.tags)) {
          for (const t of p.tags) if (typeof t === 'string') allTags.add(t);
        }
      }
      setDbTags(Array.from(allTags).sort());

      setProducts(data.map(p => {
        let qty = p.quantity;
        let price = Number(p.price);
        if (p.product_type === 'variable') {
          qty = variantStockMap[p.id] ?? p.quantity;
        } else if (p.product_type === 'grouped') {
          qty = groupStockMap[p.id] ?? p.quantity;
          if ((!price || price === 0) && groupPriceMap[p.id]) price = groupPriceMap[p.id];
        }
        return {
          id: p.id, name: p.name, slug: (p as any).slug || undefined, price,
          compare_at_price: p.compare_at_price ? Number(p.compare_at_price) : null,
          images: p.images || [], category: p.category,
          brand: (p as any).brand || null,
          tags: Array.isArray(p.tags) ? p.tags as string[] : null,
          is_active: p.is_active ?? true, quantity: qty,
          created_at: p.created_at, product_type: p.product_type,
          variantColors: variantColorsMap[p.id] || [],
          variantSizes: variantSizesMap[p.id] || [],
        };
      }));
    }
    setLoading(false);
  };

  const filteredProducts = useMemo(() => {
    let result = [...products];
    if (search) {
      const s = search.toLowerCase();
      result = result.filter(p => p.name.toLowerCase().includes(s) || p.category?.toLowerCase().includes(s));
    }
    if (selectedCategories.length > 0) {
      result = result.filter(p => selectedCategories.some(cat => p.category?.toLowerCase() === cat.toLowerCase()));
    }
    if (selectedBrands.length > 0) {
      result = result.filter(p => p.brand && selectedBrands.some(b => b.toLowerCase() === p.brand!.toLowerCase()));
    }
    result = result.filter(p => p.price >= priceRange[0] && p.price <= priceRange[1]);
    if (selectedColors.length > 0) {
      result = result.filter(p => p.variantColors && p.variantColors.some(c => selectedColors.includes(c)));
    }
    if (selectedSizes.length > 0) {
      result = result.filter(p => p.variantSizes && p.variantSizes.some(s => selectedSizes.includes(s)));
    }
    if (minRating > 0) {
      result = result.filter(p => (ratingMap[p.id] || 0) >= minRating);
    }
    if (stockStatus === "in-stock") result = result.filter(p => p.quantity > 0);
    if (stockStatus === "out-of-stock") result = result.filter(p => p.quantity <= 0);
    if (selectedTags.length > 0) {
      result = result.filter(p => p.tags && selectedTags.some(t => p.tags!.includes(t)));
    }
    if (showSale) result = result.filter(p => p.compare_at_price && p.compare_at_price > p.price);
    if (showNew) {
      const d = new Date(); d.setDate(d.getDate() - 30);
      result = result.filter(p => new Date(p.created_at) > d);
    }
    switch (sortBy) {
      case "price-asc": result.sort((a, b) => a.price - b.price); break;
      case "price-desc": result.sort((a, b) => b.price - a.price); break;
      case "name": result.sort((a, b) => a.name.localeCompare(b.name)); break;
    }
    return result;
  }, [products, search, selectedCategories, selectedBrands, priceRange, selectedColors, selectedSizes, minRating, stockStatus, selectedTags, sortBy, showSale, showNew, ratingMap]);

  const toggle = (setter: React.Dispatch<React.SetStateAction<string[]>>) => (val: string) => {
    setter(prev => prev.includes(val) ? prev.filter(v => v !== val) : [...prev, val]);
  };

  const clearFilters = () => {
    setSearch(""); setSelectedCategories([]); setSelectedBrands([]); setSelectedColors([]);
    setSelectedSizes([]); setSelectedTags([]); setPriceRange([0, 10000]);
    setShowSale(false); setShowNew(false); setSortBy("newest");
    setMinRating(0); setStockStatus("all");
  };

  const activeFilterCount = [
    search, selectedCategories.length > 0, selectedBrands.length > 0,
    priceRange[0] > 0 || priceRange[1] < 10000,
    selectedColors.length > 0, selectedSizes.length > 0,
    minRating > 0, stockStatus !== "all", selectedTags.length > 0,
    showSale, showNew,
  ].filter(Boolean).length;

  const getProductForCard = (product: Product) => ({
    id: product.id, name: product.name, slug: (product as any).slug,
    price: product.price, compare_price: product.compare_at_price,
    image_url: product.images.length > 0 ? product.images[0] : null,
    category: product.category, status: product.is_active ? 'active' : 'draft',
    stock: product.quantity, product_type: product.product_type, created_at: product.created_at,
  });

  const filterPanelProps = {
    dbCategories, selectedCategories, toggleCategory: toggle(setSelectedCategories),
    dbBrands, selectedBrands, toggleBrand: toggle(setSelectedBrands),
    priceRange, setPriceRange,
    dbColors, selectedColors, toggleColor: toggle(setSelectedColors),
    dbSizes, selectedSizes, toggleSize: toggle(setSelectedSizes),
    minRating, setMinRating,
    stockStatus, setStockStatus,
    dbTags, selectedTags, toggleTag: toggle(setSelectedTags),
    showSale, setShowSale, showNew, setShowNew, clearFilters,
  };

  const sortOptions = [
    { value: "newest", label: t('storeProducts.newest') },
    { value: "price-asc", label: t('storeProducts.priceLowHigh') },
    { value: "price-desc", label: t('storeProducts.priceHighLow') },
    { value: "name", label: t('storeProducts.nameAZ') },
  ];

  return (
    <>
      <SEOHead
        title={showSale ? t('storeProducts.saleItems') : showNew ? t('storeProducts.newArrivals') : t('storeProducts.allProducts')}
        description="Browse our collection of fashion, clothing and accessories. Filter by category, price and more."
        canonicalPath="/products"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "ItemList",
          name: showSale ? "Sale Items" : showNew ? "New Arrivals" : "All Products",
          url: `${window.location.origin}/products`,
          numberOfItems: filteredProducts.length,
          itemListElement: filteredProducts.slice(0, 20).map((p, i) => ({
            "@type": "ListItem",
            position: i + 1,
            url: `${window.location.origin}/product/${p.id}`,
            name: p.name,
          })),
        }}
      />

      <section className="relative bg-gradient-to-r from-store-primary to-store-secondary py-12 overflow-hidden">
        <div className="absolute -top-20 -right-20 w-72 h-72 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-store-accent/10 rounded-full blur-3xl" />
        <div className="container mx-auto px-4 text-center relative z-10">
          <h1 className="font-display text-3xl md:text-4xl font-bold text-store-primary-foreground mb-2">
            {showSale ? t('storeProducts.saleItems') : showNew ? t('storeProducts.newArrivals') : t('storeProducts.allProducts')}
          </h1>
          <p className="text-store-primary-foreground/80">
            {filteredProducts.length} {t('storeProducts.productsAvailable')}
          </p>
        </div>
      </section>

      <div className="container mx-auto px-4 py-8">
        <div className="flex gap-8">
          {/* ─── Desktop Fixed Sidebar ─── */}
          <aside className="hidden lg:block w-[260px] shrink-0">
            <div className="sticky top-20">
              <ScrollArea className="max-h-[calc(100vh-6rem)] pr-3">
                <h3 className="font-semibold text-base mb-4">{t('storeProducts.filters')}</h3>
                {loading ? <FilterSkeleton /> : <FilterPanel {...filterPanelProps} />}
              </ScrollArea>
            </div>
          </aside>

          {/* ─── Main Content ─── */}
          <div className="flex-1 min-w-0">
            {/* Top Bar */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="flex-1">
                <Input placeholder={t('storeProducts.searchProducts')} value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-sm" />
              </div>
              <div className="flex items-center gap-3">
                <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
                  <SheetTrigger asChild>
                    <Button variant="outline" className="gap-2 lg:hidden">
                      <SlidersHorizontal className="h-4 w-4" />
                      {t('storeProducts.filters')}
                      {activeFilterCount > 0 && (
                        <Badge className="bg-store-primary text-store-primary-foreground ml-1">{activeFilterCount}</Badge>
                      )}
                    </Button>
                  </SheetTrigger>
                  <SheetContent>
                    <SheetHeader><SheetTitle>{t('storeProducts.filters')}</SheetTitle></SheetHeader>
                    <ScrollArea className="h-[calc(100vh-6rem)] py-6">
                      <FilterPanel {...filterPanelProps} onApply={() => setFiltersOpen(false)} />
                    </ScrollArea>
                  </SheetContent>
                </Sheet>

                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-44"><SelectValue placeholder="Sort by" /></SelectTrigger>
                  <SelectContent>
                    {sortOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <div className="hidden sm:flex border rounded-lg">
                  <Button variant={viewMode === "grid" ? "secondary" : "ghost"} size="icon" onClick={() => setViewMode("grid")}>
                    <Grid3X3 className="h-4 w-4" />
                  </Button>
                  <Button variant={viewMode === "list" ? "secondary" : "ghost"} size="icon" onClick={() => setViewMode("list")}>
                    <LayoutList className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Active Filters */}
            {activeFilterCount > 0 && (
              <div className="flex flex-wrap gap-2 mb-6">
                {search && (
                  <Badge variant="secondary" className="gap-1">
                    Search: {search}
                    <X className="h-3 w-3 cursor-pointer" onClick={() => setSearch("")} />
                  </Badge>
                )}
                {selectedCategories.map((cat) => (
                  <Badge key={cat} variant="secondary" className="gap-1">
                    {cat}
                    <X className="h-3 w-3 cursor-pointer" onClick={() => toggle(setSelectedCategories)(cat)} />
                  </Badge>
                ))}
                {selectedBrands.map((b) => (
                  <Badge key={b} variant="secondary" className="gap-1">
                    {b}
                    <X className="h-3 w-3 cursor-pointer" onClick={() => toggle(setSelectedBrands)(b)} />
                  </Badge>
                ))}
                {selectedColors.map((c) => (
                  <Badge key={c} variant="secondary" className="gap-1">
                    {c}
                    <X className="h-3 w-3 cursor-pointer" onClick={() => toggle(setSelectedColors)(c)} />
                  </Badge>
                ))}
                {selectedSizes.map((s) => (
                  <Badge key={s} variant="secondary" className="gap-1">
                    Size: {s}
                    <X className="h-3 w-3 cursor-pointer" onClick={() => toggle(setSelectedSizes)(s)} />
                  </Badge>
                ))}
                {minRating > 0 && (
                  <Badge variant="secondary" className="gap-1">
                    {minRating}★ & Up
                    <X className="h-3 w-3 cursor-pointer" onClick={() => setMinRating(0)} />
                  </Badge>
                )}
                {stockStatus !== "all" && (
                  <Badge variant="secondary" className="gap-1">
                    {stockStatus === "in-stock" ? "In Stock" : "Out of Stock"}
                    <X className="h-3 w-3 cursor-pointer" onClick={() => setStockStatus("all")} />
                  </Badge>
                )}
                {selectedTags.map((t) => (
                  <Badge key={t} variant="secondary" className="gap-1">
                    #{t}
                    <X className="h-3 w-3 cursor-pointer" onClick={() => toggle(setSelectedTags)(t)} />
                  </Badge>
                ))}
                {showSale && (
                  <Badge variant="secondary" className="gap-1">
                    On Sale
                    <X className="h-3 w-3 cursor-pointer" onClick={() => setShowSale(false)} />
                  </Badge>
                )}
                <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={clearFilters}>
                  {t('storeProducts.clearAllFilters')}
                </Button>
              </div>
            )}

            {/* Products Grid */}
            {loading ? (
              <ProductGridSkeleton count={6} />
            ) : filteredProducts.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-store-muted flex items-center justify-center">
                  <Filter className="w-10 h-10 text-muted-foreground" />
                </div>
                <h3 className="font-display text-xl font-semibold mb-2">{t('storeProducts.noProducts')}</h3>
                <p className="text-muted-foreground mb-4">{t('storeProducts.adjustFilters')}</p>
                <Button variant="outline" onClick={clearFilters}>{t('storeProducts.clearFilters')}</Button>
              </div>
            ) : (
              <div className={viewMode === "grid" ? "grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6" : "space-y-4"}>
                {filteredProducts.map((product) => (
                  <StoreProductCard key={product.id} product={getProductForCard(product)} viewMode={viewMode} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
