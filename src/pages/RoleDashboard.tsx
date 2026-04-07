import { useState } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from "@dnd-kit/sortable";


import { WelcomeBanner } from "@/components/admin/WelcomeBanner";
import { RecentOrders } from "@/components/admin/RecentOrders";
import { SalesChart } from "@/components/admin/SalesChart";
import { TopProducts } from "@/components/admin/TopProducts";
import { DateRangeSelector, DateRangePreset } from "@/components/admin/DateRangeSelector";
import { ActivityFeed } from "@/components/admin/ActivityFeed";
import { DashboardWidget } from "@/components/admin/DashboardWidget";
import { AgentWorkloadStats } from "@/components/admin/AgentWorkloadStats";
import { AssignedToMeWidget } from "@/components/admin/AssignedToMeWidget";
import { ShiftSummaryWidget } from "@/components/admin/ShiftSummaryWidget";
import { RoleQuickActions } from "@/components/admin/RoleQuickActions";
import { PriorityQueue } from "@/components/admin/PriorityQueue";
import { ManagerApprovalQueue } from "@/components/admin/ManagerApprovalQueue";
import { SupportKeyboardShortcuts } from "@/components/admin/SupportKeyboardShortcuts";
import { useDashboardData } from "@/hooks/useDashboardData";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { StatsCard } from "@/components/admin/StatsCard";
import { ShoppingCart, Package, Users, TrendingUp, AlertCircle, Clock } from "lucide-react";
import { formatPrice } from "@/lib/formatPrice";

