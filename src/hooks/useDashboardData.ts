import { useState, useCallback, useRef } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { startOfMonth, subMonths, format } from 'date-fns';
import { DateRangePreset, getDateRangeFromPreset } from '@/components/admin/DateRangeSelector';

export interface DashboardStats {
  totalSales: number;
  totalOrders: number;
  totalCustomers: number;
  totalProducts: number;
  pendingOrders: number;
  lowStockProducts: number;
  salesChange: number;
  ordersChange: number;
  customersChange: number;
  productsChange: number;
  previousSales: number;
  previousOrders: number;
  previousCustomers: number;
  monthlySales: number;
  monthlyOrders: number;
  monthlyCustomers: number;
}

export interface RecentOrder {
  id: string;
  order_number: string;
  customer_name: string;
  total: number;
  status: string;
  payment_status: string;
  created_at: string;
}

export interface TopProduct {
  id: string;
  name: string;
  price: number;
  quantity: number;
  category: string | null;
}

export interface SalesDataPoint {
  name: string;
  sales: number;
  orders: number;
}

const calculateChange = (current: number, previous: number): number => {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100 * 10) / 10;
};

async function fetchDashboardBundle(dateRange: { from: Date; to: Date }) {
  const { from: rangeStart, to: rangeEnd } = dateRange;
  const rangeDuration = rangeEnd.getTime() - rangeStart.getTime();
  const previousStart = new Date(rangeStart.getTime() - rangeDuration);
  const monthStart = startOfMonth(new Date());

  // Single batch: all parallel queries
  const [
    currentOrdersRes,
    previousOrdersRes,
    allOrdersRes,
    totalCustomersRes,
    currentCustomersRes,
    previousCustomersRes,
    monthlyCustomersRes,
    productsRes,
    recentOrdersRes,
    orderItemsRes,
  ] = await Promise.all([
    supabase.from('orders' as any).select('total_amount, status, created_at')
      .gte('created_at', rangeStart.toISOString()).lte('created_at', rangeEnd.toISOString()),
    supabase.from('orders' as any).select('total_amount, status, created_at')
      .gte('created_at', previousStart.toISOString()).lt('created_at', rangeStart.toISOString()),
    supabase.from('orders' as any).select('total_amount, status, created_at'),
    supabase.from('customers' as any).select('*', { count: 'exact', head: true }),
    supabase.from('customers' as any).select('*', { count: 'exact', head: true })
      .gte('created_at', rangeStart.toISOString()).lte('created_at', rangeEnd.toISOString()),
    supabase.from('customers' as any).select('*', { count: 'exact', head: true })
      .gte('created_at', previousStart.toISOString()).lt('created_at', rangeStart.toISOString()),
    supabase.from('customers' as any).select('*', { count: 'exact', head: true })
      .gte('created_at', monthStart.toISOString()),
    supabase.from('products' as any).select('quantity, created_at').is('deleted_at', null),
    supabase.from('orders' as any).select('id, order_number, total_amount, status, payment_status, created_at, customers (full_name)')
      .order('created_at', { ascending: false }).limit(5),
    supabase.from('order_items' as any).select('product_id, quantity'),
  ]);

  // === Stats ===
  const currentOrdersData = (currentOrdersRes.data as any[]) || [];
  const previousOrdersData = (previousOrdersRes.data as any[]) || [];
  const allOrdersData = (allOrdersRes.data as any[]) || [];
  const productsData = (productsRes.data as any[]) || [];

  const totalSales = allOrdersData.reduce((sum, o) => sum + Number(o.total_amount), 0);
  const totalOrders = allOrdersData.length;
  const pendingOrders = allOrdersData.filter(o => o.status === 'pending').length;

  const currentPeriodSales = currentOrdersData.reduce((sum, o) => sum + Number(o.total_amount), 0);
  const previousPeriodSales = previousOrdersData.reduce((sum, o) => sum + Number(o.total_amount), 0);

  // Monthly stats from allOrders (filter in JS)
  const monthlyOrders = allOrdersData.filter(o => new Date(o.created_at) >= monthStart);
  const monthlySales = monthlyOrders.reduce((sum, o) => sum + Number(o.total_amount), 0);

  const totalProducts = productsData.length;
  const lowStockProducts = productsData.filter(p => (p.quantity || 0) < 10).length;
  const currentProducts = productsData.filter(p => {
    const d = new Date(p.created_at);
    return d >= rangeStart && d <= rangeEnd;
  }).length;
  const previousProducts = productsData.filter(p => {
    const d = new Date(p.created_at);
    return d >= previousStart && d < rangeStart;
  }).length;

  const stats: DashboardStats = {
    totalSales,
    totalOrders,
    totalCustomers: totalCustomersRes.count || 0,
    totalProducts,
    pendingOrders,
    lowStockProducts,
    salesChange: calculateChange(currentPeriodSales, previousPeriodSales),
    ordersChange: calculateChange(currentOrdersData.length, previousOrdersData.length),
    customersChange: calculateChange(currentCustomersRes.count || 0, previousCustomersRes.count || 0),
    productsChange: calculateChange(currentProducts, previousProducts),
    previousSales: previousPeriodSales,
    previousOrders: previousOrdersData.length,
    previousCustomers: previousCustomersRes.count || 0,
    monthlySales,
    monthlyOrders: monthlyOrders.length,
    monthlyCustomers: monthlyCustomersRes.count || 0,
  };

  // === Sales Chart — group allOrders by month (no loop!) ===
  const now = new Date();
  const twelveMonthsAgo = subMonths(now, 11);
  const monthBuckets: Record<string, { sales: number; orders: number }> = {};
  for (let i = 11; i >= 0; i--) {
    const key = format(subMonths(now, i), 'MMM');
    monthBuckets[key] = { sales: 0, orders: 0 };
  }
  allOrdersData.forEach(o => {
    const d = new Date(o.created_at);
    if (d >= startOfMonth(twelveMonthsAgo)) {
      const key = format(d, 'MMM');
      if (monthBuckets[key]) {
        monthBuckets[key].sales += Number(o.total_amount);
        monthBuckets[key].orders += 1;
      }
    }
  });
  const salesData: SalesDataPoint[] = Object.entries(monthBuckets).map(([name, data]) => ({
    name,
    sales: data.sales,
    orders: data.orders,
  }));

  // === Recent Orders ===
  const recentOrders: RecentOrder[] = ((recentOrdersRes.data as any[]) || []).map((order: any) => ({
    id: order.id,
    order_number: order.order_number,
    customer_name: order.customers?.full_name || 'Unknown',
    total: Number(order.total_amount),
    status: order.status,
    payment_status: order.payment_status || 'pending',
    created_at: order.created_at,
  }));

  // === Top Products ===
  const productSales: Record<string, number> = {};
  ((orderItemsRes.data as any[]) || []).forEach((item: any) => {
    if (item.product_id) {
      productSales[item.product_id] = (productSales[item.product_id] || 0) + (item.quantity || 1);
    }
  });

  const topProductIds = Object.entries(productSales)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([id]) => id);

  let topProducts: TopProduct[] = [];
  if (topProductIds.length > 0) {
    const { data: prods } = await supabase
      .from('products' as any)
      .select('id, name, price, quantity, category')
      .in('id', topProductIds);

    topProducts = topProductIds
      .map(id => (prods as any[])?.find((p: any) => p.id === id))
      .filter(Boolean)
      .map((p: any) => ({
        id: p.id,
        name: p.name,
        price: Number(p.price),
        quantity: productSales[p.id] || 0,
        category: p.category,
      }));
  } else {
    const { data: fallback } = await supabase
      .from('products' as any)
      .select('id, name, price, quantity, category')
      .eq('is_active', true)
      .order('quantity', { ascending: false })
      .limit(5);
    topProducts = ((fallback as any[]) || []).map((p: any) => ({
      id: p.id, name: p.name, price: Number(p.price), quantity: p.quantity || 0, category: p.category,
    }));
  }

  return { stats, salesData, recentOrders, topProducts };
}

export function useDashboardData(
  dateRangePreset: DateRangePreset = 'last30days',
  customRange?: { from: Date; to: Date }
) {
  const dateRange = getDateRangeFromPreset(dateRangePreset, customRange);
  const rangeKey = `${dateRange.from.getTime()}-${dateRange.to.getTime()}`;

  const { data, isLoading: loading, refetch } = useQuery({
    queryKey: ['dashboard-data', rangeKey],
    queryFn: () => fetchDashboardBundle(dateRange),
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    placeholderData: keepPreviousData,
  });

  return {
    stats: data?.stats || {
      totalSales: 0, totalOrders: 0, totalCustomers: 0, totalProducts: 0,
      pendingOrders: 0, lowStockProducts: 0, salesChange: 0, ordersChange: 0,
      customersChange: 0, productsChange: 0, previousSales: 0, previousOrders: 0,
      previousCustomers: 0, monthlySales: 0, monthlyOrders: 0, monthlyCustomers: 0,
    },
    recentOrders: data?.recentOrders || [],
    topProducts: data?.topProducts || [],
    salesData: data?.salesData || [],
    loading,
    refetch,
    dateRange,
  };
}
