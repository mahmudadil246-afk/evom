import { useState, useMemo, useRef } from "react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { DeleteConfirmModal } from "@/components/ui/DeleteConfirmModal";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { TablePagination } from "@/components/ui/table-pagination";
import {
  Plus, Search, MoreVertical, Edit, Trash2, Package, Globe, Image as ImageIcon, Award, Upload, Link, ChevronDown, Eye, EyeOff,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useBrandsData, type Brand } from "@/hooks/useBrandsData";
import { usePagination } from "@/hooks/usePagination";
import { DataImportExport, type ColumnDef } from "@/components/admin/DataImportExport";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface FormData {
  name: string;
  slug: string;
  description: string;
  logo_url: string;
  website_url: string;
  is_active: boolean;
}

const defaultFormData: FormData = {
  name: "",
  slug: "",
  description: "",
  logo_url: "",
  website_url: "",
  is_active: true,
};

const brandImportColumns: ColumnDef[] = [
  { key: 'name', label: 'Name', required: true },
  { key: 'slug', label: 'Slug', required: true },
  { key: 'description', label: 'Description' },
  { key: 'logo_url', label: 'Logo URL' },
  { key: 'website_url', label: 'Website URL' },
  { key: 'status', label: 'Status', parse: (v) => v || 'active' },
];

