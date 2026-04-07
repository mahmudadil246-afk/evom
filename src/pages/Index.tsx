import { useState, useEffect, lazy, Suspense } from "react";

import { ShoppingCart, Package, Users, TrendingUp, AlertCircle, Clock, RefreshCw, RotateCcw, DollarSign, PackageX, Tag, Headphones, ShoppingBag, CalendarCheck, CheckCircle, Mail, Undo2, Target, TrendingDown } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { StatsCard } from "@/components/admin/StatsCard";
import { QuickActions } from "@/components/admin/QuickActions";
import { DateRangeSelector, DateRangePreset } from "@/components/admin/DateRangeSelector";
import { DashboardWidget } from "@/components/admin/DashboardWidget";
import { DashboardWidgetPicker } from "@/components/admin/DashboardWidgetPicker";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { useDashboardData } from "@/hooks/useDashboardData";
import { useDashboardLayout } from "@/hooks/useDashboardLayout";
import { useGoalTracker } from "@/hooks/useGoalTracker";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { WelcomeBanner } from "@/components/admin/WelcomeBanner";
import { format } from "date-fns";
import { formatPrice } from "@/lib/formatPrice";

// Lazy-loaded heavy dashboard widgets
const SalesChart = lazy(() => import("@/components/admin/SalesChart").then(m => ({ default: m.SalesChart })));
const TopProducts = lazy(() => import("@/components/admin/TopProducts").then(m => ({ default: m.TopProducts })));
const RecentOrders = lazy(() => import("@/components/admin/RecentOrders").then(m => ({ default: m.RecentOrders })));
const ActivityFeed = lazy(() => import("@/components/admin/ActivityFeed").then(m => ({ default: m.ActivityFeed })));
const GoalTracker = lazy(() => import("@/components/admin/GoalTracker").then(m => ({ default: m.GoalTracker })));
const PeriodComparison = lazy(() => import("@/components/admin/PeriodComparison").then(m => ({ default: m.PeriodComparison })));
const RecentReturnRequests = lazy(() => import("@/components/admin/RecentReturnRequests").then(m => ({ default: m.RecentReturnRequests })));

const WidgetLoader = () => <Skeleton className="h-48 w-full rounded-lg" />;

