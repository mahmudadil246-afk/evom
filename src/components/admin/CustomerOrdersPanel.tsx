import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { ShoppingBag, Package, ChevronDown, ChevronUp } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/formatPrice";

interface CustomerOrder {
  id: string;
  order_number: string;
  status: string;
  total_amount: number;
  created_at: string;
  payment_status: string | null;
}

interface CustomerOrdersPanelProps {
  customerEmail: string | null;
  customerName: string;
}

const statusColors: Record<string, string> = {
  pending: "bg-warning/10 text-warning",
  processing: "bg-accent/10 text-accent",
  shipped: "bg-chart-5/10 text-chart-5",
  delivered: "bg-success/10 text-success",
  cancelled: "bg-destructive/10 text-destructive",
};

export function CustomerOrdersPanel({ customerEmail, customerName }: CustomerOrdersPanelProps) {
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (!customerEmail || !expanded) return;

    async function fetchOrders() {
      setLoading(true);
      try {
        // Find customer by email
        const { data: customers } = await supabase
          .from("customers")
          .select("id")
          .eq("email", customerEmail)
          .limit(1);

        if (customers && customers.length > 0) {
          const { data: orderData } = await supabase
            .from("orders")
            .select("id, order_number, status, total_amount, created_at, payment_status")
            .eq("customer_id", customers[0].id)
            .is("deleted_at", null)
            .order("created_at", { ascending: false })
            .limit(5);

          setOrders((orderData as CustomerOrder[]) || []);
        } else {
          setOrders([]);
        }
      } catch {
        setOrders([]);
      }
      setLoading(false);
    }

    fetchOrders();
  }, [customerEmail, expanded]);

  if (!customerEmail) return null;

  return (
    <div className="border-t pt-2">
      <Button
        variant="ghost"
        size="sm"
        className="w-full justify-between h-7 px-2 text-xs font-medium text-muted-foreground hover:text-foreground"
        onClick={() => setExpanded(!expanded)}
      >
        <span className="flex items-center gap-1.5">
          <ShoppingBag className="h-3 w-3" />
          Recent Orders
          {orders.length > 0 && (
            <Badge variant="secondary" className="h-4 px-1 text-[10px]">{orders.length}</Badge>
          )}
        </span>
        {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
      </Button>

      {expanded && (
        <div className="mt-1">
          {loading ? (
            <div className="space-y-2 px-2 pb-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : orders.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-3">No orders found</p>
          ) : (
            <ScrollArea className="max-h-[160px]">
              <div className="space-y-1.5 px-2 pb-2">
                {orders.map((order) => (
                  <div
                    key={order.id}
                    className="flex items-center justify-between rounded-md bg-muted/50 px-2.5 py-2 text-xs"
                  >
                    <div className="flex flex-col gap-0.5">
                      <span className="font-medium text-foreground">{order.order_number}</span>
                      <span className="text-[10px] text-muted-foreground">
                        {format(new Date(order.created_at), "dd MMM yyyy")}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-foreground">
                        {formatPrice(order.total_amount)}
                      </span>
                      <Badge className={`${statusColors[order.status] || "bg-muted text-muted-foreground"} text-[10px] px-1.5 py-0`}>
                        {order.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>
      )}
    </div>
  );
}
