import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";
import { Package, Edit, X, Tag, Layers } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Product } from "./ProductCard";
import { useProductVariants } from "@/hooks/useProductVariants";
import { formatPrice } from "@/lib/formatPrice";

interface ProductViewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: Product | null;
  onEdit?: (product: Product) => void;
}

const colorNames: Record<string, string> = {
  "#000000": "Black", "#FFFFFF": "White", "#EF4444": "Red", "#3B82F6": "Blue",
  "#22C55E": "Green", "#EAB308": "Yellow", "#EC4899": "Pink", "#A855F7": "Purple",
  "#F97316": "Orange", "#6B7280": "Gray",
};

const getStatusColor = (status: Product["status"]) => {
  switch (status) {
    case "active": return "bg-success/10 text-success border-success/20";
    case "draft": return "bg-warning/10 text-warning border-warning/20";
    default: return "bg-muted text-muted-foreground";
  }
};

export function ProductViewModal({ open, onOpenChange, product, onEdit }: ProductViewModalProps) {
  if (!product) return null;

  const { variants } = useProductVariants(open ? product.id : null);

  const stockStatus = product.stock === 0
    ? { label: "Out of Stock", color: "text-destructive" }
    : product.stock <= 10
      ? { label: "Low Stock", color: "text-warning" }
      : { label: "In Stock", color: "text-success" };

  const discount = product.comparePrice
    ? Math.round((1 - product.price / product.comparePrice) * 100)
    : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto bg-card p-0">
        <DialogHeader className="px-6 pt-6 pb-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2 text-lg">
              <Package className="h-5 w-5 text-primary" />
              Product Details
            </DialogTitle>
            <div className="flex items-center gap-2">
              {onEdit && (
                <Button size="sm" variant="outline" onClick={() => { onOpenChange(false); onEdit(product); }}>
                  <Edit className="mr-1.5 h-3.5 w-3.5" />Edit
                </Button>
              )}
              <Button size="sm" variant="ghost" onClick={() => onOpenChange(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="grid md:grid-cols-2 gap-6 p-6">
          {/* Left — Image */}
          <div className="space-y-3">
            <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-muted border border-border">
              <img src={product.image} alt={product.name} className="h-full w-full object-contain" />
              {discount > 0 && (
                <Badge className="absolute bottom-3 left-3 bg-accent text-accent-foreground font-semibold">
                  {discount}% OFF
                </Badge>
              )}
              <Badge variant="outline" className={cn("absolute right-3 top-3 capitalize", getStatusColor(product.status))}>
                {product.status}
              </Badge>
            </div>

            {/* Additional images */}
            {product.images && product.images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {product.images.slice(0, 5).map((img, i) => (
                  <div key={i} className="h-16 w-16 rounded-lg bg-muted border border-border overflow-hidden shrink-0">
                    <img src={img} alt="" className="h-full w-full object-cover" />
                  </div>
                ))}
                {product.images.length > 5 && (
                  <div className="h-16 w-16 rounded-lg bg-muted border border-border flex items-center justify-center shrink-0">
                    <span className="text-xs text-muted-foreground font-medium">+{product.images.length - 5}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right — Info */}
          <div className="space-y-5">
            {/* Title & Category */}
            <div>
              <div className="flex items-center gap-2 mb-1">
                <p className="text-sm text-muted-foreground">{product.category}</p>
                {product.brand && <Badge variant="outline" className="text-xs">{product.brand}</Badge>}
                {product.product_type && product.product_type !== "simple" && (
                  <Badge variant="secondary" className="text-xs capitalize">{product.product_type}</Badge>
                )}
              </div>
              <h2 className="text-2xl font-bold text-foreground leading-tight">{product.name}</h2>
            </div>

            {/* Price */}
            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-bold text-foreground">{formatPrice(product.price)}</span>
              {product.comparePrice && (
                <span className="text-lg text-muted-foreground line-through">{formatPrice(product.comparePrice)}</span>
              )}
              {discount > 0 && (
                <Badge variant="secondary" className="text-xs font-semibold">
                  Save {formatPrice(((product.comparePrice || 0) - product.price))}
                </Badge>
              )}
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-3">
              <Card className="border-border/60">
                <CardContent className="p-3">
                  <p className="text-xs text-muted-foreground mb-0.5">Stock</p>
                  <p className={cn("text-sm font-semibold", stockStatus.color)}>
                    {product.stock} units — {stockStatus.label}
                  </p>
                </CardContent>
              </Card>
              <Card className="border-border/60">
                <CardContent className="p-3">
                  <p className="text-xs text-muted-foreground mb-0.5">SKU</p>
                  <p className="text-sm font-semibold text-foreground font-mono">{product.sku || "N/A"}</p>
                </CardContent>
              </Card>
            </div>

            {/* Sizes */}
            {product.sizes && product.sizes.length > 0 && (
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Available Sizes</p>
                <div className="flex flex-wrap gap-1.5">
                  {product.sizes.map((size) => (
                    <Badge key={size} variant="outline" className="px-3 py-1 text-xs font-medium">{size}</Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Colors */}
            {product.colors && product.colors.length > 0 && (
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Available Colors</p>
                <div className="flex flex-wrap gap-2">
                  {product.colors.map((color) => (
                    <div key={color} className="flex items-center gap-1.5 px-2 py-1 rounded-full border border-border bg-muted/30">
                      <div className="h-4 w-4 rounded-full border border-border/60" style={{ backgroundColor: color }} />
                      <span className="text-xs text-foreground">{colorNames[color] || color}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Variants */}
            {variants.length > 0 && (
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1">
                  <Layers className="h-3.5 w-3.5" />Variants ({variants.length})
                </p>
                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  {variants.map((v) => (
                    <div key={v.id} className="flex items-center justify-between px-3 py-2 rounded-lg bg-muted/40 border border-border/40">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-foreground">{v.name}</span>
                        {v.sku && <span className="text-xs text-muted-foreground font-mono">SKU: {v.sku}</span>}
                      </div>
                      <div className="flex items-center gap-3 text-sm">
                        {v.price != null && <span className="font-semibold text-foreground">{formatPrice(v.price)}</span>}
                        <Badge variant="outline" className={cn("text-xs", (v.quantity || 0) === 0 ? "text-destructive" : (v.quantity || 0) <= 5 ? "text-warning" : "text-success")}>
                          {v.quantity || 0} units
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Description sections — full width */}
        {(product.short_description || product.description) && (
          <div className="px-6 pb-6 space-y-4">
            <Separator />
            {product.short_description && (
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Short Description</p>
                <div
                  className="prose prose-sm max-w-none dark:prose-invert text-foreground prose-img:rounded-lg prose-img:max-w-2xl prose-img:mx-auto prose-img:block prose-img:object-contain prose-table:border prose-table:border-border prose-th:bg-muted prose-th:p-2 prose-td:p-2 prose-td:border prose-td:border-border [&_iframe]:w-full [&_iframe]:max-w-2xl [&_iframe]:mx-auto [&_iframe]:aspect-video [&_iframe]:rounded-lg [&_iframe]:my-4 [&_iframe]:block [&_div[style*='padding-bottom']]:relative [&_div[style*='padding-bottom']]:max-w-2xl [&_div[style*='padding-bottom']]:mx-auto [&_div[style*='padding-bottom']]:rounded-lg [&_div[style*='padding-bottom']]:overflow-hidden"
                  dangerouslySetInnerHTML={{ __html: product.short_description }}
                />
              </div>
            )}
            {product.description && (
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Description</p>
                <div
                  className="prose prose-sm max-w-none dark:prose-invert text-foreground prose-img:rounded-lg prose-img:max-w-2xl prose-img:mx-auto prose-img:block prose-img:object-contain prose-video:rounded-lg prose-video:max-w-2xl prose-video:mx-auto prose-table:border prose-table:border-border prose-th:bg-muted prose-th:p-2 prose-td:p-2 prose-td:border prose-td:border-border prose-th:border prose-th:border-border [&_iframe]:w-full [&_iframe]:max-w-2xl [&_iframe]:mx-auto [&_iframe]:aspect-video [&_iframe]:rounded-lg [&_iframe]:my-4 [&_iframe]:block [&_div[style*='padding-bottom']]:relative [&_div[style*='padding-bottom']]:max-w-2xl [&_div[style*='padding-bottom']]:mx-auto [&_div[style*='padding-bottom']]:rounded-lg [&_div[style*='padding-bottom']]:overflow-hidden"
                  dangerouslySetInnerHTML={{ __html: product.description }}
                />
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
