import { useState, useEffect } from "react";
import { 
  ShoppingCart, Package, Users, MessageSquare, CreditCard, Truck, Clock
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { formatPrice } from "@/lib/formatPrice";

interface ActivityItem {
  id: string;
  type: "order" | "customer" | "product" | "message" | "payment" | "shipping";
  title: string;
  description: string;
  timestamp: Date;
  status?: "success" | "warning" | "error" | "info";
}

const activityIcons = {
  order: ShoppingCart,
  customer: Users,
  product: Package,
  message: MessageSquare,
  payment: CreditCard,
  shipping: Truck,
};

const statusStyles = {
  success: "text-success bg-success/10 ring-success/20",
  warning: "text-warning bg-warning/10 ring-warning/20",
  error: "text-destructive bg-destructive/10 ring-destructive/20",
  info: "text-primary bg-primary/10 ring-primary/20",
};

interface ActivityFeedProps {
  limit?: number;
  className?: string;
}

export function ActivityFeed({ limit = 10, className }: ActivityFeedProps) {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchActivities = async () => {
    try {
      const { data: orders } = await supabase
        .from('orders')
        .select('id, order_number, status, payment_status, created_at, total_amount')
        .order('created_at', { ascending: false })
        .limit(5);

      const { data: customers } = await supabase
        .from('customers')
        .select('id, full_name, created_at')
        .order('created_at', { ascending: false })
        .limit(3);

      const { data: messages } = await supabase
        .from('contact_messages')
        .select('id, name, subject, created_at, status')
        .order('created_at', { ascending: false })
        .limit(3);

      const activityItems: ActivityItem[] = [];

      (orders || []).forEach((order: any) => {
        let status: ActivityItem["status"] = "info";
        let description = `Order #${order.order_number}`;

        if (order.status === "delivered") {
          status = "success";
          description += " was delivered";
        } else if (order.status === "cancelled") {
          status = "error";
          description += " was cancelled";
        } else if (order.status === "processing") {
          status = "info";
          description += " is being processed";
        } else if (order.status === "shipped") {
          status = "info";
          description += " has been shipped";
        } else {
          description += ` placed - ${formatPrice(order.total_amount)}`;
        }

        activityItems.push({
          id: `order-${order.id}`,
          type: "order",
          title: "New Order",
          description,
          timestamp: new Date(order.created_at),
          status,
        });
      });

      (customers || []).forEach((customer: any) => {
        activityItems.push({
          id: `customer-${customer.id}`,
          type: "customer",
          title: "New Customer",
          description: `${customer.full_name} registered`,
          timestamp: new Date(customer.created_at),
          status: "success",
        });
      });

      (messages || []).forEach((message: any) => {
        activityItems.push({
          id: `message-${message.id}`,
          type: "message",
          title: "Contact Message",
          description: `${message.name}: ${message.subject || "New inquiry"}`,
          timestamp: new Date(message.created_at),
          status: message.status === "replied" ? "success" : "warning",
        });
      });

      activityItems.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
      setActivities(activityItems.slice(0, limit));
    } catch (error) {
      console.error("Error fetching activities:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();

    const ordersChannel = supabase
      .channel('activity-orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, fetchActivities)
      .subscribe();

    const customersChannel = supabase
      .channel('activity-customers')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'customers' }, fetchActivities)
      .subscribe();

    const messagesChannel = supabase
      .channel('activity-messages')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'contact_messages' }, fetchActivities)
      .subscribe();

    return () => {
      supabase.removeChannel(ordersChannel);
      supabase.removeChannel(customersChannel);
      supabase.removeChannel(messagesChannel);
    };
  }, [limit]);

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex gap-3 p-2 rounded-lg bg-muted/30">
            <Skeleton className="h-8 w-8 rounded-full shrink-0" />
            <div className="flex-1 space-y-1">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-full" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={cn(className)}>
      <ScrollArea className="h-[300px] pr-2">
        {activities.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <Clock className="h-8 w-8 mb-2 opacity-40" />
            <p className="text-sm">No recent activity</p>
          </div>
        ) : (
          <div className="space-y-1.5">
            {activities.map((activity) => {
              const Icon = activityIcons[activity.type];
              return (
                <div
                  key={activity.id}
                  className="flex gap-3 p-2.5 rounded-lg border border-transparent hover:border-border/50 hover:bg-muted/30 transition-all duration-200 group"
                >
                  <div className={cn(
                    "h-8 w-8 rounded-full flex items-center justify-center shrink-0 ring-1",
                    statusStyles[activity.status || "info"]
                  )}>
                    <Icon className="h-3.5 w-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium text-foreground truncate">
                        {activity.title}
                      </p>
                      <span className="text-[10px] text-muted-foreground whitespace-nowrap bg-muted/50 px-1.5 py-0.5 rounded-full">
                        {formatDistanceToNow(activity.timestamp, { addSuffix: true })}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">
                      {activity.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
