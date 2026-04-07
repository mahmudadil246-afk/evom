import { useState, useMemo, useRef, useCallback } from "react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from "@dnd-kit/sortable";
import { SearchableSelect } from "@/components/ui/searchable-select";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DeleteConfirmModal } from "@/components/ui/DeleteConfirmModal";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Plus,
  Search,
  MoreVertical,
  Edit,
  Trash2,
  Tag,
  Package,
  ChevronRight,
  FolderTree,
  Image as ImageIcon,
  ChevronDown,
  Eye,
  EyeOff,
  Upload,
  Link,
  GripVertical,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useCategoriesData, type Category } from "@/hooks/useCategoriesData";
import { DataImportExport, type ColumnDef } from "@/components/admin/DataImportExport";
import { TablePagination } from "@/components/ui/table-pagination";
import { usePagination } from "@/hooks/usePagination";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface FormData {
  name: string;
  slug: string;
  description: string;
  parent_id: string | null;
  image_url: string;
  status: string;
}

const defaultFormData: FormData = {
  name: "",
  slug: "",
  description: "",
  parent_id: null,
  image_url: "",
  status: "active",
};

const categoryImportColumns: ColumnDef[] = [
  { key: 'name', label: 'Name', required: true },
  { key: 'slug', label: 'Slug', required: true },
  { key: 'description', label: 'Description' },
  { key: 'parent', label: 'Parent Category' },
  { key: 'image_url', label: 'Image URL' },
  { key: 'status', label: 'Status', parse: (v) => v || 'active' },
];

function SortableCategoryRow({ category, level, isSelected, onToggleSelect, onEdit, onDelete, getTotalProducts }: {
  category: Category; level: number; isSelected: boolean;
  onToggleSelect: () => void; onEdit: () => void; onDelete: () => void;
  getTotalProducts: (id: string) => number;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: category.id });
  const style = { transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined, transition, opacity: isDragging ? 0.5 : 1 };

  return (
    <TableRow ref={setNodeRef} style={style} className={isSelected ? "bg-primary/5" : ""}>
      <TableCell className="w-10">
        <button type="button" className="cursor-grab active:cursor-grabbing p-1 text-muted-foreground hover:text-foreground" {...attributes} {...listeners}>
          <GripVertical className="h-4 w-4" />
        </button>
      </TableCell>
      <TableCell>
        <Checkbox checked={isSelected} onCheckedChange={onToggleSelect} aria-label={`Select ${category.name}`} />
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-3" style={{ paddingLeft: `${level * 24}px` }}>
          {level > 0 && <ChevronRight className="h-4 w-4 text-muted-foreground" />}
          <div className="h-10 w-10 overflow-hidden rounded-lg bg-muted">
            {category.image_url ? (
              <img src={category.image_url} alt={category.name} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <ImageIcon className="h-5 w-5 text-muted-foreground" />
              </div>
            )}
          </div>
          <div>
            <p className="font-medium text-foreground">{category.name}</p>
            {category.description && <p className="text-xs text-muted-foreground line-clamp-1">{category.description}</p>}
          </div>
        </div>
      </TableCell>
      <TableCell><code className="rounded bg-muted px-2 py-1 text-xs">{category.slug}</code></TableCell>
      <TableCell className="text-center"><span className="font-medium">{getTotalProducts(category.id)}</span></TableCell>
      <TableCell>
        <Badge variant="outline" className={cn(category.status === "active" ? "bg-success/10 text-success border-success/20" : "bg-muted text-muted-foreground")}>
          {category.status}
        </Badge>
      </TableCell>
      <TableCell className="text-sm text-muted-foreground">{new Date(category.created_at).toLocaleDateString()}</TableCell>
      <TableCell>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="h-4 w-4" /></Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-popover">
            <DropdownMenuItem onClick={onEdit}><Edit className="mr-2 h-4 w-4" />Edit</DropdownMenuItem>
            <DropdownMenuItem onClick={onDelete} className="text-destructive focus:text-destructive"><Trash2 className="mr-2 h-4 w-4" />Move to Trash</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
}

