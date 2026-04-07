import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Download,
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  XCircle,
  AlertCircle,
  FileDown,
  FileUp,
  Package,
  Layers,
  BoxSelect,
  Box,
} from "lucide-react";
import { toast } from "sonner";
import type { Product } from "./ProductCard";
import { formatPrice } from "@/lib/formatPrice";

interface ProductImportExportProps {
  products: Product[];
  onImport: (products: Omit<Product, "id">[]) => void;
}

interface ImportResult {
  success: number;
  failed: number;
  errors: { row: number; message: string }[];
  typeCounts: Record<string, number>;
}

const VALID_PRODUCT_TYPES = ["simple", "variable", "grouped", "bundle"] as const;
const VALID_STATUSES = ["active", "draft"] as const;

const PRODUCT_TYPE_LABELS: Record<string, { label: string; icon: typeof Package }> = {
  simple: { label: "Simple", icon: Package },
  variable: { label: "Variable", icon: Layers },
  grouped: { label: "Grouped", icon: BoxSelect },
  bundle: { label: "Bundle", icon: Box },
};

// CSV headers for all product types
const CSV_HEADERS = [
  "name",
  "sku",
  "price",
  "compare_price",
  "stock",
  "category",
  "status",
  "product_type",
  "image",
  "sizes",
  "colors",
  "description",
  "brand",
  "low_stock_threshold",
  "meta_title",
  "meta_description",
  "video_url",
  "youtube_url",
  "is_featured",
  // Variable product fields
  "variant_names",
  "variant_skus",
  "variant_prices",
  "variant_stocks",
  // Grouped/Bundle product fields
  "child_skus",
];

