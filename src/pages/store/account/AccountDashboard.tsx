import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { SEOHead } from "@/components/SEOHead";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Package, CheckCircle, Truck, Clock, ArrowRight, ShoppingBag, User, HelpCircle, LayoutDashboard } from "lucide-react";
import { DelayedLoader } from "@/components/ui/DelayedLoader";
import { DashboardSkeleton } from "@/components/skeletons";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ProfileCompletion } from "@/components/account/ProfileCompletion";
import { format } from "date-fns";
import { formatPrice } from "@/lib/formatPrice";
import { motion } from "framer-motion";

interface Order {
  id: string;
  order_number: string;
  status: string;
  total: number;
  created_at: string;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.07 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" as const } },
};

export default function AccountDashboard() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [addressCount, setAddressCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const statusConfig: Record<string, { label: string; className: string; icon: any }> = {
    pending: { label: t('account.pending'), className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400", icon: Clock },
    processing: { label: t('account.processing'), className: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400", icon: Package },
    shipped: { label: t('account.shipped'), className: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400", icon: Truck },
    delivered: { label: t('account.delivered'), className: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400", icon: CheckCircle },
  };

  const quickActions = [
    { label: t('account.myOrders'), icon: Package, url: "/myaccount/orders", color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-100 dark:bg-blue-900/30" },
    { label: t('account.shopNow'), icon: ShoppingBag, url: "/store/products", color: "text-accent", bg: "bg-accent/10" },
    { label: t('account.editProfile'), icon: User, url: "/myaccount/settings", color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-100 dark:bg-emerald-900/30" },
    { label: t('account.getSupport'), icon: HelpCircle, url: "/myaccount/support", color: "text-purple-600 dark:text-purple-400", bg: "bg-purple-100 dark:bg-purple-900/30" },
  ];

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      setLoading(true);
      try {
        const { data: profileData } = await supabase
          .from("profiles")
          .select("*")
          .eq("user_id", user.id)
          .single();
        if (profileData) {
          setProfile(profileData);
          setAvatarUrl(profileData.avatar_url);
        }

        const { count } = await supabase
          .from("user_addresses")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id);
        setAddressCount(count || 0);

        const { data: customerData } = await supabase
          .from("customers")
          .select("id")
          .eq("user_id", user.id)
          .maybeSingle();

        if (customerData) {
          const { data: ordersData } = await supabase
            .from("orders")
            .select("id, order_number, status, created_at, total_amount")
            .eq("customer_id", customerData.id)
            .order("created_at", { ascending: false });

          if (ordersData) {
            setOrders(
              ordersData.map((o: any) => ({
                id: o.id,
                order_number: o.order_number,
                status: o.status,
                total: Number(o.total_amount || 0),
                created_at: o.created_at,
              }))
            );
          }
        }
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  if (loading) {
    return <DelayedLoader><DashboardSkeleton /></DelayedLoader>;
  }

  const totalSpent = orders.reduce((sum, o) => sum + o.total, 0);
  const deliveredCount = orders.filter((o) => o.status === "delivered").length;
  const pendingCount = orders.filter((o) => ["pending", "processing"].includes(o.status)).length;
  const shippedCount = orders.filter((o) => o.status === "shipped").length;
  const recentOrders = orders.slice(0, 5);

  const statCards = [
    { label: t('account.totalOrders'), value: orders.length, borderColor: "border-l-blue-500", textColor: "text-blue-600 dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-950/20" },
    { label: t('account.totalSpent'), value: `${formatPrice(totalSpent)}`, borderColor: "border-l-green-500", textColor: "text-green-600 dark:text-green-400", bg: "bg-green-50 dark:bg-green-950/20" },
    { label: t('account.delivered'), value: deliveredCount, borderColor: "border-l-emerald-500", textColor: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-950/20" },
    { label: t('account.inTransit'), value: shippedCount, borderColor: "border-l-purple-500", textColor: "text-purple-600 dark:text-purple-400", bg: "bg-purple-50 dark:bg-purple-950/20" },
    { label: t('account.pending'), value: pendingCount, borderColor: "border-l-amber-500", textColor: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-950/20" },
  ];

  return (
    <>
      <SEOHead title="My Account" noIndex />
      <motion.div
        className="space-y-6"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Welcome Banner */}
        <motion.div variants={itemVariants} className="rounded-xl bg-gradient-to-r from-primary/5 via-accent/5 to-transparent p-5 sm:p-6 border border-border">
          <h1 className="font-display text-xl sm:text-2xl font-bold text-foreground">
            {t('account.welcomeBack')}, {profile?.full_name || t('orders.customer')}! 👋
          </h1>
          <p className="text-sm text-muted-foreground mt-1">{t('account.whatsHappening')}</p>
        </motion.div>

        {/* Profile Completion */}
        <motion.div variants={itemVariants}>
          <ProfileCompletion profile={profile} avatarUrl={avatarUrl} addressCount={addressCount} orderCount={orders.length} />
        </motion.div>

        {/* Stat Cards */}
        <motion.div variants={itemVariants} className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {statCards.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 + index * 0.05, duration: 0.3 }}
            >
              <Card className={`border-l-4 ${stat.borderColor} shadow-sm hover:shadow-md transition-shadow duration-200 ${stat.bg}`}>
                <CardContent className="p-4">
                  <p className={`text-2xl font-bold ${stat.textColor}`}>{stat.value}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* Quick Actions */}
        <motion.div variants={itemVariants} className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {quickActions.map((action, index) => {
            const Icon = action.icon;
            return (
              <motion.button
                key={action.label}
                onClick={() => navigate(action.url)}
                className="flex flex-col items-center gap-3 rounded-xl border border-border/50 bg-card p-5 text-center transition-all hover:shadow-lg hover:border-primary/20 hover:-translate-y-1 group"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + index * 0.05 }}
              >
                <div className={`p-3 rounded-xl ${action.bg} transition-transform group-hover:scale-110`}>
                  <Icon className={`h-5 w-5 ${action.color}`} />
                </div>
                <span className="text-xs font-medium text-foreground">{action.label}</span>
              </motion.button>
            );
          })}
        </motion.div>

        {/* Recent Orders */}
        <motion.div variants={itemVariants}>
          <Card className="border-border/50 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-base font-semibold">{t('account.recentOrders')}</CardTitle>
              <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80" onClick={() => navigate("/myaccount/orders")}>
                {t('account.viewAll')} <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </CardHeader>
            <CardContent>
              {recentOrders.length === 0 ? (
                <motion.div
                  className="text-center py-12"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4 }}
                >
                  <div className="mx-auto h-16 w-16 rounded-2xl bg-muted/50 flex items-center justify-center mb-4">
                    <Package className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <p className="text-sm font-medium text-foreground mb-1">No orders yet</p>
                  <p className="text-xs text-muted-foreground mb-4">{t('account.noOrdersYet')}</p>
                  <Button variant="outline" size="sm" onClick={() => navigate("/store/products")}>
                    <ShoppingBag className="h-4 w-4 mr-1.5" />
                    {t('account.startShopping')}
                  </Button>
                </motion.div>
              ) : (
                <div className="space-y-2">
                  {recentOrders.map((order, index) => {
                    const status = statusConfig[order.status] || statusConfig.pending;
                    const StatusIcon = status.icon;
                    return (
                      <motion.div
                        key={order.id}
                        className="flex items-center justify-between p-3 border border-border/50 rounded-xl hover:bg-muted/50 cursor-pointer transition-all hover:shadow-sm"
                        onClick={() => navigate("/myaccount/orders")}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.05 * index, duration: 0.3 }}
                        whileHover={{ x: 4 }}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${status.className}`}>
                            <StatusIcon className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="font-medium text-sm">{order.order_number}</p>
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(order.created_at), "MMM dd, yyyy")}
                            </p>
                          </div>
                        </div>
                        <div className="text-right flex items-center gap-3">
                          <div>
                            <p className="font-semibold text-sm">{formatPrice(order.total)}</p>
                            <Badge className={`${status.className} text-[10px]`} variant="secondary">
                              {status.label}
                            </Badge>
                          </div>
                          <ArrowRight className="h-4 w-4 text-muted-foreground" />
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </>
  );
}
