import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { logAuditAction } from '@/lib/auditLog';

export type OrderStatus = "pending" | "processing" | "shipped" | "delivered" | "cancelled";

export interface OrderItem {
  id: string;
  product_name: string;
  product_id: string | null;
  unit_price: number;
  quantity: number;
  total_price: number;
}

export interface Order {
  id: string;
  order_number: string;
  customer_id: string | null;
  user_id: string | null;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  shipping_address: any;
  subtotal: number;
  shipping_cost: number;
  discount: number;
  total: number;
  status: OrderStatus;
  payment_method: string;
  payment_status: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
  items: OrderItem[];
  payment_verified_at: string | null;
  payment_verified_by: string | null;
  payment_verification_notes: string | null;
  refund_status: string;
  refund_amount: number;
  refund_reason: string | null;
  refunded_at: string | null;
  tags: string[];
}

export interface OrderStats {
  total: number;
  pending: number;
  processing: number;
  shipped: number;
  delivered: number;
  revenue: number;
}

export function useOrdersData() {
  const queryClient = useQueryClient();

  // Fetch all orders with customer and items data
  const { data: orders = [], isLoading, error, refetch } = useQuery({
    queryKey: ['admin-orders'],
    queryFn: async () => {
      // Fetch orders with customer data
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders' as any)
        .select(`
          *,
          customers (
            full_name,
            email,
            phone,
            address
          )
        `)
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      if (ordersError) throw ordersError;

      // Fetch order items for all orders
      const orderIds = ((ordersData as any[]) || []).map(o => o.id);
      
      let itemsData: any[] = [];
      if (orderIds.length > 0) {
        const { data, error: itemsError } = await supabase
          .from('order_items' as any)
          .select('*')
          .in('order_id', orderIds);

        if (itemsError) throw itemsError;
        itemsData = (data as any[]) || [];
      }

      // Map orders with their items
      const ordersWithItems: Order[] = ((ordersData as any[]) || []).map((order: any) => {
        const customer = order.customers as any;
        const orderItems = itemsData.filter((item: any) => item.order_id === order.id);

        return {
          id: order.id,
          order_number: order.order_number,
          customer_id: order.customer_id,
          user_id: order.user_id,
          customer_name: customer?.full_name || 'Guest',
          customer_email: customer?.email || '',
          customer_phone: customer?.phone || '',
          shipping_address: order.shipping_address,
          subtotal: Number(order.subtotal),
          shipping_cost: Number(order.shipping_cost),
          discount: Number(order.discount_amount || order.discount || 0),
          total: Number(order.total_amount || order.total || 0),
          status: order.status as OrderStatus,
          payment_method: order.payment_method || 'N/A',
          payment_status: order.payment_status || 'pending',
          notes: order.notes,
          created_at: order.created_at,
          updated_at: order.updated_at,
          payment_verified_at: order.payment_verified_at,
          payment_verified_by: order.payment_verified_by,
          payment_verification_notes: order.payment_verification_notes,
          refund_status: order.refund_status || 'none',
          refund_amount: Number(order.refund_amount || 0),
          refund_reason: order.refund_reason || null,
          refunded_at: order.refunded_at || null,
          tags: order.tags || [],
          items: orderItems.map((item: any) => ({
            id: item.id,
            product_name: item.product_name,
            product_id: item.product_id,
            unit_price: Number(item.unit_price),
            quantity: item.quantity,
            total_price: Number(item.total_price),
          })),
        };
      });

      return ordersWithItems;
    },
  });

  // Calculate stats
  const stats: OrderStats = {
    total: orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    processing: orders.filter(o => o.status === 'processing').length,
    shipped: orders.filter(o => o.status === 'shipped').length,
    delivered: orders.filter(o => o.status === 'delivered').length,
    revenue: orders
      .filter(o => o.payment_status === 'paid')
      .reduce((sum, o) => sum + o.total, 0),
  };

  // Update order status mutation with optimistic updates (10.2)
  const updateStatusMutation = useMutation({
    mutationFn: async ({ orderId, status }: { orderId: string; status: OrderStatus }) => {
      // Get current order status and items before updating
      const { data: currentOrder } = await supabase
        .from('orders' as any)
        .select('status')
        .eq('id', orderId)
        .single();
      
      const previousStatus = (currentOrder as any)?.status;

      const { error } = await supabase
        .from('orders' as any)
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', orderId);

      if (error) throw error;

      // Handle stock changes based on status transitions
      // Restore stock when cancelled
      if (status === 'cancelled' && previousStatus !== 'cancelled') {
        const { data: orderItems } = await supabase
          .from('order_items' as any)
          .select('product_id, quantity, product_name')
          .eq('order_id', orderId);

        if (orderItems) {
          for (const item of orderItems as any[]) {
            if (item.product_id) {
              const { data: product } = await supabase
                .from('products' as any)
                .select('quantity')
                .eq('id', item.product_id)
                .single();
              
              if (product) {
                await supabase
                  .from('products' as any)
                  .update({ quantity: ((product as any).quantity || 0) + item.quantity })
                  .eq('id', item.product_id);
              }

              // Also restore variant stock if variant info in product_name
              const variantMatch = item.product_name?.match(/\(([^)]+)\)/);
              if (variantMatch) {
                const { data: variant } = await supabase
                  .from('product_variants' as any)
                  .select('id, quantity')
                  .eq('product_id', item.product_id)
                  .ilike('name', `%${variantMatch[1]}%`)
                  .maybeSingle();
                
                if (variant) {
                  await supabase
                    .from('product_variants' as any)
                    .update({ quantity: ((variant as any).quantity || 0) + item.quantity })
                    .eq('id', (variant as any).id);
                }
              }
            }
          }
        }
      }
    },
    onMutate: async ({ orderId, status }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['admin-orders'] });
      // Snapshot previous value
      const previousOrders = queryClient.getQueryData(['admin-orders']);
      // Optimistically update
      queryClient.setQueryData(['admin-orders'], (old: Order[] | undefined) =>
        old?.map(o => o.id === orderId ? { ...o, status, updated_at: new Date().toISOString() } : o)
      );
      return { previousOrders };
    },
    onError: (_err, _vars, context) => {
      // Rollback on error
      if (context?.previousOrders) {
        queryClient.setQueryData(['admin-orders'], context.previousOrders);
      }
      toast.error('Failed to update status');
    },
    onSuccess: (_data, { orderId, status }) => {
      const order = orders.find(o => o.id === orderId);
      logAuditAction({
        action: 'update',
        resource_type: 'order',
        resource_id: order?.order_number || orderId,
        description: `Order status changed to ${status}`,
        old_value: { status: order?.status },
        new_value: { status },
      });
      toast.success('Order status updated successfully');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
    },
  });

  // Update payment status mutation with optimistic updates (10.2)
  const updatePaymentStatusMutation = useMutation({
    mutationFn: async ({ orderId, paymentStatus }: { orderId: string; paymentStatus: string }) => {
      const { error } = await supabase
        .from('orders' as any)
        .update({ payment_status: paymentStatus, updated_at: new Date().toISOString() })
        .eq('id', orderId);

      if (error) throw error;
    },
    onMutate: async ({ orderId, paymentStatus }) => {
      await queryClient.cancelQueries({ queryKey: ['admin-orders'] });
      const previousOrders = queryClient.getQueryData(['admin-orders']);
      queryClient.setQueryData(['admin-orders'], (old: Order[] | undefined) =>
        old?.map(o => o.id === orderId ? { ...o, payment_status: paymentStatus, updated_at: new Date().toISOString() } : o)
      );
      return { previousOrders };
    },
    onError: (_err, _vars, context) => {
      if (context?.previousOrders) {
        queryClient.setQueryData(['admin-orders'], context.previousOrders);
      }
      toast.error('Failed to update payment status');
    },
    onSuccess: (_data, { orderId, paymentStatus }) => {
      const order = orders.find(o => o.id === orderId);
      logAuditAction({
        action: 'update',
        resource_type: 'order',
        resource_id: order?.order_number || orderId,
        description: `Payment status changed to ${paymentStatus}`,
        old_value: { payment_status: order?.payment_status },
        new_value: { payment_status: paymentStatus },
      });
      toast.success('Payment status updated successfully');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
    },
  });

  // Verify payment mutation
  const verifyPaymentMutation = useMutation({
    mutationFn: async ({ orderId, paymentStatus, notes }: { orderId: string; paymentStatus: 'paid' | 'failed'; notes: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('orders' as any)
        .update({
          payment_status: paymentStatus,
          payment_verified_at: new Date().toISOString(),
          payment_verified_by: user?.id || null,
          payment_verification_notes: notes || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      logAuditAction({
        action: 'update',
        resource_type: 'order',
        description: 'Payment verified',
      });
      toast.success('Payment verified successfully');
    },
    onError: (error: any) => {
      toast.error(`Failed to verify payment: ${error.message}`);
    },
  });

  // Trash order mutation (soft delete) with optimistic updates
  const deleteOrderMutation = useMutation({
    mutationFn: async (orderId: string) => {
      const { error } = await supabase
        .from('orders' as any)
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', orderId);

      if (error) throw error;
      return orderId;
    },
    onMutate: async (orderId) => {
      await queryClient.cancelQueries({ queryKey: ['admin-orders'] });
      const previousOrders = queryClient.getQueryData(['admin-orders']);
      queryClient.setQueryData(['admin-orders'], (old: Order[] | undefined) =>
        old?.filter(o => o.id !== orderId)
      );
      return { previousOrders };
    },
    onError: (_err, _vars, context) => {
      if (context?.previousOrders) {
        queryClient.setQueryData(['admin-orders'], context.previousOrders);
      }
      toast.error('Failed to trash order');
    },
    onSuccess: (_data, orderId) => {
      const order = orders.find(o => o.id === orderId);
      logAuditAction({
        action: 'delete',
        resource_type: 'order',
        resource_id: order?.order_number || orderId,
        description: `Order moved to trash`,
      });
      toast.success('Order moved to trash', {
        action: {
          label: 'Undo',
          onClick: async () => {
            await supabase.from('orders' as any).update({ deleted_at: null }).eq('id', orderId);
            queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
          },
        },
        duration: 5000,
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
    },
  });

  return {
    orders,
    stats,
    isLoading,
    error,
    refetch,
    updateStatus: updateStatusMutation.mutate,
    updatePaymentStatus: updatePaymentStatusMutation.mutate,
    verifyPayment: verifyPaymentMutation.mutate,
    deleteOrder: deleteOrderMutation.mutate,
    isUpdating: updateStatusMutation.isPending || updatePaymentStatusMutation.isPending,
    isVerifying: verifyPaymentMutation.isPending,
  };
}
