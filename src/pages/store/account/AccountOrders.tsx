import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { DelayedLoader } from "@/components/ui/DelayedLoader";
import { OrdersListSkeleton } from "@/components/skeletons";
import { OrdersTab } from "@/components/account/OrdersTab";
import { SEOHead } from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { useAccountHeaderActions } from "@/layouts/CustomerAccountLayout";
import { motion } from "framer-motion";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" as const } },
};

export default function AccountOrders() {
  const { user } = useAuth();
  const { setHeaderActions } = useAccountHeaderActions();
  
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data: customerData } = await supabase
        .from("customers")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (customerData) {
        const { data: ordersData } = await supabase
          .from("orders")
          .select("*")
          .eq("customer_id", customerData.id)
          .order("created_at", { ascending: false });

        if (ordersData) {
          const ordersWithItems = await Promise.all(
            ordersData.map(async (order) => {
              const { data: items } = await supabase
                .from("order_items")
                .select("*")
                .eq("order_id", order.id);

              return {
                id: order.id,
                order_number: order.order_number,
                created_at: order.created_at,
                status: order.status,
                total: Number((order as any).total || (order as any).total_amount || 0),
                subtotal: Number(order.subtotal || 0),
                shipping_cost: Number(order.shipping_cost || 0),
                discount_amount: Number(order.discount_amount || 0),
                payment_status: order.payment_status,
                payment_method: order.payment_method || "N/A",
                shipping_address: order.shipping_address,
                items: (items || []).map((i) => ({
                  id: i.id,
                  product_name: i.product_name,
                  quantity: i.quantity,
                  unit_price: Number(i.unit_price),
                  total_price: Number(i.total_price),
                  product_id: i.product_id,
                })),
              };
            })
          );
          setOrders(ordersWithItems);
        }
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [user]);

  useEffect(() => {
    setHeaderActions(
      <Button variant="ghost" size="sm" onClick={fetchOrders}>
        <RefreshCw className="h-4 w-4 mr-1" />
        Refresh
      </Button>
    );
  }, []);

  if (loading) {
    return <DelayedLoader><OrdersListSkeleton /></DelayedLoader>;
  }

  return (
    <>
      <SEOHead title="My Orders" noIndex />
      <motion.div variants={containerVariants} initial="hidden" animate="visible">
        <motion.div variants={itemVariants}>
          <OrdersTab orders={orders} onRefresh={fetchOrders} />
        </motion.div>
      </motion.div>
    </>
  );
}
