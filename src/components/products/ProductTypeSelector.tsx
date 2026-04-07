import { Box, Layers, Package, ShoppingBag } from "lucide-react";
import { cn } from "@/lib/utils";

const productTypes = [
  {
    value: "simple" as const,
    label: "Simple Product",
    description: "Single product with no variations. Set one price and stock.",
    icon: Box,
  },
  {
    value: "variable" as const,
    label: "Variable Product",
    description: "Color/Size variants with individual pricing & stock per variant.",
    icon: Layers,
  },
  {
    value: "grouped" as const,
    label: "Grouped Product",
    description: "Collection of related independent products sold separately.",
    icon: Package,
  },
  {
    value: "bundle" as const,
    label: "Bundle Product",
    description: "Set of products sold together at a discounted price.",
    icon: ShoppingBag,
  },
];

interface ProductTypeSelectorProps {
  onSelect: (type: "simple" | "variable" | "grouped" | "bundle") => void;
}

export function ProductTypeSelector({ onSelect }: ProductTypeSelectorProps) {
  return (
    <div className="py-4 space-y-4">
      <div className="text-center space-y-1">
        <h3 className="text-lg font-semibold">What type of product?</h3>
        <p className="text-sm text-muted-foreground">
          Select the product type to get started with the right fields.
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {productTypes.map((type) => (
          <button
            key={type.value}
            onClick={() => onSelect(type.value)}
            className={cn(
              "flex flex-col items-start gap-2 p-4 rounded-xl border-2 border-border",
              "bg-card hover:border-primary hover:bg-primary/5",
              "transition-all text-left group cursor-pointer"
            )}
          >
            <div className="flex items-center gap-3 w-full">
              <div className="p-2 rounded-lg bg-muted group-hover:bg-primary/10 transition-colors">
                <type.icon className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
              <span className="font-medium text-sm">{type.label}</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed pl-[52px]">
              {type.description}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
}
