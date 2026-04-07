import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { RotateCcw, Clock, CheckCircle2, XCircle } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { formatPrice } from "@/lib/formatPrice";

interface RecentReturn {
  id: string;
  reason: string;
  status: string;
  created_at: string;
  order_number: string;
  customer_name: string;
}

const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  pending: { label: "Pending", color: "bg-warning/10 text-warning border-warning/20", icon: Clock },
  approved: { label: "Approved", color: "bg-success/10 text-success border-success/20", icon: CheckCircle2 },
  rejected: { label: "Rejected", color: "bg-destructive/10 text-destructive border-destructive/20", icon: XCircle },
  completed: { label: "Completed", color: "bg-primary/10 text-primary border-primary/20", icon: RotateCcw },
};

export function RecentReturnRequests({ loading: externalLoading }: { loading?: boolean }) {
  const [returns, setReturns] = useState<RecentReturn[]>([]);
  const [stats, setStats] = useState({ pending: 0, completed: 0, totalRefunded: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetch() {
      setLoading(true);
      const { data: rr } = await supabase
        .from('return_requests')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

      const enriched: RecentReturn[] = [];
      for (const r of (rr || [])) {
        let order_number = '';
        let customer_name = '';
        if (r.order_id) {
          const { data: order } = await supabase
            .from('orders')
            .select('order_number, customer_id')
            .eq('id', r.order_id)
            .maybeSingle();
          if (order) {
            order_number = (order as any).order_number || '';
            if ((order as any).customer_id) {
              const { data: c } = await supabase
                .from('customers')
                .select('full_name')
                .eq('id', (order as any).customer_id)
                .maybeSingle();
              customer_name = (c as any)?.full_name || '';
            }
          }
        }
        enriched.push({ id: r.id, reason: r.reason, status: r.status, created_at: r.created_at, order_number, customer_name });
      }
      setReturns(enriched);

      const { count: pendingCount } = await supabase
        .from('return_requests')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      const { count: completedCount } = await supabase
        .from('return_requests')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'completed');

      const { data: refunded } = await supabase
        .from('orders' as any)
        .select('refund_amount')
        .eq('refund_status', 'refunded');

      const totalRefunded = ((refunded as any[]) || []).reduce((sum, o) => sum + Number(o.refund_amount || 0), 0);

      setStats({ pending: pendingCount || 0, completed: completedCount || 0, totalRefunded });
      setLoading(false);
    }
    fetch();
  }, []);

  if (loading || externalLoading) {
    return (
      <div className="space-y-3">
        <div className="grid grid-cols-3 gap-2">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-lg" />)}
        </div>
        {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-14 rounded-lg" />)}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Mini stats */}
      <div className="grid grid-cols-3 gap-2">
        <div className="flex flex-col items-center justify-center p-2.5 rounded-lg bg-warning/8 border border-warning/15 text-center transition-all hover:shadow-sm">
          <p className="text-lg font-bold text-warning">{stats.pending}</p>
          <p className="text-[10px] text-muted-foreground font-medium leading-tight">Pending</p>
        </div>
        <div className="flex flex-col items-center justify-center p-2.5 rounded-lg bg-success/8 border border-success/15 text-center transition-all hover:shadow-sm">
          <p className="text-lg font-bold text-success">{stats.completed}</p>
          <p className="text-[10px] text-muted-foreground font-medium leading-tight">Completed</p>
        </div>
        <div className="flex flex-col items-center justify-center p-2.5 rounded-lg bg-primary/8 border border-primary/15 text-center transition-all hover:shadow-sm">
          <p className="text-sm font-bold text-primary truncate w-full">{formatPrice(stats.totalRefunded)}</p>
          <p className="text-[10px] text-muted-foreground font-medium leading-tight">Refunded</p>
        </div>
      </div>

      {returns.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-4 text-muted-foreground">
          <RotateCcw className="h-8 w-8 mb-2 opacity-40" />
          <p className="text-sm">No return requests yet</p>
        </div>
      ) : (
        <div className="space-y-1.5">
          {returns.map((r) => {
            const sc = statusConfig[r.status] || statusConfig.pending;
            return (
              <div key={r.id} className="flex flex-col gap-2 p-2.5 rounded-lg border border-transparent hover:border-border/50 hover:bg-muted/30 transition-all duration-200">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{r.customer_name || "Unknown"}</p>
                    {r.order_number && (
                      <p className="text-[11px] text-muted-foreground truncate">#{r.order_number}</p>
                    )}
                  </div>
                  <Badge variant="outline" className={cn("text-[10px] shrink-0 px-1.5 py-0.5", sc.color)}>
                    <sc.icon className="h-3 w-3 mr-0.5" />
                    {sc.label}
                  </Badge>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground truncate">{r.reason}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{format(new Date(r.created_at), "MMM dd, HH:mm")}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