export function ProductImportExport({ products, onImport }: ProductImportExportProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [previewData, setPreviewData] = useState<Omit<Product, "id">[]>([]);

  const escapeCSV = (value: string | number | boolean | undefined | null): string => {
    if (value === null || value === undefined) return "";
    const str = String(value);
    if (str.includes(",") || str.includes('"') || str.includes("\n")) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  // Export products to CSV
  const exportToCSV = () => {
    const csvRows = [
      CSV_HEADERS.join(","),
      ...products.map((p) =>
        [
          escapeCSV(p.name),
          escapeCSV(p.sku),
          p.price,
          p.comparePrice || "",
          p.stock,
          escapeCSV(p.category),
          p.status,
          p.product_type || "simple",
          escapeCSV(p.image),
          escapeCSV((p.sizes || []).join(";")),
          escapeCSV((p.colors || []).join(";")),
          escapeCSV(p.description || ""),
          escapeCSV(p.brand || ""),
          p.low_stock_threshold || 10,
          escapeCSV(p.meta_title || ""),
          escapeCSV(p.meta_description || ""),
          escapeCSV(p.video_url || ""),
          escapeCSV(p.youtube_url || ""),
          p.is_featured ? "true" : "false",
          "", // variant_names - would need variant data
          "", // variant_skus
          "", // variant_prices
          "", // variant_stocks
          "", // child_skus
        ].join(",")
      ),
    ];

    const blob = new Blob(["\ufeff" + csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `products_${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success(`Exported ${products.length} products to CSV`);
  };

  // Export JSON with full product data
  const exportToJSON = () => {
    const jsonContent = JSON.stringify(products, null, 2);
    const blob = new Blob([jsonContent], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `products_${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success(`Exported ${products.length} products to JSON`);
  };

  // Download CSV template with examples for all 4 types
  const downloadTemplate = () => {
    const examples = [
      // Simple product
      [
        '"Basic T-Shirt"', "SKU-001", "1299", "1599", "50",
        '"T-Shirts"', "active", "simple",
        "https://example.com/tshirt.jpg",
        '"S;M;L;XL"', '"#000000;#FFFFFF"',
        '"A comfortable cotton t-shirt"', '"BrandName"', "10",
        '"Basic T-Shirt | Store"', '"High quality cotton t-shirt"',
        "", "", "false", "", "", "", "", "",
      ],
      // Variable product
      [
        '"Designer Sneakers"', "SKU-002", "3999", "4999", "0",
        '"Shoes"', "active", "variable",
        "https://example.com/sneaker.jpg",
        '"38;39;40;41;42"', '"Red;Blue;Black"',
        '"Premium designer sneakers with multiple options"', '"NikeBD"', "5",
        '"Designer Sneakers | Store"', '"Trendy sneakers"',
        "", "", "false",
        '"Size 38;Size 40;Size 42"',
        '"SKU-002-38;SKU-002-40;SKU-002-42"',
        '"3999;3999;4299"',
        '"15;20;10"',
        "",
      ],
      // Grouped product
      [
        '"Summer Collection Set"', "SKU-GRP-001", "0", "", "0",
        '"Collections"', "active", "grouped",
        "https://example.com/collection.jpg",
        "", "",
        '"A curated summer collection"', "", "0",
        '"Summer Collection | Store"', '"Complete summer wardrobe set"',
        "", "", "true", "", "", "", "",
        '"SKU-001;SKU-002"',
      ],
      // Bundle product
      [
        '"Starter Bundle Pack"', "SKU-BDL-001", "4999", "6500", "25",
        '"Bundles"', "active", "bundle",
        "https://example.com/bundle.jpg",
        "", "",
        '"Save 25% with this starter bundle"', "", "5",
        '"Starter Bundle | Store"', '"Great value bundle pack"',
        "", "", "false", "", "", "", "",
        '"SKU-001;SKU-002"',
      ],
    ];

    const csvContent = [
      CSV_HEADERS.join(","),
      ...examples.map((row) => row.join(",")),
    ].join("\n");

    const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "product_import_template.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success("Template downloaded — includes all 4 product types");
  };

  // Parse CSV
  const parseCSV = (text: string): string[][] => {
    const rows: string[][] = [];
    let currentRow: string[] = [];
    let currentCell = "";
    let insideQuotes = false;

    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const nextChar = text[i + 1];

      if (char === '"') {
        if (insideQuotes && nextChar === '"') {
          currentCell += '"';
          i++;
        } else {
          insideQuotes = !insideQuotes;
        }
      } else if (char === "," && !insideQuotes) {
        currentRow.push(currentCell.trim());
        currentCell = "";
      } else if ((char === "\n" || (char === "\r" && nextChar === "\n")) && !insideQuotes) {
        currentRow.push(currentCell.trim());
        if (currentRow.some((cell) => cell !== "")) rows.push(currentRow);
        currentRow = [];
        currentCell = "";
        if (char === "\r") i++;
      } else {
        currentCell += char;
      }
    }

    if (currentCell || currentRow.length > 0) {
      currentRow.push(currentCell.trim());
      if (currentRow.some((cell) => cell !== "")) rows.push(currentRow);
    }

    return rows;
  };

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".csv")) {
      toast.error("Please upload a CSV file");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const rows = parseCSV(text);

      if (rows.length < 2) {
        toast.error("CSV file is empty or invalid");
        return;
      }

      const headers = rows[0].map((h) => h.toLowerCase().replace(/\s+/g, "_"));
      const dataRows = rows.slice(1);

      const parsedProducts: Omit<Product, "id">[] = [];
      const errors: { row: number; message: string }[] = [];
      const typeCounts: Record<string, number> = { simple: 0, variable: 0, grouped: 0, bundle: 0 };

      dataRows.forEach((row, index) => {
        try {
          const getValue = (header: string) => {
            const idx = headers.indexOf(header);
            return idx >= 0 && idx < row.length ? row[idx] : "";
          };

          const name = getValue("name");
          const sku = getValue("sku");
          const priceStr = getValue("price");

          if (!name) {
            errors.push({ row: index + 2, message: "Missing required field: name" });
            return;
          }
          if (!sku) {
            errors.push({ row: index + 2, message: "Missing required field: sku" });
            return;
          }

          // Determine product type
          let productType = (getValue("product_type") || "simple").toLowerCase() as Product["product_type"];
          if (!VALID_PRODUCT_TYPES.includes(productType as any)) {
            errors.push({ row: index + 2, message: `Invalid product_type "${productType}". Use: simple, variable, grouped, bundle` });
            return;
          }

          // Validate status
          let status = (getValue("status") || "draft").toLowerCase() as Product["status"];
          if (!VALID_STATUSES.includes(status as any)) {
            status = "draft";
          }

          const price = parseFloat(priceStr) || 0;

          // For grouped products, price can be 0 (calculated from children)
          if (productType !== "grouped" && price <= 0) {
            errors.push({ row: index + 2, message: `Price must be greater than 0 for ${productType} products` });
            return;
          }

          const product: Omit<Product, "id"> = {
            name,
            sku,
            price,
            comparePrice: parseFloat(getValue("compare_price")) || undefined,
            stock: parseInt(getValue("stock")) || 0,
            category: getValue("category") || "Uncategorized",
            status,
            product_type: productType,
            image: getValue("image") || "/placeholder.svg",
            sizes: getValue("sizes") ? getValue("sizes").split(";").filter(Boolean) : [],
            colors: getValue("colors") ? getValue("colors").split(";").filter(Boolean) : [],
            description: getValue("description") || undefined,
            brand: getValue("brand") || undefined,
            low_stock_threshold: parseInt(getValue("low_stock_threshold")) || 10,
            meta_title: getValue("meta_title") || undefined,
            meta_description: getValue("meta_description") || undefined,
            video_url: getValue("video_url") || undefined,
            youtube_url: getValue("youtube_url") || undefined,
            is_featured: getValue("is_featured") === "true",
          };

          // Type-specific validation
          if (productType === "variable") {
            const variantNames = getValue("variant_names");
            if (!variantNames) {
              errors.push({ row: index + 2, message: "Variable products should include variant_names" });
            }
          }

          if (productType === "grouped" || productType === "bundle") {
            const childSkus = getValue("child_skus");
            if (!childSkus) {
              errors.push({ row: index + 2, message: `${productType} products should include child_skus` });
            }
          }

          typeCounts[productType || "simple"] = (typeCounts[productType || "simple"] || 0) + 1;
          parsedProducts.push(product);
        } catch (err) {
          errors.push({ row: index + 2, message: "Failed to parse row" });
        }
      });

      setPreviewData(parsedProducts);
      setImportResult({ success: parsedProducts.length, failed: errors.length, errors, typeCounts });
      setImportDialogOpen(true);
    };

    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const confirmImport = async () => {
    setImporting(true);
    setImportProgress(0);

    for (let i = 0; i <= 100; i += 10) {
      await new Promise((resolve) => setTimeout(resolve, 100));
      setImportProgress(i);
    }

    onImport(previewData);
    setImporting(false);
    setImportDialogOpen(false);
    toast.success(`Successfully imported ${previewData.length} products`);
  };

  const getTypeIcon = (type: string) => {
    const config = PRODUCT_TYPE_LABELS[type];
    if (!config) return Package;
    return config.icon;
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="gap-2">
            <FileSpreadsheet className="h-4 w-4" />
            Import/Export
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52 bg-popover">
          <DropdownMenuItem onClick={() => fileInputRef.current?.click()}>
            <Upload className="mr-2 h-4 w-4" />
            Import CSV
          </DropdownMenuItem>
          <DropdownMenuItem onClick={downloadTemplate}>
            <FileDown className="mr-2 h-4 w-4" />
            Download Template
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={exportToCSV}>
            <Download className="mr-2 h-4 w-4" />
            Export All CSV ({products.length})
          </DropdownMenuItem>
          <DropdownMenuItem onClick={exportToJSON}>
            <Download className="mr-2 h-4 w-4" />
            Export All JSON ({products.length})
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <input
        ref={fileInputRef}
        type="file"
        accept=".csv"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Import Dialog */}
      <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
        <DialogContent className="max-w-lg bg-card">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileUp className="h-5 w-5 text-accent" />
              Import Products
            </DialogTitle>
            <DialogDescription>
              Review the import summary before confirming
            </DialogDescription>
          </DialogHeader>

          {importResult && (
            <div className="space-y-4">
              {/* Summary */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-3 rounded-lg bg-success/10 p-4">
                  <CheckCircle2 className="h-8 w-8 text-success" />
                  <div>
                    <p className="text-2xl font-bold text-success">{importResult.success}</p>
                    <p className="text-sm text-muted-foreground">Valid products</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-lg bg-destructive/10 p-4">
                  <XCircle className="h-8 w-8 text-destructive" />
                  <div>
                    <p className="text-2xl font-bold text-destructive">{importResult.failed}</p>
                    <p className="text-sm text-muted-foreground">Failed rows</p>
                  </div>
                </div>
              </div>

              {/* Product type breakdown */}
              {importResult.typeCounts && (
                <div className="flex flex-wrap gap-2">
                  {Object.entries(importResult.typeCounts)
                    .filter(([, count]) => count > 0)
                    .map(([type, count]) => {
                      const TypeIcon = getTypeIcon(type);
                      return (
                        <Badge key={type} variant="secondary" className="gap-1.5 py-1">
                          <TypeIcon className="h-3 w-3" />
                          {PRODUCT_TYPE_LABELS[type]?.label || type}: {count}
                        </Badge>
                      );
                    })}
                </div>
              )}

              {/* Errors */}
              {importResult.errors.length > 0 && (
                <div className="space-y-2">
                  <p className="flex items-center gap-2 text-sm font-medium text-destructive">
                    <AlertCircle className="h-4 w-4" />
                    Errors found:
                  </p>
                  <ScrollArea className="h-32 rounded-lg border border-border bg-muted/50 p-3">
                    {importResult.errors.map((error, idx) => (
                      <div key={idx} className="text-sm text-muted-foreground mb-1">
                        <Badge variant="outline" className="mr-2">
                          Row {error.row}
                        </Badge>
                        {error.message}
                      </div>
                    ))}
                  </ScrollArea>
                </div>
              )}

              {/* Preview */}
              {previewData.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Preview (first 5 products):</p>
                  <ScrollArea className="h-40 rounded-lg border border-border">
                    <div className="space-y-2 p-3">
                      {previewData.slice(0, 5).map((product, idx) => {
                        const TypeIcon = getTypeIcon(product.product_type || "simple");
                        return (
                          <div
                            key={idx}
                            className="flex items-center gap-3 rounded-lg bg-card p-2"
                          >
                            <div className="h-10 w-10 rounded bg-muted flex items-center justify-center">
                              <TypeIcon className="h-5 w-5 text-muted-foreground" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="truncate font-medium text-sm">{product.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {product.sku} • {formatPrice(product.price)}
                              </p>
                            </div>
                            <div className="flex flex-col items-end gap-1">
                              <Badge variant="outline" className="text-xs">
                                {product.product_type || "simple"}
                              </Badge>
                              <Badge variant="secondary" className="text-xs">
                                {product.category}
                              </Badge>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </ScrollArea>
                </div>
              )}

              {/* Progress */}
              {importing && (
                <div className="space-y-2">
                  <Progress value={importProgress} className="h-2" />
                  <p className="text-center text-sm text-muted-foreground">
                    Importing... {importProgress}%
                  </p>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setImportDialogOpen(false)}
              disabled={importing}
            >
              Cancel
            </Button>
            <Button
              onClick={confirmImport}
              disabled={importing || previewData.length === 0}
              className="gap-2"
            >
              {importing ? (
                "Importing..."
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  Import {previewData.length} Products
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
