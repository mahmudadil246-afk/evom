import { useState } from "react";
import { useRealtimeNotifications } from "@/hooks/useRealtimeNotifications";
import { Bell, BellOff, CheckCheck, Package, MessageCircle, Settings2, Tag, AlertCircle } from "lucide-react";
import { SEOHead } from "@/components/SEOHead";
import { DelayedLoader } from "@/components/ui/DelayedLoader";
import { GenericListSkeleton } from "@/components/skeletons";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { useLanguage } from "@/contexts/LanguageContext";
import { motion } from "framer-motion";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" as const } },
};

const typeConfig: Record<string, { icon: React.ElementType; label: string; color: string }> = {
  order: { icon: Package, label: "Order", color: "bg-blue-500/10 text-blue-600 dark:text-blue-400" },
  promo: { icon: Tag, label: "Promo", color: "bg-green-500/10 text-green-600 dark:text-green-400" },
  system: { icon: Settings2, label: "System", color: "bg-orange-500/10 text-orange-600 dark:text-orange-400" },
  support: { icon: MessageCircle, label: "Support", color: "bg-purple-500/10 text-purple-600 dark:text-purple-400" },
  alert: { icon: AlertCircle, label: "Alert", color: "bg-destructive/10 text-destructive" },
};

export default function AccountNotifications() {
  const { notifications, unreadCount, isLoading, markAsRead, markAllAsRead } = useRealtimeNotifications();
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState("all");

  const filtered = activeTab === "all"
    ? notifications
    : activeTab === "unread"
      ? notifications.filter(n => !n.is_read)
      : notifications.filter(n => n.type === activeTab);

  if (isLoading) return <DelayedLoader><GenericListSkeleton /></DelayedLoader>;

  const getTypeInfo = (type: string) => typeConfig[type] || { icon: Bell, label: "General", color: "bg-muted text-muted-foreground" };

  return (
    <>
      <SEOHead title="Notifications" noIndex />
      <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
        <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-foreground">Notifications</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {unreadCount > 0 ? `You have ${unreadCount} unread notification${unreadCount > 1 ? "s" : ""}` : "You're all caught up"}
            </p>
          </div>
          {unreadCount > 0 && (
            <Button variant="outline" size="sm" onClick={markAllAsRead} className="gap-1.5 shrink-0">
              <CheckCheck className="h-4 w-4" />Mark all as read
            </Button>
          )}
        </motion.div>

        <motion.div variants={itemVariants}>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="bg-muted/50 h-9">
              <TabsTrigger value="all" className="text-xs gap-1.5">
                All {notifications.length > 0 && <Badge variant="secondary" className="h-5 min-w-5 px-1 text-[10px]">{notifications.length}</Badge>}
              </TabsTrigger>
              <TabsTrigger value="unread" className="text-xs gap-1.5">
                Unread {unreadCount > 0 && <Badge className="h-5 min-w-5 px-1 text-[10px] bg-primary text-primary-foreground">{unreadCount}</Badge>}
              </TabsTrigger>
              <TabsTrigger value="order" className="text-xs">Orders</TabsTrigger>
              <TabsTrigger value="promo" className="text-xs">Promos</TabsTrigger>
              <TabsTrigger value="system" className="text-xs hidden sm:inline-flex">System</TabsTrigger>
            </TabsList>
          </Tabs>
        </motion.div>

        {filtered.length === 0 ? (
          <motion.div variants={itemVariants}>
            <Card className="border-dashed">
              <CardContent className="py-16 text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
                  <BellOff className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-sm font-semibold text-foreground mb-1">No notifications</h3>
                <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                  {activeTab === "unread" ? "You've read all your notifications. Great job!" : "When you receive notifications, they'll appear here."}
                </p>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <div className="space-y-1.5">
            {filtered.map((n) => {
              const typeInfo = getTypeInfo(n.type);
              const TypeIcon = typeInfo.icon;
              return (
                <motion.div key={n.id} variants={itemVariants}
                  onClick={() => !n.is_read && markAsRead(n.id)}
                  className={cn(
                    "group flex items-start gap-3 rounded-lg border bg-card p-3.5 transition-all cursor-pointer hover:shadow-sm",
                    !n.is_read ? "border-primary/20 bg-primary/[0.02] hover:bg-primary/[0.04]" : "border-border hover:bg-accent/50"
                  )}>
                  <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-lg", typeInfo.color)}>
                    <TypeIcon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className={cn("text-sm leading-tight", !n.is_read ? "font-semibold text-foreground" : "font-medium text-foreground/80")}>{n.title}</p>
                      {!n.is_read && <span className="h-2 w-2 rounded-full bg-primary shrink-0" />}
                      <Badge variant="outline" className={cn("ml-auto text-[10px] h-5 shrink-0 hidden sm:inline-flex", typeInfo.color)}>{typeInfo.label}</Badge>
                    </div>
                    {n.message && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{n.message}</p>}
                    <p className="text-[11px] text-muted-foreground/70 mt-1.5">{formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </motion.div>
    </>
  );
}
