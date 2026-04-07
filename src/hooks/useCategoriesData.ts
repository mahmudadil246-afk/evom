import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { logAuditAction } from '@/lib/auditLog';

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  parent_id: string | null;
  image_url: string | null;
  is_active: boolean;
  sort_order: number | null;
  created_at: string;
  updated_at: string;
  product_count?: number;
  status: string;
}

export function useCategoriesData() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      
      // Fetch categories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('categories' as any)
        .select('*')
        .is('deleted_at', null)
        .order('sort_order', { ascending: true, nullsFirst: false })
        .order('created_at', { ascending: false });

      if (categoriesError) throw categoriesError;

      // Fetch product counts per category
      const { data: productsData, error: productsError } = await supabase
        .from('products' as any)
        .select('category');

      if (productsError) throw productsError;

      // Count products per category
      const productCounts: Record<string, number> = {};
      ((productsData as any[]) || []).forEach((p: any) => {
        if (p.category) {
          productCounts[p.category] = (productCounts[p.category] || 0) + 1;
        }
      });

      // Add product counts and status to categories
      const categoriesWithCounts = ((categoriesData as any[]) || []).map((cat: any): Category => ({
        id: cat.id,
        name: cat.name,
        slug: cat.slug,
        description: cat.description,
        parent_id: cat.parent_id,
        image_url: cat.image_url,
        is_active: cat.is_active ?? true,
        sort_order: cat.sort_order,
        created_at: cat.created_at,
        updated_at: cat.updated_at,
        product_count: productCounts[cat.name] || 0,
        status: cat.is_active ? 'active' : 'inactive',
      }));

      setCategories(categoriesWithCounts);
    } catch (error: any) {
      console.error('Error fetching categories:', error);
      toast.error('Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  const createCategory = async (category: { 
    name: string; 
    slug: string; 
    description?: string; 
    parent_id?: string | null; 
    image_url?: string; 
    is_active?: boolean;
    status?: string;
  }) => {
    try {
      const { data, error } = await supabase
        .from('categories' as any)
        .insert([{
          name: category.name,
          slug: category.slug,
          description: category.description || null,
          parent_id: category.parent_id || null,
          image_url: category.image_url || null,
          is_active: category.is_active ?? (category.status === 'active' || category.status === undefined),
        }])
        .select()
        .single();

      if (error) throw error;

      const newCategory: Category = {
        ...(data as any),
        product_count: 0,
        status: (data as any).is_active ? 'active' : 'inactive',
      };
      setCategories(prev => [newCategory, ...prev]);
      logAuditAction({ action: 'create', resource_type: 'category', resource_id: newCategory.id, description: `Category created: ${newCategory.name}` });
      toast.success('Category created successfully!');
      return newCategory;
    } catch (error: any) {
      console.error('Error creating category:', error);
      if (error.code === '23505') {
        toast.error('Category slug already exists');
      } else {
        toast.error(error.message || 'Failed to create category');
      }
      throw error;
    }
  };

  const updateCategory = async (id: string, updates: Partial<Category>) => {
    try {
      const { data, error } = await supabase
        .from('categories' as any)
        .update({
          name: updates.name,
          slug: updates.slug,
          description: updates.description,
          parent_id: updates.parent_id,
          image_url: updates.image_url,
          is_active: updates.is_active,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      const existingCategory = categories.find(c => c.id === id);
      const updatedCategory: Category = {
        ...(data as any),
        product_count: existingCategory?.product_count || 0,
        status: (data as any).is_active ? 'active' : 'inactive',
      };
      setCategories(prev => prev.map(c => c.id === id ? updatedCategory : c));
      logAuditAction({ action: 'update', resource_type: 'category', resource_id: id, description: `Category updated: ${updatedCategory.name}` });
      toast.success('Category updated successfully!');
      return updatedCategory;
    } catch (error: any) {
      console.error('Error updating category:', error);
      if (error.code === '23505') {
        toast.error('Category slug already exists');
      } else {
        toast.error(error.message || 'Failed to update category');
      }
      throw error;
    }
  };

  const deleteCategory = async (id: string) => {
    try {
      // Check if category has children
      const hasChildren = categories.some(c => c.parent_id === id);
      if (hasChildren) {
        toast.error('Cannot delete category with subcategories');
        return;
      }

      const { error } = await supabase
        .from('categories' as any)
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;

      setCategories(prev => prev.filter(c => c.id !== id));
      toast.success('Category moved to trash', {
        action: {
          label: 'Undo',
          onClick: async () => {
            await supabase.from('categories' as any).update({ deleted_at: null }).eq('id', id);
            fetchCategories();
          },
        },
        duration: 5000,
      });
    } catch (error: any) {
      console.error('Error trashing category:', error);
      toast.error(error.message || 'Failed to trash category');
      throw error;
    }
  };

  useEffect(() => {
    fetchCategories();

    // Set up realtime subscription
    const channel = supabase
      .channel('categories-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'categories' },
        () => {
          fetchCategories();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const updateSortOrders = async (updates: { id: string; sort_order: number }[]) => {
    try {
      for (const u of updates) {
        await supabase.from('categories' as any).update({ sort_order: u.sort_order }).eq('id', u.id);
      }
      setCategories(prev => prev.map(c => {
        const upd = updates.find(u => u.id === c.id);
        return upd ? { ...c, sort_order: upd.sort_order } : c;
      }));
    } catch (error: any) {
      console.error('Error updating sort order:', error);
      toast.error('Failed to update order');
    }
  };

  return {
    categories,
    loading,
    createCategory,
    updateCategory,
    deleteCategory,
    updateSortOrders,
    refetch: fetchCategories,
  };
}
