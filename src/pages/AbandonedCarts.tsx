import { useState } from "react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, ShoppingCart, Filter } from "lucide-react";
import { AbandonedCartStats } from "@/components/admin/AbandonedCartStats";
import { AbandonedCartTable } from "@/components/admin/AbandonedCartTable";
import { RecoveryRateChart } from "@/components/admin/RecoveryRateChart";
import { useAbandonedCartsData, type AbandonedCart } from "@/hooks/useAbandonedCartsData";

type FilterStatus = "all" | "abandoned" | "recovered" | "pending";

export default function AbandonedCarts() {
  const { abandonedCarts, stats, isLoading, refetch } = useAbandonedCartsData();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<FilterStatus>("all");

  const filteredCarts = abandonedCarts.filter((cart) => {
    // Search filter
    const matchesSearch =
      searchTerm === "" ||
      cart.customer_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cart.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cart.session_id.toLowerCase().includes(searchTerm.toLowerCase());

    // Status filter
    let matchesStatus = true;
    if (statusFilter === "abandoned") {
      matchesStatus = !!cart.abandoned_at && !cart.recovered_at;
    } else if (statusFilter === "recovered") {
      matchesStatus = !!cart.recovered_at;
    } else if (statusFilter === "pending") {
      matchesStatus = !!cart.abandoned_at && !cart.recovered_at && cart.reminder_sent_count < 3;
    }

    return matchesSearch && matchesStatus;
  });

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <AdminPageHeader
          title="Abandoned Carts"
          description="Track and recover abandoned shopping carts"
        />

        {/* Stats Cards */}
        <AbandonedCartStats stats={stats} />

        {/* Recovery Trend Chart */}
        <RecoveryRateChart carts={abandonedCarts} />

        {/* Main Content */}
        <div className="rounded-xl border border-border/50 bg-card p-5 sm:p-6">
          <div className="mb-1">
            <h2 className="text-lg font-semibold tracking-tight">Cart Recovery</h2>
            <p className="text-sm text-muted-foreground">
              View and manage abandoned shopping carts. Automatic email reminders are sent at 1h, 24h, and 72h.
            </p>
          </div>
          <div>
            <Tabs defaultValue="all" className="space-y-4" onValueChange={(value) => setStatusFilter(value as FilterStatus)}>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <TabsList>
                  <TabsTrigger value="all">
                    All ({abandonedCarts.length})
                  </TabsTrigger>
                  <TabsTrigger value="abandoned">
                    Abandoned ({stats.pending})
                  </TabsTrigger>
                  <TabsTrigger value="recovered">
                    Recovered ({stats.recovered})
                  </TabsTrigger>
                </TabsList>

                <div className="flex gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Search by email or name..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9 w-64"
                    />
                  </div>
                </div>
              </div>

              <TabsContent value="all" className="mt-4">
                <AbandonedCartTable carts={filteredCarts} isLoading={isLoading} onRefresh={refetch} />
              </TabsContent>
              <TabsContent value="abandoned" className="mt-4">
                <AbandonedCartTable carts={filteredCarts} isLoading={isLoading} onRefresh={refetch} />
              </TabsContent>
              <TabsContent value="recovered" className="mt-4">
                <AbandonedCartTable carts={filteredCarts} isLoading={isLoading} onRefresh={refetch} />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </>
  );
}
