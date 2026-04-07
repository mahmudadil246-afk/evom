import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input as InputField } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Search, MoreVertical, RotateCcw, Clock, CheckCircle2, XCircle, PackageCheck, Loader2, Eye, DollarSign, FileText, AlertTriangle,
} from "lucide-react";
import { format } from "date-fns";
import { useReturnRequests, type ReturnRequest } from "@/hooks/useReturnRequests";
import { useRefundProcessing } from "@/hooks/useRefundProcessing";
import { RefundProcessingModal, type RefundStatus } from "@/components/orders/RefundProcessingModal";
import { supabase } from "@/integrations/supabase/client";
import { generateRefundInvoicePDF } from "@/utils/generateRefundInvoicePDF";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { formatPrice } from "@/lib/formatPrice";

const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  pending: { label: "Pending", color: "bg-warning/10 text-warning border-warning/20", icon: Clock },
  approved: { label: "Approved", color: "bg-success/10 text-success border-success/20", icon: CheckCircle2 },
  rejected: { label: "Rejected", color: "bg-destructive/10 text-destructive border-destructive/20", icon: XCircle },
  completed: { label: "Completed", color: "bg-primary/10 text-primary border-primary/20", icon: PackageCheck },
};

export function ReturnRequestsTab() {
  const { requests, isLoading, updateStatus, isUpdating, counts } = useReturnRequests();
  const { processRefund, isProcessing: isRefundProcessing } = useRefundProcessing();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [detailOpen, setDetailOpen] = useState(false);
  const [selected, setSelected] = useState<ReturnRequest | null>(null);
  const [newStatus, setNewStatus] = useState("");
  const [adminNotes, setAdminNotes] = useState("");
  const [refundModalOpen, setRefundModalOpen] = useState(false);
  const [refundOrder, setRefundOrder] = useState<any>(null);
  const [refundStats, setRefundStats] = useState({ totalRefunded: 0, refundCount: 0 });
  const [returnWindowDays, setReturnWindowDays] = useState(7);
  const [savingWindow, setSavingWindow] = useState(false);

  // Fetch refund stats and return window setting
  useEffect(() => {
    async function fetchData() {
      const { data } = await supabase
        .from('orders' as any)
        .select('refund_amount, refund_status')
        .eq('refund_status', 'refunded');
      if (data) {
        const total = (data as any[]).reduce((sum, o) => sum + Number(o.refund_amount || 0), 0);
        setRefundStats({ totalRefunded: total, refundCount: (data as any[]).length });
      }

      const { data: setting } = await supabase
        .from('store_settings' as any)
        .select('value')
        .eq('key', 'RETURN_WINDOW_DAYS')
        .maybeSingle();
      if (setting) {
        setReturnWindowDays(Number((setting as any).value) || 7);
      }
    }
    fetchData();
  }, [requests]);

  const handleSaveReturnWindow = async () => {
    setSavingWindow(true);
    const { error } = await supabase
      .from('store_settings' as any)
      .upsert({ key: 'RETURN_WINDOW_DAYS', value: String(returnWindowDays), updated_at: new Date().toISOString() } as any, { onConflict: 'key' });
    if (error) {
      toast.error('Failed to update return window');
    } else {
      toast.success(`Return window updated to ${returnWindowDays} days`);
    }
    setSavingWindow(false);
  };

  const filtered = requests.filter(r => {
    const matchesSearch = !search || 
      r.reason.toLowerCase().includes(search.toLowerCase()) ||
      r.order_number?.toLowerCase().includes(search.toLowerCase()) ||
      r.customer_name?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const openDetail = (r: ReturnRequest) => {
    setSelected(r);
    setNewStatus(r.status);
    setAdminNotes(r.admin_notes || "");
    setDetailOpen(true);
  };

  const handleUpdate = () => {
    if (!selected) return;
    updateStatus({ id: selected.id, status: newStatus, admin_notes: adminNotes });
    setDetailOpen(false);
  };

  // Open refund modal for a return request
  const openRefundForRequest = async (r: ReturnRequest) => {
    if (!r.order_id) {
      toast.error("No order linked to this request");
      return;
    }
    const { data: order } = await supabase
      .from('orders' as any)
      .select('id, order_number, total_amount, refund_status, refund_amount, refund_reason, payment_method')
      .eq('id', r.order_id)
      .maybeSingle();

    if (!order) {
      toast.error("Order not found");
      return;
    }
    setRefundOrder({
      id: (order as any).id,
      order_number: (order as any).order_number,
      total: Number((order as any).total_amount),
      refund_status: (order as any).refund_status || 'none',
      refund_amount: Number((order as any).refund_amount || 0),
      refund_reason: r.reason,
      payment_method: (order as any).payment_method || 'N/A',
    });
    setRefundModalOpen(true);
  };

  // Handle refund processing + auto-approve return request
  const handleProcessRefund = (orderId: string, data: { refund_status: RefundStatus; refund_amount: number; refund_reason: string }) => {
    processRefund({ orderId, ...data });
    // If refund is completed, also mark the return request as completed
    if (data.refund_status === 'refunded' && selected) {
      updateStatus({ id: selected.id, status: 'completed', admin_notes: adminNotes || `Refund of ${formatPrice(data.refund_amount)} processed` });
    }
    setRefundModalOpen(false);
    setRefundOrder(null);
  };

  // Generate refund invoice/credit note
  const generateRefundInvoice = async (r: ReturnRequest) => {
    if (!r.order_id) {
      toast.error("No order linked");
      return;
    }
    const { data: order } = await supabase
      .from('orders' as any)
      .select('id, order_number, total_amount, refund_amount, refund_reason, refund_status, payment_method, customer_id, shipping_address, created_at')
      .eq('id', r.order_id)
      .maybeSingle();

    if (!order) { toast.error("Order not found"); return; }

    const { data: items } = await supabase
      .from('order_items' as any)
      .select('product_name, quantity, unit_price, total_price')
      .eq('order_id', r.order_id);

    generateRefundInvoicePDF({
      order_number: (order as any).order_number,
      refund_date: new Date().toISOString(),
      customer_name: r.customer_name || "Customer",
      customer_email: r.customer_email || "",
      customer_phone: "",
      shipping_address: typeof (order as any).shipping_address === 'object'
        ? [(order as any).shipping_address?.street, (order as any).shipping_address?.area, (order as any).shipping_address?.city].filter(Boolean).join(', ')
        : String((order as any).shipping_address || 'N/A'),
      items: (items as any[]) || [],
      original_total: Number((order as any).total_amount),
      refund_amount: Number((order as any).refund_amount || 0),
      refund_reason: r.reason || (order as any).refund_reason || '',
      refund_status: (order as any).refund_status || 'none',
      payment_method: (order as any).payment_method || 'N/A',
    });
    toast.success("Refund credit note downloaded");
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-20" />)}
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid gap-3 sm:gap-4 grid-cols-2 sm:grid-cols-3">
        {[
          { label: "Pending", value: counts.pending, icon: Clock, iconBg: "bg-warning/10 text-warning", border: "border-l-warning", cardBg: "bg-warning/5 dark:bg-warning/10" },
          { label: "Completed", value: counts.completed, icon: CheckCircle2, iconBg: "bg-success/10 text-success", border: "border-l-success", cardBg: "bg-success/5 dark:bg-success/10" },
          { label: "Total Refunded", value: `${formatPrice(refundStats.totalRefunded)}`, icon: DollarSign, iconBg: "bg-accent/10 text-accent-foreground", border: "border-l-accent", cardBg: "bg-accent/5 dark:bg-accent/10" },
        ].map((stat) => (
          <div
            key={stat.label}
            className={cn(
              "rounded-xl border border-border/50 p-4 border-l-[3px] transition-all duration-300 hover:shadow-md hover:border-border hover:-translate-y-0.5",
              stat.border, stat.cardBg
            )}
          >
            <div className="flex items-center gap-3">
              <div className={cn("flex h-9 w-9 items-center justify-center rounded-lg shrink-0", stat.iconBg)}>
                <stat.icon className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xl font-bold tracking-tight text-foreground">{stat.value}</p>
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">{stat.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Return Window Setting */}
      <Card>
        <CardContent className="flex items-center gap-4 p-4">
          <div className="flex-1">
            <p className="text-sm font-medium">Return Window</p>
            <p className="text-xs text-muted-foreground">Customers can submit return requests within this many days after delivery</p>
          </div>
          <div className="flex items-center gap-2">
            <InputField
              type="number"
              min={1}
              max={365}
              value={returnWindowDays}
              onChange={(e) => setReturnWindowDays(Number(e.target.value))}
              className="w-20 h-8 text-center"
            />
            <span className="text-sm text-muted-foreground">days</span>
            <Button size="sm" variant="outline" onClick={handleSaveReturnWindow} disabled={savingWindow}>
              {savingWindow ? <Loader2 className="h-3 w-3 animate-spin" /> : "Save"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Pending alert */}
      {counts.pending > 0 && (
        <div className="flex items-center gap-3 rounded-lg border border-warning/30 bg-warning/10 p-3">
          <AlertTriangle className="h-5 w-5 text-warning" />
          <span className="text-sm font-medium">{counts.pending} return/refund request(s) need your attention!</span>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by order, customer, reason..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <RotateCcw className="h-12 w-12 mx-auto mb-3 opacity-40" />
            <p>No return/refund requests found</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((r) => {
                  const sc = statusConfig[r.status] || statusConfig.pending;
                  return (
                    <TableRow key={r.id} className="cursor-pointer hover:bg-muted/50" onClick={() => openDetail(r)}>
                      <TableCell className="font-medium text-sm">
                        {r.order_number ? `#${r.order_number}` : "—"}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="text-sm font-medium">{r.customer_name || "Unknown"}</p>
                          <p className="text-xs text-muted-foreground">{r.customer_email}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm max-w-[200px] truncate">{r.reason}</p>
                        {r.description && (
                          <p className="text-xs text-muted-foreground max-w-[200px] truncate">{r.description}</p>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={cn("text-xs", sc.color)}>
                          <sc.icon className="h-3 w-3 mr-1" />
                          {sc.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {format(new Date(r.created_at), "MMM dd, yyyy HH:mm")}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); openDetail(r); }}>
                              <Eye className="h-4 w-4 mr-2" /> View Details
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {r.status === "pending" && (
                              <>
                                <DropdownMenuItem onClick={(e) => {
                                  e.stopPropagation();
                                  updateStatus({ id: r.id, status: "approved" });
                                }}>
                                  <CheckCircle2 className="h-4 w-4 mr-2" /> Approve
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={(e) => {
                                  e.stopPropagation();
                                  updateStatus({ id: r.id, status: "rejected" });
                                }}>
                                  <XCircle className="h-4 w-4 mr-2" /> Reject
                                </DropdownMenuItem>
                              </>
                            )}
                            {(r.status === "approved" || r.status === "pending") && (
                              <DropdownMenuItem onClick={(e) => {
                                e.stopPropagation();
                                setSelected(r);
                                openRefundForRequest(r);
                              }}>
                                <DollarSign className="h-4 w-4 mr-2" /> Process Refund
                              </DropdownMenuItem>
                            )}
                            {r.status === "approved" && (
                              <DropdownMenuItem onClick={(e) => {
                                e.stopPropagation();
                                updateStatus({ id: r.id, status: "completed" });
                              }}>
                                <PackageCheck className="h-4 w-4 mr-2" /> Mark Completed
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={(e) => {
                              e.stopPropagation();
                              generateRefundInvoice(r);
                            }}>
                              <FileText className="h-4 w-4 mr-2" /> Download Credit Note
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}

      {/* Detail Modal */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-lg bg-card">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <RotateCcw className="h-5 w-5 text-primary" />
              Return/Refund Request
            </DialogTitle>
            <DialogDescription>
              {selected?.order_number ? `Order #${selected.order_number}` : "Request Details"}
            </DialogDescription>
          </DialogHeader>

          {selected && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-muted-foreground">Customer</p>
                  <p className="font-medium">{selected.customer_name || "Unknown"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Email</p>
                  <p className="font-medium">{selected.customer_email || "—"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Submitted</p>
                  <p className="font-medium">{format(new Date(selected.created_at), "MMM dd, yyyy HH:mm")}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Current Status</p>
                  <Badge variant="outline" className={cn("text-xs", (statusConfig[selected.status] || statusConfig.pending).color)}>
                    {(statusConfig[selected.status] || statusConfig.pending).label}
                  </Badge>
                </div>
              </div>

              <div className="p-3 bg-muted/50 rounded-lg space-y-1">
                <p className="text-sm font-medium">Reason: {selected.reason}</p>
                {selected.description && (
                  <p className="text-sm text-muted-foreground">{selected.description}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Update Status</Label>
                <Select value={newStatus} onValueChange={setNewStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Admin Notes</Label>
                <Textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Add notes for the customer..."
                  rows={3}
                />
              </div>

              {/* Quick action buttons */}
              <div className="flex gap-2 flex-wrap">
                <Button variant="outline" size="sm" onClick={() => openRefundForRequest(selected)}>
                  <DollarSign className="h-4 w-4 mr-1.5" /> Process Refund
                </Button>
                <Button variant="outline" size="sm" onClick={() => generateRefundInvoice(selected)}>
                  <FileText className="h-4 w-4 mr-1.5" /> Credit Note
                </Button>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailOpen(false)}>Cancel</Button>
            <Button onClick={handleUpdate} disabled={isUpdating}>
              {isUpdating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
              Update Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Refund Processing Modal */}
      <RefundProcessingModal
        open={refundModalOpen}
        onOpenChange={setRefundModalOpen}
        order={refundOrder}
        onProcess={handleProcessRefund}
        isProcessing={isRefundProcessing}
      />
    </div>
  );
}