const RoleDashboard = () => {
  const { role, user } = useAuth();
  const { t } = useLanguage();
  const [dateRangePreset, setDateRangePreset] = useState<DateRangePreset>("last30days");
  const [customRange, setCustomRange] = useState<{ from: Date; to: Date } | undefined>();

  const {
    stats,
    recentOrders,
    topProducts,
    salesData,
    loading,
    refetch,
    dateRange,
  } = useDashboardData(dateRangePreset, customRange);

  const handleDateRangeChange = (preset: DateRangePreset, range?: { from: Date; to: Date }) => {
    setDateRangePreset(preset);
    if (range) setCustomRange(range);
  };


  const greetingName = user?.user_metadata?.full_name?.split(" ")[0] || "User";
  const roleLabel = role === "manager" ? "Manager" : "Support Agent";

  // Stats cards data
  const statsData = [
    { title: t("dashboard.totalSales"), value: formatPrice(stats.totalSales), change: stats.salesChange, icon: TrendingUp, iconBg: "accent" as const },
    { title: t("dashboard.totalOrders"), value: stats.totalOrders.toString(), change: stats.ordersChange, icon: ShoppingCart, iconBg: "primary" as const },
    { title: t("dashboard.totalProducts"), value: stats.totalProducts.toString(), change: stats.productsChange, icon: Package, iconBg: "warning" as const },
    { title: t("dashboard.totalCustomers"), value: stats.totalCustomers.toString(), change: stats.customersChange, icon: Users, iconBg: "success" as const },
  ];

  // --- Manager Dashboard ---
  if (role === "manager") {
    return (
      <>
        {/* Keyboard Shortcuts */}
        <SupportKeyboardShortcuts />
        {/* Header */}
        <AdminPageHeader
          title={`${roleLabel} Dashboard`}
          actions={
            <DateRangeSelector
              value={dateRangePreset}
              customRange={customRange}
              onChange={handleDateRangeChange}
            />
          }
        />

        {/* Welcome Banner */}
        <div className="mb-6">
          <WelcomeBanner basePath="/manager" />
        </div>

        <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
          {/* Stats Cards */}
          <div className="col-span-full">
            <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
              {loading
                ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-lg" />)
                : statsData.map((stat) => <StatsCard key={stat.title} {...stat} />)}
            </div>
          </div>

          {/* Assigned to Me */}
          <div className="md:col-span-1 lg:col-span-2">
            <div className="rounded-lg border bg-card p-3 sm:p-4 shadow-sm h-full">
              <h3 className="text-sm font-semibold mb-3">📌 Assigned to Me</h3>
              <AssignedToMeWidget />
            </div>
          </div>

          {/* Team Performance */}
          <div className="md:col-span-1 lg:col-span-2">
            <div className="rounded-lg border bg-card p-3 sm:p-4 shadow-sm h-full">
              <h3 className="text-sm font-semibold mb-3">👥 Team Performance</h3>
              <AgentWorkloadStats />
            </div>
          </div>

          {/* Sales Chart */}
          <div className="md:col-span-2 lg:col-span-2">
            <div className="rounded-lg border bg-card p-3 sm:p-4 shadow-sm h-full">
              <h3 className="text-sm font-semibold mb-3">📈 Sales Chart</h3>
              <SalesChart data={salesData} loading={loading} />
            </div>
          </div>

          {/* Shift Summary */}
          <div className="md:col-span-1 lg:col-span-1">
            <div className="rounded-lg border bg-card p-3 sm:p-4 shadow-sm h-full">
              <h3 className="text-sm font-semibold mb-3">📋 Shift Report</h3>
              <ShiftSummaryWidget />
            </div>
          </div>

          {/* Quick Actions */}
          <div className="md:col-span-1 lg:col-span-1">
            <div className="rounded-lg border bg-card p-3 sm:p-4 shadow-sm h-full">
              <h3 className="text-sm font-semibold mb-3">⚡ Quick Actions</h3>
              <RoleQuickActions onRefresh={() => refetch()} loading={loading} />
            </div>
          </div>

          {/* Recent Orders */}
          <div className="md:col-span-1 lg:col-span-2">
            <div className="rounded-lg border bg-card p-3 sm:p-4 shadow-sm h-full overflow-x-auto">
              <h3 className="text-sm font-semibold mb-3">🛒 Recent Orders</h3>
              <RecentOrders orders={recentOrders} loading={loading} />
            </div>
          </div>

          {/* Priority Queue */}
          <div className="md:col-span-1 lg:col-span-2">
            <div className="h-full">
              <PriorityQueue />
            </div>
          </div>

          {/* Approval Queue */}
          <div className="md:col-span-1 lg:col-span-2">
            <div className="h-full">
              <ManagerApprovalQueue />
            </div>
          </div>

          {/* Activity Feed */}
          <div className="md:col-span-1 lg:col-span-2">
            <div className="rounded-lg border bg-card p-3 sm:p-4 shadow-sm h-full">
              <h3 className="text-sm font-semibold mb-3">📊 Activity Feed</h3>
              <ActivityFeed limit={8} />
            </div>
          </div>
        </div>
      </>
    );
  }

  // --- Support Dashboard ---
  return (
    <>
      <SupportKeyboardShortcuts />

      <AdminPageHeader title="Support Dashboard" />

      {/* Welcome Banner */}
      <div className="mb-6">
        <WelcomeBanner basePath="/support" />
      </div>

      {/* Main Grid */}
      <div className="grid gap-4 sm:gap-5 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
        {/* Assigned to Me */}
        <div className="col-span-1 md:col-span-2 lg:col-span-3">
          <div className="rounded-xl border bg-card p-3 sm:p-4 shadow-sm h-full">
            <h3 className="text-sm font-semibold mb-3">📌 Assigned to Me</h3>
            <AssignedToMeWidget />
          </div>
        </div>

        {/* Quick Actions */}
        <div className="col-span-1">
          <div className="rounded-xl border bg-card p-3 sm:p-4 shadow-sm h-full">
            <h3 className="text-sm font-semibold mb-3">⚡ Quick Actions</h3>
            <RoleQuickActions onRefresh={() => refetch()} loading={loading} />
          </div>
        </div>

        {/* Today's Shift */}
        <div className="col-span-1 md:col-span-1 lg:col-span-2">
          <div className="rounded-xl border bg-card p-3 sm:p-4 shadow-sm h-full">
            <h3 className="text-sm font-semibold mb-3">📋 Today's Shift</h3>
            <ShiftSummaryWidget />
          </div>
        </div>

        {/* Priority Queue */}
        <div className="col-span-1 md:col-span-1 lg:col-span-2">
          <PriorityQueue />
        </div>

        {/* Activity Feed + Recent Orders side by side */}
        <div className="col-span-1 md:col-span-1 lg:col-span-2">
          <div className="rounded-xl border bg-card p-3 sm:p-4 shadow-sm h-full">
            <h3 className="text-sm font-semibold mb-3">📊 Activity Feed</h3>
            <ActivityFeed limit={6} />
          </div>
        </div>

        <div className="col-span-1 md:col-span-1 lg:col-span-2">
          <div className="rounded-xl border bg-card p-3 sm:p-4 shadow-sm h-full overflow-x-auto">
            <h3 className="text-sm font-semibold mb-3">🛒 Recent Orders</h3>
            <RecentOrders orders={recentOrders} loading={loading} />
          </div>
        </div>
      </div>
    </>
  );
};

export default RoleDashboard;
