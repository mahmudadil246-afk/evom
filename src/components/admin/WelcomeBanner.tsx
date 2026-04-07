import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ShoppingCart, MessageSquare, RotateCcw, AlertTriangle, Sparkles } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

interface WelcomeBannerProps {
  basePath?: string;
}

interface PendingSummary {
  pendingOrders: number;
  unreadMessages: number;
  pendingReturns: number;
  lowStockProducts: number;
}

export function WelcomeBanner({ basePath = '/admin' }: WelcomeBannerProps) {
  const { user, role } = useAuth();
  const navigate = useNavigate();
  const [summary, setSummary] = useState<PendingSummary>({
    pendingOrders: 0,
    unreadMessages: 0,
    pendingReturns: 0,
    lowStockProducts: 0,
  });

  useEffect(() => {
    async function fetchSummary() {
      const [orders, messages, returns, products] = await Promise.all([
        supabase.from('orders' as any).select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('contact_messages').select('*', { count: 'exact', head: true }).eq('is_read', false).is('deleted_at', null),
        supabase.from('return_requests').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('products' as any).select('quantity').lt('quantity', 10),
      ]);

      setSummary({
        pendingOrders: orders.count || 0,
        unreadMessages: messages.count || 0,
        pendingReturns: returns.count || 0,
        lowStockProducts: (products.data as any[])?.length || 0,
      });
    }
    fetchSummary();
  }, []);

  const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Admin';
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  const items = [
    { count: summary.pendingOrders, label: 'pending orders', icon: ShoppingCart, color: 'text-warning', bg: 'bg-warning/10 hover:bg-warning/20', path: `${basePath}/orders` },
    { count: summary.unreadMessages, label: 'unread messages', icon: MessageSquare, color: 'text-primary', bg: 'bg-primary/10 hover:bg-primary/20', path: `${basePath}/messages` },
    { count: summary.pendingReturns, label: 'return requests', icon: RotateCcw, color: 'text-chart-5', bg: 'bg-chart-5/10 hover:bg-chart-5/20', path: `${basePath}/orders` },
    { count: summary.lowStockProducts, label: 'low stock items', icon: AlertTriangle, color: 'text-destructive', bg: 'bg-destructive/10 hover:bg-destructive/20', path: `${basePath}/products` },
  ].filter(item => item.count > 0);

  return (
    <div className="relative overflow-hidden rounded-2xl border border-primary/10 bg-gradient-to-br from-primary/5 via-background to-accent/5 p-4 sm:p-6 animate-fade-in">
      {/* Decorative elements */}
      <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-primary/5 blur-2xl" />
      <div className="absolute -left-4 -bottom-4 h-24 w-24 rounded-full bg-accent/5 blur-2xl" />
      
      <div className="relative flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <h2 className="text-lg sm:text-xl font-bold text-foreground tracking-tight">
              {greeting}, {displayName}!
            </h2>
            <span className="text-xl">👋</span>
          </div>
          {items.length > 0 ? (
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              <span className="text-sm text-muted-foreground">You have</span>
              {items.map((item, i) => (
                <Button
                  key={item.label}
                  variant="ghost"
                  size="sm"
                  className={`h-auto gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all ${item.bg}`}
                  onClick={() => navigate(item.path)}
                >
                  <item.icon className={`h-3.5 w-3.5 ${item.color}`} />
                  <span className="font-semibold">{item.count}</span>
                  <span className="hidden sm:inline">{item.label}</span>
                  <span className="sm:hidden">{item.label.split(' ')[1] || item.label.split(' ')[0]}</span>
                </Button>
              ))}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-success" />
              <p className="text-sm text-muted-foreground">
                Everything looks great! No pending items.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
