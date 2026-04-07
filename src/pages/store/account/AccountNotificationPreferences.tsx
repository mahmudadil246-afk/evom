import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { SEOHead } from "@/components/SEOHead";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Bell, Package, Tag, Lock, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" as const } },
};

export default function AccountNotificationPreferences() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notifications, setNotifications] = useState({
    order_updates: true, order_shipped: true, order_delivered: true,
    promotions: false, new_arrivals: false, price_drops: false, account_activity: true,
  });

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      setLoading(true);
      try {
        const { data } = await supabase.from("profiles").select("notify_order_updates, notify_order_shipped, notify_order_delivered, notify_promotions, notify_new_arrivals, notify_price_drops, notify_account_activity").eq("user_id", user.id).single();
        if (data) {
          setNotifications({
            order_updates: data.notify_order_updates ?? true,
            order_shipped: data.notify_order_shipped ?? true,
            order_delivered: data.notify_order_delivered ?? true,
            promotions: data.notify_promotions ?? false,
            new_arrivals: data.notify_new_arrivals ?? false,
            price_drops: data.notify_price_drops ?? false,
            account_activity: data.notify_account_activity ?? true,
          });
        }
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    fetch();
  }, [user]);

  const handleChange = async (key: keyof typeof notifications, value: boolean) => {
    if (!user) return;
    setNotifications(prev => ({ ...prev, [key]: value }));
    setSaving(true);
    try {
      const updateData = { [`notify_${key}`]: value } as any;
      const { error } = await supabase.from("profiles").update(updateData).eq("user_id", user.id);
      if (error) throw error;
    } catch (error: any) {
      setNotifications(prev => ({ ...prev, [key]: !value }));
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally { setSaving(false); }
  };

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <>
      <SEOHead title="Notification Preferences" noIndex />
      <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
        <motion.div variants={itemVariants}>
          <Card>
            <CardContent className="pt-6 space-y-6">
              {/* Order Notifications */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2"><Package className="h-4 w-4" />{t('account.orderNotifications')}</h3>
                <div className="space-y-3">
                  {([
                    { key: "order_updates" as const, label: t('account.orderUpdates') },
                    { key: "order_shipped" as const, label: t('account.shippingNotifications') },
                    { key: "order_delivered" as const, label: t('account.deliveryNotifications') },
                  ]).map((item) => (
                    <div key={item.key}>
                      <div className="flex items-center justify-between">
                        <Label htmlFor={item.key}>{item.label}</Label>
                        <Switch id={item.key} checked={notifications[item.key]} onCheckedChange={(checked) => handleChange(item.key, checked)} disabled={saving} />
                      </div>
                      <Separator className="mt-3" />
                    </div>
                  ))}
                </div>
              </div>

              {/* Marketing */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2"><Tag className="h-4 w-4" />{t('account.marketingPromotions')}</h3>
                <div className="space-y-3">
                  {([
                    { key: "promotions" as const, label: t('account.promotionsOffers') },
                    { key: "new_arrivals" as const, label: t('account.newArrivals') },
                    { key: "price_drops" as const, label: t('account.priceDrops') },
                  ]).map((item) => (
                    <div key={item.key}>
                      <div className="flex items-center justify-between">
                        <Label htmlFor={item.key}>{item.label}</Label>
                        <Switch id={item.key} checked={notifications[item.key]} onCheckedChange={(checked) => handleChange(item.key, checked)} disabled={saving} />
                      </div>
                      <Separator className="mt-3" />
                    </div>
                  ))}
                </div>
              </div>

              {/* Security */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2"><Lock className="h-4 w-4" />{t('account.accountSecurity')}</h3>
                <div className="flex items-center justify-between">
                  <Label htmlFor="account_activity">{t('account.accountActivity')}</Label>
                  <Switch id="account_activity" checked={notifications.account_activity} onCheckedChange={(checked) => handleChange("account_activity", checked)} disabled={saving} />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </>
  );
}
