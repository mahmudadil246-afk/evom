import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Plus, Trash2, Package, DollarSign, Hash, Loader2, Pencil, X, Palette } from "lucide-react";
import { useProductVariants, ProductVariant } from "@/hooks/useProductVariants";
import { cn } from "@/lib/utils";
import { formatPrice } from "@/lib/formatPrice";

interface ProductVariantsManagerProps {
  productId: string | null;
}

const presetColors = [
  { name: "Black", hex: "#000000" },
  { name: "White", hex: "#FFFFFF" },
  { name: "Red", hex: "#EF4444" },
  { name: "Blue", hex: "#3B82F6" },
  { name: "Green", hex: "#22C55E" },
  { name: "Yellow", hex: "#EAB308" },
  { name: "Pink", hex: "#EC4899" },
  { name: "Purple", hex: "#A855F7" },
  { name: "Orange", hex: "#F97316" },
  { name: "Gray", hex: "#6B7280" },
  { name: "Navy", hex: "#1E3A5F" },
  { name: "Brown", hex: "#92400E" },
];

const presetSizes = ["XS", "S", "M", "L", "XL", "XXL", "2XL", "3XL"];

interface VariantOptions {
  color?: string;
  color_code?: string;
  size?: string;
  custom_attributes?: { key: string; value: string }[];
}