export default function Brands() {
  const { brands, loading, createBrand, updateBrand, deleteBrand, bulkDeleteBrands, bulkUpdateStatus } = useBrandsData();
  const [searchQuery, setSearchQuery] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null);
  const [deleteBrandItem, setDeleteBrandItem] = useState<Brand | null>(null);
  const [formData, setFormData] = useState<FormData>(defaultFormData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [isBulkUpdating, setIsBulkUpdating] = useState(false);
  const [logoMode, setLogoMode] = useState<"url" | "upload">("url");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredBrands = useMemo(() => {
    if (!searchQuery) return brands;
    const q = searchQuery.toLowerCase();
    return brands.filter(b =>
      b.name.toLowerCase().includes(q) || b.slug.toLowerCase().includes(q)
    );
  }, [brands, searchQuery]);

  const {
    paginatedData,
    currentPage,
    pageSize,
    totalPages,
    totalItems,
    goToPage,
    changePageSize,
  } = usePagination(filteredBrands, { initialPageSize: 10 });

  // Bulk actions
  const handleSelectBrand = (id: string) => {
    setSelectedBrands(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedBrands.length === paginatedData.length) {
      setSelectedBrands([]);
    } else {
      setSelectedBrands(paginatedData.map(b => b.id));
    }
  };

  const handleBulkDelete = async () => {
    setIsBulkDeleting(true);
    try {
      await bulkDeleteBrands(selectedBrands);
      setSelectedBrands([]);
    } finally {
      setIsBulkDeleting(false);
    }
  };

  const handleBulkStatusChange = async (status: string) => {
    setIsBulkUpdating(true);
    try {
      await bulkUpdateStatus(selectedBrands, status === "active");
      setSelectedBrands([]);
    } finally {
      setIsBulkUpdating(false);
    }
  };

  // Logo upload
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image must be less than 2MB");
      return;
    }

    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const fileName = `brand-logos/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage
        .from("brand-logos")
        .upload(fileName, file, { upsert: true });

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from("brand-logos")
        .getPublicUrl(fileName);

      updateField("logo_url", publicUrl);
      toast.success("Logo uploaded!");
    } catch (err: any) {
      toast.error(err.message || "Upload failed");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleBrandImport = async (items: any[]) => {
    for (const item of items) {
      await createBrand({
        name: item.name,
        slug: item.slug,
        description: item.description || undefined,
        logo_url: item.logo_url || undefined,
        website_url: item.website_url || undefined,
        is_active: item.status !== 'inactive',
      });
    }
  };

  const generateSlug = (name: string) =>
    name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

  const updateField = <K extends keyof FormData>(key: K, value: FormData[K]) => {
    setFormData(prev => {
      const newData = { ...prev, [key]: value };
      if (key === "name") newData.slug = generateSlug(value as string);
      return newData;
    });
    if (errors[key]) setErrors(prev => ({ ...prev, [key]: "" }));
  };

  const handleAdd = () => {
    setEditingBrand(null);
    setFormData(defaultFormData);
    setErrors({});
    setLogoMode("url");
    setModalOpen(true);
  };

  const handleEdit = (brand: Brand) => {
    setEditingBrand(brand);
    setFormData({
      name: brand.name,
      slug: brand.slug,
      description: brand.description || "",
      logo_url: brand.logo_url || "",
      website_url: brand.website_url || "",
      is_active: brand.is_active,
    });
    setErrors({});
    setLogoMode(brand.logo_url ? "url" : "url");
    setModalOpen(true);
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = "Brand name is required";
    if (!formData.slug.trim()) newErrors.slug = "Slug is required";
    const existingSlug = brands.find(b => b.slug === formData.slug && b.id !== editingBrand?.id);
    if (existingSlug) newErrors.slug = "Slug already exists";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    try {
      if (editingBrand) {
        await updateBrand(editingBrand.id, {
          name: formData.name,
          slug: formData.slug,
          description: formData.description || null,
          logo_url: formData.logo_url || null,
          website_url: formData.website_url || null,
          is_active: formData.is_active,
        });
      } else {
        await createBrand({
          name: formData.name,
          slug: formData.slug,
          description: formData.description || undefined,
          logo_url: formData.logo_url || undefined,
          website_url: formData.website_url || undefined,
          is_active: formData.is_active,
        });
      }
      setModalOpen(false);
    } catch {}
  };

  const confirmDelete = async () => {
    if (deleteBrandItem) {
      await deleteBrand(deleteBrandItem.id);
      setDeleteBrandItem(null);
    }
  };

  const allSelected = paginatedData.length > 0 && selectedBrands.length === paginatedData.length;
  const someSelected = selectedBrands.length > 0 && selectedBrands.length < paginatedData.length;

  if (loading) {
    return (
      <>
        <div className="space-y-6">
          <div className="flex justify-between">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-10 w-36" />
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-24" />)}
          </div>
          <Skeleton className="h-96" />
        </div>
      </>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <AdminPageHeader
          title="Brands"
          description={`Manage product brands (${brands.length} total)`}
          actions={
          <div className="flex flex-wrap items-center gap-3">
            {selectedBrands.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    Bulk Actions ({selectedBrands.length})
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-popover">
                  <DropdownMenuItem onClick={() => handleBulkStatusChange("active")}>
                    <Eye className="mr-2 h-4 w-4" />
                    Set Active
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleBulkStatusChange("inactive")}>
                    <EyeOff className="mr-2 h-4 w-4" />
                    Set Inactive
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleBulkDelete} className="text-destructive focus:text-destructive">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Move to Trash
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            <DataImportExport
              entityName="Brand"
              entityNamePlural="Brands"
              columns={brandImportColumns}
              data={brands.map(b => ({
                name: b.name,
                slug: b.slug,
                description: b.description || '',
                logo_url: b.logo_url || '',
                website_url: b.website_url || '',
                status: b.is_active ? 'active' : 'inactive',
              }))}
              exampleRow={{
                name: 'Nike',
                slug: 'nike',
                description: 'Sportswear brand',
                logo_url: 'https://example.com/nike.png',
                website_url: 'https://nike.com',
                status: 'active',
              }}
              onImport={handleBrandImport}
              renderPreviewItem={(item, idx) => (
                <div key={idx} className="flex items-center gap-3 rounded-lg bg-card p-2">
                  <div className="h-10 w-10 rounded bg-muted flex items-center justify-center">
                    <Award className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="truncate font-medium text-sm">{item.name}</p>
                    <p className="text-xs text-muted-foreground">{item.slug}</p>
                  </div>
                  <Badge variant="outline" className="text-xs">{item.status}</Badge>
                </div>
              )}
            />
            <Button onClick={handleAdd} className="gap-2">
              <Plus className="h-4 w-4" />
              Add Brand
            </Button>
          </div>
          }
        />

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { label: "Total Brands", value: brands.length, icon: Award, color: "primary" },
            { label: "Active", value: brands.filter(b => b.is_active).length, icon: Award, color: "success" },
            { label: "Total Products", value: brands.reduce((sum, b) => sum + (b.product_count || 0), 0), icon: Package, color: "accent" },
          ].map((card) => {
            const borderMap: Record<string, string> = { primary: "border-l-primary", success: "border-l-success", accent: "border-l-accent" };
            const bgMap: Record<string, string> = { primary: "bg-primary/10", success: "bg-success/10", accent: "bg-accent/10" };
            const textMap: Record<string, string> = { primary: "text-primary", success: "text-success", accent: "text-accent" };
            const cardBgMap: Record<string, string> = { primary: "bg-primary/5 dark:bg-primary/10", success: "bg-success/5 dark:bg-success/10", accent: "bg-accent/5 dark:bg-accent/10" };
            const IconComp = card.icon;
            return (
              <div key={card.label} className={cn(
                "group relative rounded-xl border border-border/50 p-4 sm:p-5 transition-all duration-300",
                "hover:shadow-md hover:border-border hover:-translate-y-0.5 border-l-[3px]",
                borderMap[card.color], cardBgMap[card.color], "animate-fade-in"
              )}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{card.label}</p>
                    <p className="text-lg sm:text-xl font-bold tracking-tight mt-1">{card.value}</p>
                  </div>
                  <div className={cn("rounded-lg p-2", bgMap[card.color])}>
                    <IconComp className={cn("h-5 w-5", textMap[card.color])} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search brands..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Table */}
        <div className="rounded-lg border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-12">
                  <Checkbox
                    checked={allSelected}
                    // @ts-ignore
                    indeterminate={someSelected}
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
                <TableHead className="min-w-[250px]">Brand</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead className="text-center">Products</TableHead>
                <TableHead>Website</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-32 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <Award className="h-8 w-8 text-muted-foreground" />
                      <p className="text-muted-foreground">No brands found</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedData.map((brand) => (
                  <TableRow key={brand.id} data-state={selectedBrands.includes(brand.id) ? "selected" : undefined}>
                    <TableCell>
                      <Checkbox
                        checked={selectedBrands.includes(brand.id)}
                        onCheckedChange={() => handleSelectBrand(brand.id)}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 overflow-hidden rounded-lg bg-muted">
                          {brand.logo_url ? (
                            <img src={brand.logo_url} alt={brand.name} className="h-full w-full object-cover" />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center">
                              <ImageIcon className="h-5 w-5 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{brand.name}</p>
                          {brand.description && (
                            <p className="text-xs text-muted-foreground line-clamp-1">{brand.description}</p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <code className="rounded bg-muted px-2 py-1 text-xs">{brand.slug}</code>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="font-medium">{brand.product_count || 0}</span>
                    </TableCell>
                    <TableCell>
                      {brand.website_url ? (
                        <a href={brand.website_url} target="_blank" rel="noopener noreferrer"
                          className="text-xs text-primary hover:underline flex items-center gap-1">
                          <Globe className="h-3 w-3" /> Visit
                        </a>
                      ) : <span className="text-xs text-muted-foreground">—</span>}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cn(
                        brand.is_active
                          ? "bg-success/10 text-success border-success/20"
                          : "bg-muted text-muted-foreground"
                      )}>
                        {brand.is_active ? "active" : "inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(brand.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-popover">
                          <DropdownMenuItem onClick={() => handleEdit(brand)}>
                            <Edit className="mr-2 h-4 w-4" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => setDeleteBrandItem(brand)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" /> Move to Trash
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          {totalItems > 0 && (
            <TablePagination
              currentPage={currentPage}
              totalPages={totalPages}
              pageSize={pageSize}
              totalItems={totalItems}
              onPageChange={goToPage}
              onPageSizeChange={changePageSize}
            />
          )}
        </div>
      </div>

      {/* Add/Edit Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="bg-card sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editingBrand ? "Edit Brand" : "Add New Brand"}</DialogTitle>
            <DialogDescription>
              {editingBrand ? "Update brand details" : "Fill in the details to create a new brand"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="brand-name">Name *</Label>
              <Input id="brand-name" value={formData.name}
                onChange={(e) => updateField("name", e.target.value)}
                placeholder="Brand name"
                className={errors.name ? "border-destructive" : ""} />
              {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="brand-slug">Slug *</Label>
              <Input id="brand-slug" value={formData.slug}
                onChange={(e) => updateField("slug", e.target.value)}
                placeholder="brand-slug"
                className={errors.slug ? "border-destructive" : ""} />
              {errors.slug && <p className="text-xs text-destructive">{errors.slug}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="brand-desc">Description</Label>
              <Textarea id="brand-desc" value={formData.description}
                onChange={(e) => updateField("description", e.target.value)}
                placeholder="Brand description..." rows={2} className="resize-none" />
            </div>

            {/* Logo - Upload or URL with Preview */}
            <div className="space-y-2">
              <Label>Logo</Label>
              <div className="flex gap-2 mb-2">
                <Button
                  type="button"
                  variant={logoMode === "upload" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setLogoMode("upload")}
                  className="gap-1.5"
                >
                  <Upload className="h-3.5 w-3.5" /> Upload
                </Button>
                <Button
                  type="button"
                  variant={logoMode === "url" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setLogoMode("url")}
                  className="gap-1.5"
                >
                  <Link className="h-3.5 w-3.5" /> URL
                </Button>
              </div>

              {logoMode === "upload" ? (
                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="w-full gap-2"
                  >
                    <Upload className="h-4 w-4" />
                    {uploading ? "Uploading..." : "Choose Image"}
                  </Button>
                </div>
              ) : (
                <Input
                  value={formData.logo_url}
                  onChange={(e) => updateField("logo_url", e.target.value)}
                  placeholder="https://example.com/logo.png"
                />
              )}

              {/* Logo Preview */}
              {formData.logo_url && (
                <div className="mt-2 relative inline-block">
                  <div className="h-20 w-20 overflow-hidden rounded-lg border border-border bg-muted">
                    <img
                      src={formData.logo_url}
                      alt="Logo preview"
                      className="h-full w-full object-contain"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                  </div>
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute -top-2 -right-2 h-5 w-5 rounded-full"
                    onClick={() => updateField("logo_url", "")}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="brand-website">Website URL</Label>
              <Input id="brand-website" value={formData.website_url}
                onChange={(e) => updateField("website_url", e.target.value)}
                placeholder="https://example.com" />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={formData.is_active ? "active" : "inactive"}
                onValueChange={(v) => updateField("is_active", v === "active")}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent className="bg-popover">
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSave}>{editingBrand ? "Update" : "Create"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <DeleteConfirmModal
        open={!!deleteBrandItem}
        onOpenChange={(open) => !open && setDeleteBrandItem(null)}
        onConfirm={confirmDelete}
        title="Move to Trash"
        itemName={deleteBrandItem?.name}
      />
    </>
  );
}
