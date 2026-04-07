import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { SEOHead } from "@/components/SEOHead";
import { DelayedLoader } from "@/components/ui/DelayedLoader";
import { GenericCardGridSkeleton } from "@/components/skeletons";
import { ShoppingTab } from "@/components/account/ShoppingTab";
import { motion } from "framer-motion";

export default function AccountShopping() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      setLoading(true);
      try {
        const { data: customerData } = await supabase
          .from("customers").select("id").eq("user_id", user.id).maybeSingle();
        if (customerData) {
          const { data: ordersData } = await supabase
            .from("orders").select("id, created_at").eq("customer_id", customerData.id).order("created_at", { ascending: false });
          if (ordersData) {
            const ordersWithItems = await Promise.all(
              ordersData.map(async (order) => {
                const { data: items } = await supabase
                  .from("order_items").select("id, product_name, quantity, unit_price, total_price, product_id").eq("order_id", order.id);
                return { id: order.id, created_at: order.created_at, items: items || [] };
              })
            );
            setOrders(ordersWithItems);
          }
        }
      } catch (error) { console.error("Error:", error); }
      finally { setLoading(false); }
    };
    fetch();
  }, [user]);

  if (loading) return <DelayedLoader><GenericCardGridSkeleton /></DelayedLoader>;

  return (
    <>
      <SEOHead title="Shopping History" noIndex />
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, ease: "easeOut" }}>
        <ShoppingTab orders={orders} />
      </motion.div>
    </>
  );
}