const Index = () => {
  const [dateRangePreset, setDateRangePreset] = useState<DateRangePreset>("last30days");
  const [customRange, setCustomRange] = useState<{ from: Date; to: Date } | undefined>();
  const [pendingReturns, setPendingReturns] = useState(0);
  const [refundStats, setRefundStats] = useState({ count: 0, amount: 0 });
  const [activeCoupons, setActiveCoupons] = useState(0);
  const [openTickets, setOpenTickets] = useState(0);
  const [abandonedCarts, setAbandonedCarts] = useState(0);
  const [todaySales, setTodaySales] = useState(0);
  const [deliveredOrders, setDeliveredOrders] = useState(0);
  const [newsletterSubs, setNewsletterSubs] = useState(0);
  const { 
    stats, 
    recentOrders, 
    topProducts, 
    salesData, 
    loading, 
    refetch,
    dateRange,
  } = useDashboardData(dateRangePreset, customRange);

  useEffect(() => {
    async function fetchExtraStats() {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const [returnRes, refundedRes, couponsRes, ticketsRes, cartsRes, todayOrdersRes, deliveredRes, newsletterRes] = await Promise.all([
        supabase.from('return_requests').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('orders' as any).select('refund_amount, refund_status').eq('refund_status', 'refunded'),
        supabase.from('coupons' as any).select('*', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('support_tickets' as any).select('*', { count: 'exact', head: true }).eq('status', 'open'),
        supabase.from('abandoned_carts' as any).select('*', { count: 'exact', head: true }).is('recovered_at', null),
        supabase.from('orders' as any).select('total_amount').gte('created_at', today.toISOString()),
        supabase.from('orders' as any).select('*', { count: 'exact', head: true }).eq('status', 'delivered'),
        supabase.from('newsletter_subscribers' as any).select('*', { count: 'exact', head: true }).eq('is_active', true),
      ]);

      setPendingReturns(returnRes.count || 0);
      setActiveCoupons(couponsRes.count || 0);
      setOpenTickets(ticketsRes.count || 0);
      setAbandonedCarts(cartsRes.count || 0);
      setDeliveredOrders(deliveredRes.count || 0);
      setNewsletterSubs(newsletterRes.count || 0);

      if (refundedRes.data) {
        const total = (refundedRes.data as any[]).reduce((sum, o) => sum + Number(o.refund_amount || 0), 0);
        setRefundStats({ count: (refundedRes.data as any[]).length, amount: total });
      }

      if (todayOrdersRes.data) {
        const total = (todayOrdersRes.data as any[]).reduce((sum, o) => sum + Number(o.total_amount || 0), 0);
        setTodaySales(total);
      }
    }
    fetchExtraStats();
  }, []);
  
  const {
    widgets,
    visibleWidgets,
    moveWidget,
    removeWidget,
    addWidget,
    resetLayout,
  } = useDashboardLayout();

  const {
    currentGoal,
    history: goalHistory,
    loading: goalsLoading,
    updateTarget,
  } = useGoalTracker(stats.monthlySales, stats.monthlyOrders, stats.monthlyCustomers);




  const handleDateRangeChange = (preset: DateRangePreset, range?: { from: Date; to: Date }) => {
    setDateRangePreset(preset);
    if (range) {
      setCustomRange(range);
    }
  };



  const avgOrderValue = stats.totalOrders > 0 ? stats.totalSales / stats.totalOrders : 0;
  const conversionRate = stats.totalCustomers > 0 ? ((stats.totalOrders / stats.totalCustomers) * 100) : 0;

  const statsData = [
    // Row 1: Revenue & Sales overview
    { title: 'Total Sales', value: formatPrice(stats.totalSales), change: stats.salesChange, icon: TrendingUp, iconBg: "accent" as const },
    { title: "Today's Sales", value: formatPrice(todaySales), change: 0, icon: CalendarCheck, iconBg: "success" as const },
    { title: "Avg. Order Value", value: formatPrice(Math.round(avgOrderValue)), change: 0, icon: DollarSign, iconBg: "success" as const },
    { title: "Revenue Growth", value: `${stats.salesChange >= 0 ? '+' : ''}${stats.salesChange}%`, change: stats.salesChange, icon: stats.salesChange >= 0 ? TrendingUp : TrendingDown, iconBg: stats.salesChange >= 0 ? "success" as const : "warning" as const },
    { title: "Total Refunded", value: formatPrice(refundStats.amount), change: 0, icon: RotateCcw, iconBg: "accent" as const },
    { title: "Total Refunds", value: refundStats.count.toString(), change: 0, icon: RotateCcw, iconBg: "warning" as const },
    // Row 2: Orders lifecycle
    { title: 'Total Orders', value: stats.totalOrders.toString(), change: stats.ordersChange, icon: ShoppingCart, iconBg: "primary" as const },
    { title: "Pending Orders", value: stats.pendingOrders.toString(), change: 0, icon: Clock, iconBg: "warning" as const },
    { title: "Total Delivered", value: deliveredOrders.toString(), change: 0, icon: CheckCircle, iconBg: "success" as const },
    { title: "Abandoned Carts", value: abandonedCarts.toString(), change: 0, icon: ShoppingBag, iconBg: "warning" as const },
    { title: 'Total Customers', value: stats.totalCustomers.toString(), change: stats.customersChange, icon: Users, iconBg: "primary" as const },
    { title: "Conversion Rate", value: `${conversionRate.toFixed(1)}%`, change: 0, icon: Target, iconBg: "accent" as const },
    // Row 3: Inventory & Support
    { title: 'Total Products', value: stats.totalProducts.toString(), change: stats.productsChange, icon: Package, iconBg: "primary" as const },
    { title: "Low Stock", value: stats.lowStockProducts.toString(), change: 0, icon: PackageX, iconBg: "warning" as const },
    { title: "Active Coupons", value: activeCoupons.toString(), change: 0, icon: Tag, iconBg: "accent" as const },
    { title: "Open Tickets", value: openTickets.toString(), change: 0, icon: Headphones, iconBg: "primary" as const },
    { title: "Pending Returns", value: pendingReturns.toString(), change: 0, icon: Undo2, iconBg: "warning" as const },
    { title: "Newsletter Subs", value: newsletterSubs.toString(), change: 0, icon: Mail, iconBg: "success" as const },
  ];

  const comparisonMetrics = [
    {
      label: "Sales",
      current: stats.monthlySales,
      previous: stats.previousSales,
      format: "currency" as const,
    },
    {
      label: "Orders",
      current: stats.monthlyOrders,
      previous: stats.previousOrders,
      format: "number" as const,
    },
    {
      label: "Customers",
      current: stats.monthlyCustomers,
      previous: stats.previousCustomers,
      format: "number" as const,
    },
    {
      label: "Avg. Order",
      current: stats.monthlyOrders > 0 ? stats.monthlySales / stats.monthlyOrders : 0,
      previous: stats.previousOrders > 0 ? stats.previousSales / stats.previousOrders : 0,
      format: "currency" as const,
    },
  ];

  const renderWidget = (widget: typeof visibleWidgets[0]) => {
    switch (widget.type) {
      case "alerts":
        return null;

      case "stats":
        return (
          <div key={widget.id} className="md:col-span-2 lg:col-span-4">
            <div className="grid grid-cols-2 gap-3 sm:gap-4 sm:grid-cols-3 lg:grid-cols-6">
              {loading ? (
                Array.from({ length: 18 }).map((_, index) => (
                  <Skeleton key={index} className="h-28 rounded-xl" />
                ))
              ) : (
                statsData.map((stat) => (
                  <StatsCard key={stat.title} {...stat} />
                ))
              )}
            </div>
          </div>
        );

      case "periodComparison":
        return (
          <div key={widget.id} className="md:col-span-2 lg:col-span-4 rounded-xl border border-border/50 bg-card p-4 sm:p-5 transition-all duration-300 hover:shadow-md hover:border-border animate-fade-in">
            <h3 className="text-sm font-semibold tracking-tight text-foreground mb-3">{widget.title}</h3>
            <Suspense fallback={<WidgetLoader />}>
              <PeriodComparison
                metrics={comparisonMetrics}
                currentPeriodLabel={`${format(dateRange.from, "MMM d")} - ${format(dateRange.to, "MMM d")}`}
                previousPeriodLabel="Previous period"
                loading={loading}
              />
            </Suspense>
          </div>
        );

      case "salesChart":
        return (
          <div key={widget.id} className="md:col-span-2 lg:col-span-2 rounded-xl border border-border/50 bg-card p-4 sm:p-5 transition-all duration-300 hover:shadow-md hover:border-border animate-fade-in">
            <h3 className="text-sm font-semibold tracking-tight text-foreground mb-3">{widget.title}</h3>
            <Suspense fallback={<WidgetLoader />}>
              <SalesChart data={salesData} loading={loading} />
            </Suspense>
          </div>
        );

      case "salesChart__inner":
        return (
          <div key={widget.id} className="rounded-xl border border-border/50 bg-card p-4 sm:p-5 transition-all duration-300 hover:shadow-md hover:border-border animate-fade-in">
            <h3 className="text-sm font-semibold tracking-tight text-foreground mb-3">Sales Chart</h3>
            <Suspense fallback={<WidgetLoader />}>
              <SalesChart data={salesData} loading={loading} />
            </Suspense>
          </div>
        );

      case "goalTracker":
      case "goalTracker__inner":
        return (
          <div key={widget.id} className="rounded-xl border border-border/50 bg-card p-4 sm:p-5 transition-all duration-300 hover:shadow-md hover:border-border animate-fade-in">
            <h3 className="text-sm font-semibold tracking-tight text-foreground mb-3">Goal Tracker</h3>
            <Suspense fallback={<WidgetLoader />}>
              <GoalTracker
                currentGoal={currentGoal}
                history={goalHistory}
                currentSales={stats.monthlySales}
                currentOrders={stats.monthlyOrders}
                currentCustomers={stats.monthlyCustomers}
                loading={loading || goalsLoading}
                onUpdateTarget={updateTarget}
              />
            </Suspense>
          </div>
        );

      case "activityFeed":
      case "activityFeed__inner":
        return (
          <div key={widget.id} className="rounded-xl border border-border/50 bg-card p-4 sm:p-5 transition-all duration-300 hover:shadow-md hover:border-border animate-fade-in">
            <h3 className="text-sm font-semibold tracking-tight text-foreground mb-3">Activity Feed</h3>
            <Suspense fallback={<WidgetLoader />}>
              <ActivityFeed limit={8} />
            </Suspense>
          </div>
        );

      case "topProducts":
        return (
          <div key={widget.id} className="md:col-span-2 lg:col-span-2 rounded-xl border border-border/50 bg-card p-4 sm:p-5 transition-all duration-300 hover:shadow-md hover:border-border animate-fade-in">
            <h3 className="text-sm font-semibold tracking-tight text-foreground mb-3">{widget.title}</h3>
            <Suspense fallback={<WidgetLoader />}>
              <TopProducts products={topProducts} loading={loading} />
            </Suspense>
          </div>
        );

      case "topProducts__inner":
        return (
          <div key={widget.id} className="rounded-xl border border-border/50 bg-card p-4 sm:p-5 transition-all duration-300 hover:shadow-md hover:border-border animate-fade-in">
            <h3 className="text-sm font-semibold tracking-tight text-foreground mb-3">Top Products</h3>
            <Suspense fallback={<WidgetLoader />}>
              <TopProducts products={topProducts} loading={loading} />
            </Suspense>
          </div>
        );

      case "recentOrders":
        return (
          <div key={widget.id} className="md:col-span-2 lg:col-span-3 rounded-xl border border-border/50 bg-card p-4 sm:p-5 transition-all duration-300 hover:shadow-md hover:border-border animate-fade-in">
            <h3 className="text-sm font-semibold tracking-tight text-foreground mb-3">{widget.title}</h3>
            <Suspense fallback={<WidgetLoader />}>
              <RecentOrders orders={recentOrders} loading={loading} />
            </Suspense>
          </div>
        );

      case "returnRequests":
      case "returnRequests__inner":
        return (
          <div key={widget.id} className="rounded-xl border border-border/50 bg-card p-4 sm:p-5 transition-all duration-300 hover:shadow-md hover:border-border animate-fade-in">
            <h3 className="text-sm font-semibold tracking-tight text-foreground mb-3">Return/Refund Requests</h3>
            <Suspense fallback={<WidgetLoader />}>
              <RecentReturnRequests loading={loading} />
            </Suspense>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <AdminPageHeader
        title="Dashboard"
        description="Overview of your store performance"
        actions={
          <DateRangeSelector
            value={dateRangePreset}
            customRange={customRange}
            onChange={handleDateRangeChange}
          />
        }
      />

      {/* Welcome Banner */}
      <WelcomeBanner />

      {/* Widget Grid */}
      <div className="grid gap-4 sm:gap-5 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
        {visibleWidgets.map((widget) => {
          // Sales Chart + Top Products side by side (forced group)
          if (widget.type === "salesChart") {
            const topProductsWidget = visibleWidgets.find(w => w.type === "topProducts");
            return (
              <div key="charts-group" className="md:col-span-2 lg:col-span-4 grid gap-4 sm:gap-5 grid-cols-1 md:grid-cols-2">
                {renderWidget({ ...widget, type: "salesChart__inner" as any })}
                {topProductsWidget && renderWidget({ ...topProductsWidget, type: "topProducts__inner" as any })}
              </div>
            );
          }
          // Skip topProducts since it's rendered in the charts group above
          if (widget.type === "topProducts") return null;

          // Group Goal Tracker, Activity Feed, Return Requests into a 3-col sub-grid
          if (widget.type === "goalTracker") {
            const activityWidget = visibleWidgets.find(w => w.type === "activityFeed");
            const returnWidget = visibleWidgets.find(w => w.type === "returnRequests");
            return (
              <div key="three-col-group" className="md:col-span-2 lg:col-span-4 grid gap-4 sm:gap-5 grid-cols-1 md:grid-cols-3">
                {renderWidget({ ...widget, type: "goalTracker__inner" as any })}
                {activityWidget && renderWidget({ ...activityWidget, type: "activityFeed__inner" as any })}
                {returnWidget && renderWidget({ ...returnWidget, type: "returnRequests__inner" as any })}
              </div>
            );
          }
          // Skip these since they're rendered in the group above
          if (widget.type === "activityFeed" || widget.type === "returnRequests") return null;
          return renderWidget(widget);
        })}
      </div>
    </div>
  );
};

export default Index;