export default function Categories() {
  const { categories, loading, createCategory, updateCategory, deleteCategory, updateSortOrders } = useCategoriesData();
  const [searchQuery, setSearchQuery] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deleteCategoryItem, setDeleteCategoryItem] = useState<Category | null>(null);
  const [formData, setFormData] = useState<FormData>(defaultFormData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [bulkProcessing, setBulkProcessing] = useState(false);
  const [imageMode, setImageMode] = useState<"url" | "upload">("url");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCategoryImport = async (items: any[]) => {
    const parentItems = items.filter((item) => !item.parent || item.parent.trim() === '');
    const childItems = items.filter((item) => item.parent && item.parent.trim() !== '');
    const createdMap: Record<string, string> = {};
    categories.forEach((c) => {
      createdMap[c.name.toLowerCase()] = c.id;
    });
    for (const item of parentItems) {
      try {
        const result = await createCategory({
          name: item.name,
          slug: item.slug,
          description: item.description || undefined,
          parent_id: null,
          image_url: item.image_url || undefined,
          status: item.status || 'active',
        });
        if (result?.id) {
          createdMap[item.name.toLowerCase()] = result.id;
        }
      } catch (e) {
        console.error(`Failed to import parent category: ${item.name}`, e);
      }
    }
    for (const item of childItems) {
      const parentId = createdMap[item.parent.toLowerCase()] || null;
      try {
        const result = await createCategory({
          name: item.name,
          slug: item.slug,
          description: item.description || undefined,
          parent_id: parentId,
          image_url: item.image_url || undefined,
          status: item.status || 'active',
        });
        if (result?.id) {
          createdMap[item.name.toLowerCase()] = result.id;
        }
      } catch (e) {
        console.error(`Failed to import child category: ${item.name}`, e);
      }
    }
  };

  const rootCategories = useMemo(
    () => categories.filter((c) => !c.parent_id),
    [categories]
  );

  const getChildren = (parentId: string) =>
    categories.filter((c) => c.parent_id === parentId);

  const filteredCategories = useMemo(() => {
    if (!searchQuery) return categories;
    const query = searchQuery.toLowerCase();
    return categories.filter(
      (c) =>
        c.name.toLowerCase().includes(query) ||
        c.slug.toLowerCase().includes(query) ||
        (c.description && c.description.toLowerCase().includes(query))
    );
  }, [categories, searchQuery]);

  const buildCategoryTree = () => {
    const result: { category: Category; level: number }[] = [];
    const addCategoryWithChildren = (category: Category, level: number) => {
      result.push({ category, level });
      const children = getChildren(category.id);
      children.forEach((child) => addCategoryWithChildren(child, level + 1));
    };
    if (searchQuery) {
      filteredCategories.forEach((cat) => {
        const level = cat.parent_id ? 1 : 0;
        result.push({ category: cat, level });
      });
    } else {
      rootCategories.forEach((cat) => addCategoryWithChildren(cat, 0));
    }
    return result;
  };

  const categoryTree = buildCategoryTree();

  // DnD sensors
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = categoryTree.findIndex(item => item.category.id === active.id);
    const newIndex = categoryTree.findIndex(item => item.category.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    const reordered = arrayMove(categoryTree, oldIndex, newIndex);
    const updates = reordered.map((item, i) => ({ id: item.category.id, sort_order: i }));
    await updateSortOrders(updates);
  }, [categoryTree, updateSortOrders]);

  // Pagination
  const {
    paginatedData: paginatedTree,
    currentPage,
    pageSize,
    totalPages,
    totalItems,
    goToPage,
    changePageSize,
  } = usePagination(categoryTree, { initialPageSize: 10 });

  // Selection helpers
  const currentPageIds = paginatedTree.map((item) => item.category.id);
  const allCurrentSelected = currentPageIds.length > 0 && currentPageIds.every((id) => selectedIds.has(id));
  const someCurrentSelected = currentPageIds.some((id) => selectedIds.has(id));

  const toggleSelectAll = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allCurrentSelected) {
        currentPageIds.forEach((id) => next.delete(id));
      } else {
        currentPageIds.forEach((id) => next.add(id));
      }
      return next;
    });
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const clearSelection = () => setSelectedIds(new Set());

  // Bulk actions
  const handleBulkStatusChange = async (status: 'active' | 'inactive') => {
    setBulkProcessing(true);
    let count = 0;
    for (const id of selectedIds) {
      try {
        await updateCategory(id, { is_active: status === 'active', status });
        count++;
      } catch (e) {
        console.error(`Failed to update category ${id}`, e);
      }
    }
    toast.success(`${count} categories set to ${status}`);
    clearSelection();
    setBulkProcessing(false);
  };

  const handleBulkTrash = async () => {
    setBulkProcessing(true);
    let count = 0;
    for (const id of selectedIds) {
      try {
        await deleteCategory(id);
        count++;
      } catch (e) {
        console.error(`Failed to trash category ${id}`, e);
      }
    }
    toast.success(`${count} categories moved to trash`);
    clearSelection();
    setBulkDeleteOpen(false);
    setBulkProcessing(false);
  };

  const generateSlug = (name: string) =>
    name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

  const updateField = <K extends keyof FormData>(key: K, value: FormData[K]) => {
    setFormData((prev) => {
      const newData = { ...prev, [key]: value };
      if (key === "name") {
        newData.slug = generateSlug(value as string);
      }
      return newData;
    });
    if (errors[key]) {
      setErrors((prev) => ({ ...prev, [key]: "" }));
    }
  };

  const handleAdd = () => {
    setEditingCategory(null);
    setFormData(defaultFormData);
    setErrors({});
    setImageMode("url");
    setModalOpen(true);
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      slug: category.slug,
      description: category.description || "",
      parent_id: category.parent_id,
      image_url: category.image_url || "",
      status: category.status,
    });
    setErrors({});
    setImageMode(category.image_url ? "url" : "url");
    setModalOpen(true);
  };

  // Image upload
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
      const fileName = `category-images/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage
        .from("store-assets")
        .upload(fileName, file, { upsert: true });
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage
        .from("store-assets")
        .getPublicUrl(fileName);
      updateField("image_url", publicUrl);
      toast.success("Image uploaded!");
    } catch (err: any) {
      toast.error(err.message || "Upload failed");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = "Category name is required";
    if (!formData.slug.trim()) newErrors.slug = "Slug is required";
    const existingSlug = categories.find(
      (c) => c.slug === formData.slug && c.id !== editingCategory?.id
    );
    if (existingSlug) newErrors.slug = "Slug already exists";
    if (editingCategory && formData.parent_id === editingCategory.id) {
      newErrors.parent_id = "Category cannot be its own parent";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    try {
      if (editingCategory) {
        await updateCategory(editingCategory.id, {
          name: formData.name,
          slug: formData.slug,
          description: formData.description || null,
          parent_id: formData.parent_id,
          image_url: formData.image_url || null,
          status: formData.status,
        });
      } else {
        await createCategory({
          name: formData.name,
          slug: formData.slug,
          description: formData.description || undefined,
          parent_id: formData.parent_id,
          image_url: formData.image_url || undefined,
          status: formData.status,
        });
      }
      setModalOpen(false);
    } catch (error) {}
  };

  const handleDelete = (category: Category) => {
    const children = getChildren(category.id);
    if (children.length > 0) return;
    setDeleteCategoryItem(category);
  };

  const confirmDelete = async () => {
    if (deleteCategoryItem) {
      await deleteCategory(deleteCategoryItem.id);
      setDeleteCategoryItem(null);
    }
  };

  const getParentName = (parentId: string | null) => {
    if (!parentId) return null;
    const parent = categories.find((c) => c.id === parentId);
    return parent?.name || null;
  };

  const getTotalProducts = (categoryId: string): number => {
    const category = categories.find((c) => c.id === categoryId);
    if (!category) return 0;
    const children = getChildren(categoryId);
    const childProducts = children.reduce(
      (sum, child) => sum + getTotalProducts(child.id),
      0
    );
    return (category.product_count || 0) + childProducts;
  };

  if (loading) {
    return (
      <>
        <div className="space-y-6">
          <div className="flex justify-between">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-10 w-36" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
          <Skeleton className="h-10 w-64" />
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
          title="Categories"
          description={`Manage product categories (${categories.length} total)`}
          actions={
          <div className="flex flex-wrap items-center gap-3">
            {selectedIds.size > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    Bulk Actions ({selectedIds.size})
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-popover">
                  <DropdownMenuItem onClick={() => handleBulkStatusChange('active')}>
                    <Eye className="mr-2 h-4 w-4" />
                    Set Active
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleBulkStatusChange('inactive')}>
                    <EyeOff className="mr-2 h-4 w-4" />
                    Set Inactive
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setBulkDeleteOpen(true)} className="text-destructive focus:text-destructive">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Move to Trash
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            <DataImportExport
              entityName="Category"
              entityNamePlural="Categories"
              columns={categoryImportColumns}
              data={categories.map(c => ({
                name: c.name,
                slug: c.slug,
                description: c.description || '',
                parent: getParentName(c.parent_id) || '',
                image_url: c.image_url || '',
                status: c.is_active ? 'active' : 'inactive',
              }))}
              exampleRow={{
                name: 'T-Shirts',
                slug: 't-shirts',
                description: 'All types of t-shirts',
                parent: 'Clothing',
                image_url: 'https://example.com/img.jpg',
                status: 'active',
              }}
              onImport={handleCategoryImport}
              renderPreviewItem={(item, idx) => (
                <div key={idx} className="flex items-center gap-3 rounded-lg bg-card p-2">
                  <div className="h-10 w-10 rounded bg-muted flex items-center justify-center">
                    <Tag className="h-4 w-4 text-muted-foreground" />
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
              Add Category
            </Button>
          </div>
          }
        />

        {/* Stats Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Root Categories", value: rootCategories.length, icon: FolderTree, color: "primary" },
            { label: "Total Categories", value: categories.length, icon: Tag, color: "accent" },
            { label: "Total Products", value: categories.reduce((sum, c) => sum + (c.product_count || 0), 0), icon: Package, color: "success" },
            { label: "Inactive", value: categories.filter((c) => c.status === "inactive").length, icon: Tag, color: "warning" },
          ].map((card) => {
            const borderMap: Record<string, string> = { primary: "border-l-primary", accent: "border-l-accent", success: "border-l-success", warning: "border-l-yellow-500" };
            const bgMap: Record<string, string> = { primary: "bg-primary/10", accent: "bg-accent/10", success: "bg-success/10", warning: "bg-yellow-500/10" };
            const textMap: Record<string, string> = { primary: "text-primary", accent: "text-accent", success: "text-success", warning: "text-yellow-500" };
            const cardBgMap: Record<string, string> = { primary: "bg-primary/5 dark:bg-primary/10", accent: "bg-accent/5 dark:bg-accent/10", success: "bg-success/5 dark:bg-success/10", warning: "bg-yellow-500/5 dark:bg-yellow-500/10" };
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
            placeholder="Search categories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Categories Table */}
        <Card>
          <CardContent className="p-0">
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="w-10"></TableHead>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={allCurrentSelected}
                        onCheckedChange={toggleSelectAll}
                        aria-label="Select all"
                        className={someCurrentSelected && !allCurrentSelected ? "opacity-50" : ""}
                      />
                    </TableHead>
                    <TableHead className="min-w-[300px]">Category</TableHead>
                    <TableHead>Slug</TableHead>
                    <TableHead className="text-center">Products</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <SortableContext items={paginatedTree.map(i => i.category.id)} strategy={verticalListSortingStrategy}>
                  <TableBody>
                    {paginatedTree.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="h-32 text-center">
                          <div className="flex flex-col items-center gap-2">
                            <Tag className="h-8 w-8 text-muted-foreground" />
                            <p className="text-muted-foreground">No categories found</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      paginatedTree.map(({ category, level }) => (
                        <SortableCategoryRow
                          key={category.id}
                          category={category}
                          level={level}
                          isSelected={selectedIds.has(category.id)}
                          onToggleSelect={() => toggleSelect(category.id)}
                          onEdit={() => handleEdit(category)}
                          onDelete={() => handleDelete(category)}
                          getTotalProducts={getTotalProducts}
                        />
                      ))
                    )}
                  </TableBody>
                </SortableContext>
              </Table>
            </DndContext>
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
          </CardContent>
        </Card>
      </div>

      {/* Add/Edit Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="bg-card sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editingCategory ? "Edit Category" : "Add New Category"}
            </DialogTitle>
            <DialogDescription>
              {editingCategory
                ? "Update the category details below"
                : "Fill in the details to create a new category"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => updateField("name", e.target.value)}
                placeholder="Category name"
                className={errors.name ? "border-destructive" : ""}
              />
              {errors.name && (
                <p className="text-xs text-destructive">{errors.name}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug">Slug *</Label>
              <Input
                id="slug"
                value={formData.slug}
                onChange={(e) => updateField("slug", e.target.value)}
                placeholder="category-slug"
                className={errors.slug ? "border-destructive" : ""}
              />
              {errors.slug && (
                <p className="text-xs text-destructive">{errors.slug}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => updateField("description", e.target.value)}
                placeholder="Category description"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="parent">Parent Category</Label>
              <SearchableSelect
                options={[
                  { value: "none", label: "None (Root Category)" },
                  ...categories
                    .filter((c) => c.id !== editingCategory?.id)
                    .map((cat) => ({ value: cat.id, label: cat.name })),
                ]}
                value={formData.parent_id || "none"}
                onValueChange={(v) => updateField("parent_id", v === "none" ? null : v)}
                placeholder="Select parent category"
                searchPlaceholder="Search categories..."
                className={errors.parent_id ? "border-destructive" : ""}
              />
              {errors.parent_id && (
                <p className="text-xs text-destructive">{errors.parent_id}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Image</Label>
              <div className="flex gap-2 mb-2">
                <Button
                  type="button"
                  variant={imageMode === "upload" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setImageMode("upload")}
                  className="gap-1.5"
                >
                  <Upload className="h-3.5 w-3.5" /> Upload
                </Button>
                <Button
                  type="button"
                  variant={imageMode === "url" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setImageMode("url")}
                  className="gap-1.5"
                >
                  <Link className="h-3.5 w-3.5" /> URL
                </Button>
              </div>

              {imageMode === "upload" ? (
                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
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
                  value={formData.image_url}
                  onChange={(e) => updateField("image_url", e.target.value)}
                  placeholder="https://example.com/image.jpg"
                />
              )}

              {/* Image Preview */}
              {formData.image_url && (
                <div className="mt-2 relative inline-block">
                  <div className="h-20 w-20 overflow-hidden rounded-lg border border-border bg-muted">
                    <img
                      src={formData.image_url}
                      alt="Image preview"
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
                    onClick={() => updateField("image_url", "")}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(v) => updateField("status", v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover">
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              {editingCategory ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <DeleteConfirmModal
        open={!!deleteCategoryItem}
        onOpenChange={() => setDeleteCategoryItem(null)}
        onConfirm={confirmDelete}
        title="Move to Trash"
        itemName={deleteCategoryItem?.name}
      />

      {/* Bulk Delete Confirmation */}
      <DeleteConfirmModal
        open={bulkDeleteOpen}
        onOpenChange={setBulkDeleteOpen}
        onConfirm={handleBulkTrash}
        title="Move to Trash"
        description={`Are you sure you want to move ${selectedIds.size} categories to trash?`}
        isLoading={bulkProcessing}
      />
    </>
  );
}
