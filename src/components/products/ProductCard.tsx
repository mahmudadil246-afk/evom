import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreVertical, Edit, Trash2, Eye, Package, Copy, AlertTriangle, Star, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatPrice } from "@/lib/formatPrice";

export interface Product {
  id: string;
  name: string;
  slug?: string;
  sku: string;
  price: number;
  comparePrice?: number;
  stock: number;
  category: string;
  status: "active" | "draft";
  image: string;
  images?: string[];
  sizes?: string[];
  colors?: string[];
  description?: string;
  short_description?: string;
  meta_title?: string;
  meta_description?: string;
  meta_keywords?: string[];
  publish_at?: string | null;
  low_stock_threshold?: number;
  relatedProductIds?: string[];
  brand?: string;
  product_type?: "simple" | "variable" | "grouped" | "bundle";
  video_url?: string | null;
  youtube_url?: string | null;
  video_thumbnail?: string | null;
  is_featured?: boolean;
}

interface ProductCardProps {
  product: Product;
  onEdit: (product: Product) => void;
  onDelete: (product: Product) => void;
  onView: (product: Product) => void;
  onDuplicate?: (product: Product) => void;
}

export function ProductCard({ product, onEdit, onDelete, onView, onDuplicate }: ProductCardProps) {
  const getStatusColor = (status: Product["status"]) => {
    switch (status) {
      case "active":
        return "bg-success/10 text-success border-success/20";
      case "draft":
        return "bg-warning/10 text-warning border-warning/20";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const threshold = product.low_stock_threshold || 10;
  const isLowStock = product.stock > 0 && product.stock <= threshold;

  const getStockStatus = (stock: number) => {
    if (stock === 0) return { label: "Out of Stock", color: "text-destructive" };
    if (isLowStock) return { label: "Low Stock", color: "text-warning" };
    return { label: "In Stock", color: "text-success" };
  };

  const stockStatus = getStockStatus(product.stock);

  return (
    <Card className="group overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
      <div className="relative aspect-square overflow-hidden bg-muted">
        <img
          src={product.image}
          alt={product.name}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-foreground/0 transition-colors group-hover:bg-foreground/10" />
        
        {/* Status Badge */}
        <Badge 
          variant="outline" 
          className={cn("absolute left-3 top-3 capitalize", getStatusColor(product.status))}
        >
          {product.status}
        </Badge>

        {/* Featured Star */}
        {product.is_featured && (
          <div className="absolute left-3 top-10">
            <Star className="h-5 w-5 text-warning fill-warning" />
          </div>
        )}

        {/* Quick Actions */}
        <div className="absolute right-3 top-3 opacity-0 transition-opacity group-hover:opacity-100">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="icon" variant="secondary" className="h-8 w-8 bg-card/90 backdrop-blur-sm">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-popover">
              <DropdownMenuItem onClick={() => onView(product)}>
                <Eye className="mr-2 h-4 w-4" />
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => window.open(`/product/${product.slug || product.id}`, '_blank')}>
                <ExternalLink className="mr-2 h-4 w-4" />
                View in Store
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onEdit(product)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit Product
              </DropdownMenuItem>
              {onDuplicate && (
                <DropdownMenuItem onClick={() => onDuplicate(product)}>
                  <Copy className="mr-2 h-4 w-4" />
                  Duplicate
                </DropdownMenuItem>
              )}
              <DropdownMenuItem 
                onClick={() => onDelete(product)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Move to Trash
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Discount Badge */}
        {product.comparePrice && product.comparePrice > product.price && (
          <Badge className="absolute bottom-3 left-3 bg-accent text-accent-foreground">
            {Math.round((1 - product.price / product.comparePrice) * 100)}% OFF
          </Badge>
        )}

        {/* Low Stock Warning */}
        {isLowStock && (
          <div className="absolute bottom-3 right-3">
            <Badge variant="outline" className="bg-warning/10 text-warning border-warning/30 text-xs">
              <AlertTriangle className="h-3 w-3 mr-1" />
              Low Stock
            </Badge>
          </div>
        )}
      </div>

      <CardContent className="p-4">
        <div className="mb-2 flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 mb-0.5">
              <p className="text-xs text-muted-foreground">{product.category}</p>
              {product.product_type && product.product_type !== "simple" && (
                <Badge variant="outline" className="text-[10px] px-1.5 py-0 capitalize">
                  {product.product_type}
                </Badge>
              )}
            </div>
            <h3 className="truncate font-semibold text-foreground">{product.name}</h3>
            {product.brand && (
              <p className="text-xs text-muted-foreground truncate">{product.brand}</p>
            )}
          </div>
        </div>

        <div className="mb-3 flex items-center gap-2">
          <span className="text-lg font-bold text-foreground">{formatPrice(product.price)}</span>
          {product.comparePrice && (
            <span className="text-sm text-muted-foreground line-through">
              {formatPrice(product.comparePrice)}
            </span>
          )}
        </div>

        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-1.5">
            <Package className="h-4 w-4 text-muted-foreground" />
            <span className={cn("font-medium", stockStatus.color)}>
              {product.stock} units
            </span>
          </div>
          <span className="text-muted-foreground">SKU: {product.sku}</span>
        </div>

        {/* Size/Color variants */}
        {(product.sizes || product.colors) && (
          <div className="mt-3 flex flex-wrap gap-1">
            {product.sizes?.slice(0, 3).map((size) => (
              <Badge key={size} variant="outline" className="text-xs">
                {size}
              </Badge>
            ))}
            {product.colors?.slice(0, 3).map((color) => (
              <div
                key={color}
                className="h-5 w-5 rounded-full border border-border"
                style={{ backgroundColor: color }}
                title={color}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}