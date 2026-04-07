import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { logAuditAction } from '@/lib/auditLog';

export interface Brand {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logo_url: string | null;
  website_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  product_count?: number;
}

export function useBrandsData() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBrands = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('brands' as any)
        .select('*')
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch product counts per brand
      const { data: productsData } = await supabase
        .from('products' as any)
        .select('brand');

      const brandCounts: Record<string, number> = {};
      ((productsData as any[]) || []).forEach((p: any) => {
        if (p.brand) {
          brandCounts[p.brand] = (brandCounts[p.brand] || 0) + 1;
        }
      });

      const brandsWithCounts = ((data as any[]) || []).map((b: any): Brand => ({
        id: b.id,
        name: b.name,
        slug: b.slug,
        description: b.description,
        logo_url: b.logo_url,
        website_url: b.website_url,
        is_active: b.is_active ?? true,
        created_at: b.created_at,
        updated_at: b.updated_at,
        product_count: brandCounts[b.name] || 0,
      }));

      setBrands(brandsWithCounts);
    } catch (error: any) {
      console.error('Error fetching brands:', error);
      toast.error('Failed to load brands');
    } finally {
      setLoading(false);
    }
  };

  const createBrand = async (brand: {
    name: string;
    slug: string;
    description?: string;
    logo_url?: string;
    website_url?: string;
    is_active?: boolean;
  }) => {
    try {
      const { data, error } = await supabase
        .from('brands' as any)
        .insert([{
          name: brand.name,
          slug: brand.slug,
          description: brand.description || null,
          logo_url: brand.logo_url || null,
          website_url: brand.website_url || null,
          is_active: brand.is_active ?? true,
        }])
        .select()
        .single();

      if (error) throw error;

      const newBrand: Brand = { ...(data as any), product_count: 0 };
      setBrands(prev => [newBrand, ...prev]);
      logAuditAction({ action: 'create', resource_type: 'brand', resource_id: newBrand.id, description: `Brand created: ${newBrand.name}` });
      toast.success('Brand created successfully!');
      return newBrand;
    } catch (error: any) {
      console.error('Error creating brand:', error);
      if (error.code === '23505') {
        toast.error('Brand slug already exists');
      } else {
        toast.error(error.message || 'Failed to create brand');
      }
      throw error;
    }
  };

  const updateBrand = async (id: string, updates: Partial<Brand>) => {
    try {
      const { data, error } = await supabase
        .from('brands' as any)
        .update({
          name: updates.name,
          slug: updates.slug,
          description: updates.description,
          logo_url: updates.logo_url,
          website_url: updates.website_url,
          is_active: updates.is_active,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      const existing = brands.find(b => b.id === id);
      const updated: Brand = { ...(data as any), product_count: existing?.product_count || 0 };
      setBrands(prev => prev.map(b => b.id === id ? updated : b));
      logAuditAction({ action: 'update', resource_type: 'brand', resource_id: id, description: `Brand updated: ${updated.name}` });
      toast.success('Brand updated successfully!');
      return updated;
    } catch (error: any) {
      console.error('Error updating brand:', error);
      if (error.code === '23505') {
        toast.error('Brand slug already exists');
      } else {
        toast.error(error.message || 'Failed to update brand');
      }
      throw error;
    }
  };

  const deleteBrand = async (id: string) => {
    try {
      const { error } = await supabase
        .from('brands' as any)
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;

      setBrands(prev => prev.filter(b => b.id !== id));
      toast.success('Brand moved to trash', {
        action: {
          label: 'Undo',
          onClick: async () => {
            await supabase.from('brands' as any).update({ deleted_at: null }).eq('id', id);
            fetchBrands();
          },
        },
        duration: 5000,
      });
    } catch (error: any) {
      console.error('Error trashing brand:', error);
      toast.error(error.message || 'Failed to trash brand');
      throw error;
    }
  };

  const bulkDeleteBrands = async (ids: string[]) => {
    try {
      const { error } = await supabase
        .from('brands' as any)
        .update({ deleted_at: new Date().toISOString() })
        .in('id', ids);

      if (error) throw error;

      setBrands(prev => prev.filter(b => !ids.includes(b.id)));
      toast.success(`${ids.length} brands moved to trash`);
    } catch (error: any) {
      console.error('Error bulk trashing brands:', error);
      toast.error(error.message || 'Failed to trash brands');
      throw error;
    }
  };

  const bulkUpdateStatus = async (ids: string[], is_active: boolean) => {
    try {
      const { error } = await supabase
        .from('brands' as any)
        .update({ is_active })
        .in('id', ids);

      if (error) throw error;

      setBrands(prev => prev.map(b => ids.includes(b.id) ? { ...b, is_active } : b));
      toast.success(`${ids.length} brands updated to ${is_active ? 'active' : 'inactive'}`);
    } catch (error: any) {
      console.error('Error bulk updating brands:', error);
      toast.error(error.message || 'Failed to update brands');
      throw error;
    }
  };

  useEffect(() => {
    fetchBrands();

    const channel = supabase
      .channel('brands-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'brands' }, () => {
        fetchBrands();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  return { brands, loading, createBrand, updateBrand, deleteBrand, bulkDeleteBrands, bulkUpdateStatus, refetch: fetchBrands };
}
