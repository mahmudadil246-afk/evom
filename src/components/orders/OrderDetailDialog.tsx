import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  ShoppingBag,
  Clock,
  Package,
  Truck,
  CheckCircle2,
  XCircle,
  Download,
  MapPin,
  Phone,
  Mail,
  CreditCard,
  Printer,
  Copy,
  RotateCcw,
  Tag,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { type Order, type OrderStatus } from "@/hooks/useOrdersData";
import { refundStatusConfig, type RefundStatus } from "@/components/orders/RefundProcessingModal";
import { OrderTimeline } from "@/components/orders/OrderTimeline";
import { OrderNotesSection } from "@/components/orders/OrderNotesSection";
import { OrderTagsEditor } from "@/components/orders/OrderTagsEditor";
import { format } from "date-fns";
import { formatPrice } from "@/lib/formatPrice";

const statusConfig: Record<OrderStatus, { label: string; color: string; icon: React.ElementType }> = {
  pending: { label: "Pending", color: "bg-warning/10 text-warning border-warning/20", icon: Clock },
  processing: { label: "Processing", color: "bg-accent/10 text-accent border-accent/20", icon: Package },
  shipped: { label: "Shipped", color: "bg-chart-5/10 text-chart-5 border-chart-5/20", icon: Truck },
  delivered: { label: "Delivered", color: "bg-success/10 text-success border-success/20", icon: CheckCircle2 },
  cancelled: { label: "Cancelled", color: "bg-destructive/10 text-destructive border-destructive/20", icon: XCircle },
};

const paymentStatusConfig: Record<string, { label: string; color: string }> = {
  pending: { label: "Pending", color: "bg-warning/10 text-warning border-warning/20" },
  paid: { label: "Paid", color: "bg-success/10 text-success border-success/20" },
  failed: { label: "Failed", color: "bg-destructive/10 text-destructive border-destructive/20" },
  refunded: { label: "Refunded", color: "bg-muted text-muted-foreground" },
};

const getShippingAddressString = (address: any): string => {
  if (!address) return 'N/A';
  if (typeof address === 'string') return address;
  if (typeof address === 'object') {
    const parts = [address.street, address.area, address.city].filter(Boolean);
    return parts.length > 0 ? parts.join(', ') : 'N/A';
  }
  return 'N/A';
};

interface OrderDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: Order | null;
  onGenerateInvoice: (order: Order) => void;
  onPrintPackingSlip: (order: Order) => void;
  onDuplicateOrder: (order: Order) => void;
  onUpdatePaymentStatus: (orderId: string, paymentStatus: string) => void;
  onTagsChange: (orderId: string, tags: string[]) => void;
}

export function OrderDetailDialog({
  open,
  onOpenChange,
  order,
  onGenerateInvoice,
  onPrintPackingSlip,
  onDuplicateOrder,
  onUpdatePaymentStatus,
  onTagsChange,
}: OrderDetailDialogProps) {
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM dd, yyyy HH:mm');
    } catch {
      return dateString;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-card max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5 text-accent" />
            Order {order?.order_number}
          </DialogTitle>
          <DialogDescription>
            Order placed on {order && formatDate(order.created_at)}
          </DialogDescription>
        </DialogHeader>

        {order && (
          <div className="space-y-6">
            {/* Status */}
            <div className="flex items-center justify-between">
              <Badge variant="outline" className={cn("gap-1", statusConfig[order.status]?.color || statusConfig.pending.color)}>
                {React.createElement(statusConfig[order.status]?.icon || Clock, { className: "h-3 w-3" })}
                {statusConfig[order.status]?.label || order.status}
              </Badge>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" onClick={() => onGenerateInvoice(order)}>
                  <Download className="mr-2 h-4 w-4" />
                  Invoice
                </Button>
                <Button size="sm" variant="outline" onClick={() => onPrintPackingSlip(order)}>
                  <Printer className="mr-2 h-4 w-4" />
                  Packing Slip
                </Button>
                <Button size="sm" variant="outline" onClick={() => onDuplicateOrder(order)}>
                  <Copy className="mr-2 h-4 w-4" />
                  Duplicate
                </Button>
              </div>
            </div>

            <Separator />

            {/* Customer Info */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <h4 className="font-semibold text-sm">Customer Details</h4>
                <div className="space-y-1 text-sm">
                  <p className="font-medium">{order.customer_name}</p>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="h-3 w-3" />
                    {order.customer_email}
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="h-3 w-3" />
                    {order.customer_phone || '-'}
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold text-sm">Shipping Address</h4>
                <div className="flex items-start gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-3 w-3 mt-1" />
                  <span>{getShippingAddressString(order.shipping_address)}</span>
                </div>
              </div>
            </div>

            <Separator />

            {/* Order Items */}
            <div>
              <h4 className="font-semibold text-sm mb-3">Items</h4>
              <div className="space-y-2">
                {order.items.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div>
                      <p className="font-medium">{item.product_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatPrice(item.unit_price)} × {item.quantity}
                      </p>
                    </div>
                    <p className="font-medium">{formatPrice(item.total_price)}</p>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* Order Summary */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatPrice(order.subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Shipping</span>
                <span>{formatPrice(order.shipping_cost)}</span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-sm text-success">
                  <span>Discount</span>
                  <span>-{formatPrice(order.discount)}</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between font-semibold">
                <span>Total</span>
                <span>{formatPrice(order.total)}</span>
              </div>
            </div>

            {/* Payment Info */}
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-4">
                <CreditCard className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">{order.payment_method}</p>
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-xs mt-1",
                      paymentStatusConfig[order.payment_status]?.color
                    )}
                  >
                    {paymentStatusConfig[order.payment_status]?.label || order.payment_status}
                  </Badge>
                </div>
              </div>
              <Select
                value={order.payment_status}
                onValueChange={(value) => onUpdatePaymentStatus(order.id, value)}
              >
                <SelectTrigger className="w-32 h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover">
                  {Object.entries(paymentStatusConfig).map(([key, config]) => (
                    <SelectItem key={key} value={key}>{config.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {order.notes && (
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-sm font-medium mb-1">Order Notes</p>
                <p className="text-sm text-muted-foreground">{order.notes}</p>
              </div>
            )}

            {/* Refund Info */}
            {order.refund_status !== 'none' && (
              <div className="p-3 bg-muted/50 rounded-lg border border-warning/20">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium flex items-center gap-2">
                    <RotateCcw className="h-4 w-4" />
                    Refund Information
                  </p>
                  <Badge variant="outline" className={refundStatusConfig[order.refund_status as RefundStatus]?.color}>
                    {refundStatusConfig[order.refund_status as RefundStatus]?.label || order.refund_status}
                  </Badge>
                </div>
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>Amount: {formatPrice(order.refund_amount)}</p>
                  {order.refund_reason && <p>Reason: {order.refund_reason}</p>}
                </div>
              </div>
            )}

            {/* Tags */}
            <div>
              <h4 className="font-semibold text-sm flex items-center gap-2 mb-2">
                <Tag className="h-4 w-4 text-muted-foreground" />
                Tags
              </h4>
              <OrderTagsEditor
                tags={order.tags || []}
                onTagsChange={(tags) => onTagsChange(order.id, tags)}
              />
            </div>

            <Separator />

            {/* Activity Timeline */}
            <OrderTimeline orderId={order.id} orderCreatedAt={order.created_at} />

            <Separator />

            {/* Internal Notes */}
            <OrderNotesSection orderId={order.id} />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
