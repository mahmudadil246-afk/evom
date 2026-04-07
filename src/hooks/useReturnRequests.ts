import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ReturnRequest {
  id: string;
  user_id: string;
  order_id: string;
  reason: string;
  description: string | null;
  status: string;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
  order_number?: string;
  customer_name?: string;
  customer_email?: string;
}

export function useReturnRequests() {
  const queryClient = useQueryClient();

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ['admin-return-requests'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('return_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Enrich with order and customer info
      const enriched: ReturnRequest[] = [];
      for (const r of (data || [])) {
        let order_number = '';
        let customer_name = '';
        let customer_email = '';

        if (r.order_id) {
          const { data: order } = await supabase
            .from('orders')
            .select('order_number, customer_id')
            .eq('id', r.order_id)
            .maybeSingle();

          if (order) {
            order_number = (order as any).order_number || '';
            if ((order as any).customer_id) {
              const { data: customer } = await supabase
                .from('customers')
                .select('full_name, email')
                .eq('id', (order as any).customer_id)
                .maybeSingle();
              if (customer) {
                customer_name = (customer as any).full_name || '';
                customer_email = (customer as any).email || '';
              }
            }
          }
        }

        enriched.push({
          ...r,
          order_number,
          customer_name,
          customer_email,
        });
      }

      return enriched;
    },
    refetchInterval: 30000,
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status, admin_notes }: { id: string; status: string; admin_notes?: string }) => {
      const update = {
        status,
        updated_at: new Date().toISOString(),
        ...(admin_notes !== undefined ? { admin_notes } : {}),
      };

      const { error } = await supabase
        .from('return_requests')
        .update(update)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-return-requests'] });
      toast.success('Return request updated');
    },
    onError: (error: any) => {
      toast.error(`Failed to update: ${error.message}`);
    },
  });

  const counts = {
    total: requests.length,
    pending: requests.filter(r => r.status === 'pending').length,
    approved: requests.filter(r => r.status === 'approved').length,
    rejected: requests.filter(r => r.status === 'rejected').length,
    completed: requests.filter(r => r.status === 'completed').length,
  };

  return { requests, isLoading, updateStatus: updateStatus.mutate, isUpdating: updateStatus.isPending, counts };
}