export function ProductVariantsManager({ productId }: ProductVariantsManagerProps) {
  const { variants, loading, addVariant, updateVariant, deleteVariant } = useProductVariants(productId);
  const [adding, setAdding] = useState(false);
  const [saving, setSaving] = useState<string | null>(null);
  const [newVariant, setNewVariant] = useState({
    name: "",
    sku: "",
    price: "",
    compare_at_price: "",
    quantity: "",
    color: "",
    color_code: "",
    size: "",
    customSize: "",
    customAttributes: [] as { key: string; value: string }[],
  });

  if (!productId) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <Package className="h-10 w-10 text-muted-foreground mb-3" />
        <p className="text-sm text-muted-foreground">
          Save the product first, then you can add variants with individual pricing and stock.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const getAutoName = () => {
    const parts = [newVariant.color, newVariant.size || newVariant.customSize].filter(Boolean);
    return newVariant.name.trim() || parts.join(" - ") || "";
  };

  const handleAddVariant = async () => {
    const finalName = getAutoName() || "Variant";
    setSaving("new");
    try {
      const size = newVariant.size || newVariant.customSize;
      const options: VariantOptions = {};
      if (newVariant.color) {
        options.color = newVariant.color;
        options.color_code = newVariant.color_code;
      }
      if (size) options.size = size;
      if (newVariant.customAttributes.length > 0) {
        options.custom_attributes = newVariant.customAttributes.filter(a => a.key && a.value);
      }

      await addVariant({
        product_id: productId,
        name: finalName,
        sku: newVariant.sku.trim() || null,
        price: newVariant.price ? Number(newVariant.price) : null,
        compare_at_price: newVariant.compare_at_price ? Number(newVariant.compare_at_price) : null,
        quantity: newVariant.quantity ? Number(newVariant.quantity) : 0,
        options: Object.keys(options).length > 0 ? options : null,
        image_url: null,
      });
      setNewVariant({
        name: "", sku: "", price: "", compare_at_price: "", quantity: "",
        color: "", color_code: "", size: "", customSize: "",
        customAttributes: [],
      });
      setAdding(false);
    } finally {
      setSaving(null);
    }
  };

  const handleUpdateField = async (id: string, field: string, value: any) => {
    setSaving(id);
    try {
      await updateVariant(id, { [field]: value });
    } finally {
      setSaving(null);
    }
  };

  const handleDelete = async (id: string) => {
    setSaving(id);
    try {
      await deleteVariant(id);
    } finally {
      setSaving(null);
    }
  };

  const selectPresetColor = (color: typeof presetColors[0]) => {
    setNewVariant(prev => ({ ...prev, color: color.name, color_code: color.hex }));
  };

  const totalStock = variants.reduce((sum, v) => sum + (v.quantity || 0), 0);

  return (
    <div className="space-y-4">
      {/* Summary */}
      {variants.length > 0 && (
        <div className="flex items-center gap-4 p-3 rounded-lg bg-muted/50">
          <div className="flex items-center gap-2">
            <Package className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">{variants.length} variant{variants.length !== 1 ? "s" : ""}</span>
          </div>
          <Separator orientation="vertical" className="h-4" />
          <div className="flex items-center gap-2">
            <Hash className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">Total Stock: <strong>{totalStock}</strong></span>
          </div>
        </div>
      )}

      {/* Variant List */}
      <div className="space-y-3">
        {variants.map((variant) => (
          <VariantRow
            key={variant.id}
            variant={variant}
            saving={saving === variant.id}
            onUpdate={handleUpdateField}
            onDelete={handleDelete}
          />
        ))}
      </div>

      {/* Add New Variant */}
      {adding ? (
        <Card className="border-dashed border-primary/30">
          <CardContent className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-semibold">New Variant</Label>
              <Button variant="ghost" size="sm" onClick={() => setAdding(false)}>Cancel</Button>
            </div>

            {/* Color Picker */}
            <div className="space-y-2">
              <Label className="text-xs flex items-center gap-1">
                <Palette className="h-3 w-3" /> Color
              </Label>
              <div className="flex flex-wrap gap-2">
                {presetColors.map((c) => (
                  <button
                    key={c.hex}
                    type="button"
                    onClick={() => selectPresetColor(c)}
                    className={cn(
                      "h-7 w-7 rounded-full border-2 transition-all",
                      newVariant.color_code === c.hex
                        ? "border-primary ring-2 ring-primary/30 ring-offset-1 ring-offset-background"
                        : "border-border hover:border-muted-foreground"
                    )}
                    style={{ backgroundColor: c.hex }}
                    title={c.name}
                  />
                ))}
              </div>
              <div className="flex gap-2 items-center">
                <Input
                  value={newVariant.color}
                  onChange={(e) => setNewVariant(prev => ({ ...prev, color: e.target.value }))}
                  placeholder="Color name (e.g. Maroon)"
                  className="h-8 text-xs flex-1"
                />
                <Input
                  type="color"
                  value={newVariant.color_code || "#000000"}
                  onChange={(e) => setNewVariant(prev => ({ ...prev, color_code: e.target.value }))}
                  className="h-8 w-10 p-0.5 cursor-pointer"
                />
              </div>
            </div>

            {/* Size Selector */}
            <div className="space-y-2">
              <Label className="text-xs">Size</Label>
              <div className="flex flex-wrap gap-1.5">
                {presetSizes.map((s) => (
                  <Button
                    key={s}
                    type="button"
                    variant={newVariant.size === s ? "default" : "outline"}
                    size="sm"
                    className="h-7 px-2.5 text-xs"
                    onClick={() => setNewVariant(prev => ({
                      ...prev,
                      size: prev.size === s ? "" : s,
                      customSize: "",
                    }))}
                  >
                    {s}
                  </Button>
                ))}
              </div>
              <Input
                value={newVariant.customSize}
                onChange={(e) => setNewVariant(prev => ({ ...prev, customSize: e.target.value, size: "" }))}
                placeholder="Or enter custom size (e.g. 42, Free Size)"
                className="h-8 text-xs"
              />
            </div>

            {/* Price / Stock Row */}
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <Label className="text-xs">Price (৳)</Label>
                <Input
                  type="number"
                  min="0"
                  value={newVariant.price}
                  onChange={(e) => setNewVariant(prev => ({ ...prev, price: e.target.value }))}
                  placeholder="Variant price"
                  className="h-8 text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Compare Price (৳)</Label>
                <Input
                  type="number"
                  min="0"
                  value={newVariant.compare_at_price}
                  onChange={(e) => setNewVariant(prev => ({ ...prev, compare_at_price: e.target.value }))}
                  placeholder="Original price"
                  className="h-8 text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Stock Quantity</Label>
                <Input
                  type="number"
                  min="0"
                  value={newVariant.quantity}
                  onChange={(e) => setNewVariant(prev => ({ ...prev, quantity: e.target.value }))}
                  placeholder="0"
                  className="h-8 text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">SKU</Label>
                <Input
                  value={newVariant.sku}
                  onChange={(e) => setNewVariant(prev => ({ ...prev, sku: e.target.value.toUpperCase() }))}
                  placeholder="e.g., PROD-BLU-XL"
                  className="h-8 text-xs"
                />
              </div>
            </div>

            {/* Variant Name (auto) */}
            <div className="space-y-1">
              <Label className="text-xs">Variant Name (auto-generated)</Label>
              <Input
                value={newVariant.name || getAutoName()}
                onChange={(e) => setNewVariant(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Auto: Color - Size"
                className="h-8 text-xs"
              />
            </div>

            {/* Custom Attributes */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs">Custom Attributes</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-6 text-xs gap-1"
                  onClick={() =>
                    setNewVariant(prev => ({
                      ...prev,
                      customAttributes: [...prev.customAttributes, { key: "", value: "" }],
                    }))
                  }
                >
                  <Plus className="h-3 w-3" /> Add Attribute
                </Button>
              </div>
              {newVariant.customAttributes.map((attr, idx) => (
                <div key={idx} className="flex gap-2 items-center">
                  <Input
                    value={attr.key}
                    onChange={(e) => {
                      const updated = [...newVariant.customAttributes];
                      updated[idx] = { ...updated[idx], key: e.target.value };
                      setNewVariant(prev => ({ ...prev, customAttributes: updated }));
                    }}
                    placeholder="e.g. Material"
                    className="h-8 text-xs flex-1"
                  />
                  <Input
                    value={attr.value}
                    onChange={(e) => {
                      const updated = [...newVariant.customAttributes];
                      updated[idx] = { ...updated[idx], value: e.target.value };
                      setNewVariant(prev => ({ ...prev, customAttributes: updated }));
                    }}
                    placeholder="e.g. Cotton"
                    className="h-8 text-xs flex-1"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0 text-destructive"
                    onClick={() => {
                      setNewVariant(prev => ({
                        ...prev,
                        customAttributes: prev.customAttributes.filter((_, i) => i !== idx),
                      }));
                    }}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>

            <Button
              size="sm"
              onClick={handleAddVariant}
              disabled={!getAutoName() || saving === "new"}
              className="w-full"
            >
              {saving === "new" ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
              Add Variant
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Button variant="outline" className="w-full border-dashed" onClick={() => setAdding(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Variant
        </Button>
      )}
    </div>
  );
}

function VariantRow({
  variant,
  saving,
  onUpdate,
  onDelete,
}: {
  variant: ProductVariant;
  saving: boolean;
  onUpdate: (id: string, field: string, value: any) => void;
  onDelete: (id: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState({
    name: variant.name,
    sku: variant.sku || "",
    price: variant.price?.toString() || "",
    compare_at_price: variant.compare_at_price?.toString() || "",
    quantity: variant.quantity?.toString() || "0",
  });

  useEffect(() => {
    setEditData({
      name: variant.name,
      sku: variant.sku || "",
      price: variant.price?.toString() || "",
      compare_at_price: variant.compare_at_price?.toString() || "",
      quantity: variant.quantity?.toString() || "0",
    });
  }, [variant]);

  const handleSave = () => {
    onUpdate(variant.id, "batch", {
      name: editData.name,
      sku: editData.sku || null,
      price: editData.price ? Number(editData.price) : null,
      compare_at_price: editData.compare_at_price ? Number(editData.compare_at_price) : null,
      quantity: editData.quantity ? Number(editData.quantity) : 0,
    });
    setEditing(false);
  };

  const options = variant.options as VariantOptions | null;
  const colorCode = options?.color_code;
  const colorName = options?.color;
  const sizeName = options?.size;
  const customAttrs = options?.custom_attributes;

  const stockStatus = (variant.quantity || 0) === 0
    ? { label: "Out of Stock", color: "text-destructive" }
    : (variant.quantity || 0) <= 5
      ? { label: "Low Stock", color: "text-yellow-600" }
      : { label: "In Stock", color: "text-green-600" };

  if (editing) {
    return (
      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label className="text-xs">Name</Label>
              <Input value={editData.name} onChange={(e) => setEditData(prev => ({ ...prev, name: e.target.value }))} className="h-8 text-xs" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">SKU</Label>
              <Input value={editData.sku} onChange={(e) => setEditData(prev => ({ ...prev, sku: e.target.value.toUpperCase() }))} className="h-8 text-xs" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Price (৳)</Label>
              <Input type="number" min="0" value={editData.price} onChange={(e) => setEditData(prev => ({ ...prev, price: e.target.value }))} className="h-8 text-xs" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Compare Price (৳)</Label>
              <Input type="number" min="0" value={editData.compare_at_price} onChange={(e) => setEditData(prev => ({ ...prev, compare_at_price: e.target.value }))} className="h-8 text-xs" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Stock</Label>
              <Input type="number" min="0" value={editData.quantity} onChange={(e) => setEditData(prev => ({ ...prev, quantity: e.target.value }))} className="h-8 text-xs" />
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="ghost" size="sm" onClick={() => setEditing(false)}>Cancel</Button>
            <Button size="sm" onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="group">
      <CardContent className="p-3 flex items-center gap-3">
        {/* Color swatch */}
        {colorCode && (
          <div
            className="h-8 w-8 rounded-full border-2 border-border shrink-0"
            style={{ backgroundColor: colorCode }}
            title={colorName || ""}
          />
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="font-medium text-sm truncate">{variant.name}</span>
            {variant.sku && (
              <Badge variant="outline" className="text-xs shrink-0">{variant.sku}</Badge>
            )}
            <Badge variant="outline" className={cn("text-xs shrink-0", stockStatus.color)}>
              {stockStatus.label}
            </Badge>
          </div>
          <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
            {variant.price != null && (
              <span className="flex items-center gap-1">
                <DollarSign className="h-3 w-3" />
                {formatPrice(variant.price)}
                {variant.compare_at_price && (
                  <span className="line-through ml-1">{formatPrice(variant.compare_at_price)}</span>
                )}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Package className="h-3 w-3" />
              {variant.quantity || 0} units
            </span>
            {sizeName && (
              <Badge variant="secondary" className="text-xs h-5">Size: {sizeName}</Badge>
            )}
            {customAttrs && customAttrs.length > 0 && customAttrs.map((a, i) => (
              <Badge key={i} variant="secondary" className="text-xs h-5">{a.key}: {a.value}</Badge>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setEditing(true)}>
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
            onClick={() => onDelete(variant.id)}
            disabled={saving}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
