import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { 
  Package, 
  Truck, 
  CheckCircle, 
  Clock, 
  XCircle,
  MapPin,
  ChevronLeft,
  RefreshCw,
  Box,
  Calendar,
  AlertCircle,
  CreditCard,
  Banknote
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";

import { SEOHead } from "@/components/SEOHead";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";
import { formatPrice } from "@/lib/formatPrice";

interface OrderItem {
  id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

interface PaymentMethodInfo {
  id: string;
  code: string;
  name: string;
  name_bn?: string | null;
  logo_url: string | null;
  description?: string | null;
}

interface Order {
  id: string;
  order_number: string;
  created_at: string;
  updated_at: string;
  status: string;
  payment_status: string;
  payment_method: string;
  subtotal: number;
  shipping_cost: number;
  discount: number;
  total: number;
  shipping_address: any;
  notes: string | null;
}

// Helper to get address as string
const getAddressString = (addr: any): string => {
  if (!addr) return 'N/A';
  if (typeof addr === 'string') return addr;
  if (typeof addr === 'object') {
    const parts = [addr.street, addr.area, addr.city].filter(Boolean);
    return parts.length > 0 ? parts.join(', ') : 'N/A';
  }
  return 'N/A';
};

// Shipping zones configuration for delivery estimation
const shippingZones = [
  {
    name: "Dhaka City",
    keywords: ["dhaka", "ঢাকা", "mirpur", "মিরপুর", "gulshan", "গুলশান", "dhanmondi", "ধানমন্ডি", "uttara", "উত্তরা", "banani", "বনানী", "motijheel", "মতিঝিল"],
    minDays: 1,
    maxDays: 2,
  },
  {
    name: "Chittagong City",
    keywords: ["chittagong", "চট্টগ্রাম", "chattogram", "ctg"],
    minDays: 2,
    maxDays: 3,
  },
  {
    name: "Major Cities",
    keywords: ["sylhet", "সিলেট", "khulna", "খুলনা", "rajshahi", "রাজশাহী", "rangpur", "রংপুর", "barisal", "বরিশাল", "comilla", "কুমিল্লা", "gazipur", "গাজীপুর", "narayanganj", "নারায়ণগঞ্জ"],
    minDays: 2,
    maxDays: 4,
  },
  {
    name: "Rest of Bangladesh",
    keywords: [],
    minDays: 3,
    maxDays: 5,
  },
];

const getDeliveryEstimate = (shippingAddress: any, orderDate: string, status: string) => {
  const addressStr = getAddressString(shippingAddress).toLowerCase();
  
  // Find matching zone
  let matchedZone = shippingZones[shippingZones.length - 1]; // Default to "Rest of Bangladesh"
  for (const zone of shippingZones) {
    if (zone.keywords.some(keyword => addressStr.includes(keyword.toLowerCase()))) {
      matchedZone = zone;
      break;
    }
  }

  const orderDateObj = new Date(orderDate);
  const today = new Date();
  
  // Calculate estimated delivery dates
  const minDeliveryDate = new Date(orderDateObj);
  minDeliveryDate.setDate(minDeliveryDate.getDate() + matchedZone.minDays);
  
  const maxDeliveryDate = new Date(orderDateObj);
  maxDeliveryDate.setDate(maxDeliveryDate.getDate() + matchedZone.maxDays);

  // Calculate days remaining
  const daysUntilMin = Math.max(0, Math.ceil((minDeliveryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)));
  const daysUntilMax = Math.max(0, Math.ceil((maxDeliveryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)));

  // Calculate progress percentage
  const totalDays = matchedZone.maxDays;
  const daysPassed = Math.ceil((today.getTime() - orderDateObj.getTime()) / (1000 * 60 * 60 * 24));
  const progressPercent = status === "delivered" ? 100 : Math.min(100, Math.max(0, (daysPassed / totalDays) * 100));

  return {
    zone: matchedZone.name,
    minDate: minDeliveryDate,
    maxDate: maxDeliveryDate,
    daysUntilMin,
    daysUntilMax,
    progressPercent,
    isOverdue: today > maxDeliveryDate && status !== "delivered",
  };
};

const getStatusSteps = (t: (key: string) => string) => [
  { key: "pending", label: t('orderTracking.orderPlaced'), icon: Clock, description: t('orderTracking.orderReceived') },
  { key: "processing", label: t('orderTracking.processing'), icon: Box, description: t('orderTracking.preparingOrder') },
  { key: "shipped", label: t('orderTracking.shipped'), icon: Truck, description: t('orderTracking.onTheWay') },
  { key: "delivered", label: t('orderTracking.delivered'), icon: CheckCircle, description: t('orderTracking.deliveredSuccess') },
];

const statusIndex: Record<string, number> = {
  pending: 0,
  processing: 1,
  shipped: 2,
  delivered: 3,
  cancelled: -1,
};

export default function OrderTracking() {
  const { orderNumber } = useParams<{ orderNumber: string }>();
  const { t } = useLanguage();
  const [order, setOrder] = useState<Order | null>(null);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [paymentMethodInfo, setPaymentMethodInfo] = useState<PaymentMethodInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const statusSteps = getStatusSteps(t);

  useEffect(() => {
    if (orderNumber) {
      fetchOrder();
      // Set up realtime subscription
      const channel = supabase
        .channel(`order-${orderNumber}`)
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "orders",
            filter: `order_number=eq.${orderNumber}`,
          },
          (payload) => {
            console.log("Order updated:", payload);
            setOrder((prev) => prev ? { ...prev, ...payload.new } as Order : null);
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [orderNumber]);

  const fetchOrder = async () => {
    setLoading(true);
    setError(null);

    const { data: orderData, error: orderError } = await supabase
      .from("orders")
      .select("*")
      .eq("order_number", orderNumber)
      .maybeSingle();

    if (orderError) {
      setError(t('orderTracking.couldntFind'));
      setLoading(false);
      return;
    }

    if (!orderData) {
      setError(t('orderTracking.couldntFind'));
      setLoading(false);
      return;
    }

    setOrder({
      id: orderData.id,
      order_number: orderData.order_number,
      created_at: orderData.created_at,
      updated_at: orderData.updated_at,
      status: orderData.status,
      payment_status: orderData.payment_status,
      payment_method: orderData.payment_method || '',
      subtotal: Number(orderData.subtotal),
      shipping_cost: Number(orderData.shipping_cost || 0),
      discount: Number((orderData as any).discount || (orderData as any).discount_amount || 0),
      total: Number((orderData as any).total || (orderData as any).total_amount || 0),
      shipping_address: orderData.shipping_address,
      notes: orderData.notes,
    });

    // Fetch order items
    const { data: itemsData } = await supabase
      .from("order_items")
      .select("*")
      .eq("order_id", orderData.id);

    setItems((itemsData || []).map(i => ({
      id: i.id,
      product_name: i.product_name,
      quantity: i.quantity,
      unit_price: Number(i.unit_price),
      total_price: Number(i.total_price),
    })));

    // Fetch payment method info if available
    if (orderData.payment_method) {
      const { data: paymentMethod } = await supabase
        .from("enabled_payment_methods")
        .select("id, code, name, name_bn, logo_url, description")
        .eq("code", orderData.payment_method)
        .maybeSingle();

      if (paymentMethod) {
        setPaymentMethodInfo(paymentMethod as unknown as PaymentMethodInfo);
      }
    }

    setLoading(false);
  };

  const currentStep = order ? statusIndex[order.status] : -1;
  const isCancelled = order?.status === "cancelled";

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };


  if (loading) {
    return (
      <>
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-3xl mx-auto space-y-6">
            <div className="h-8 bg-muted rounded w-1/3 animate-pulse" />
            <div className="h-64 bg-muted rounded animate-pulse" />
            <div className="h-48 bg-muted rounded animate-pulse" />
          </div>
        </div>
      </>
    );
  }

  if (error || !order) {
    return (
      <>
        <div className="container mx-auto px-4 py-16 text-center">
          <Package className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h1 className="font-display text-2xl font-bold mb-2">{t('orderTracking.orderNotFound')}</h1>
          <p className="text-muted-foreground mb-6">{error || t('orderTracking.couldntFind')}</p>
          <Button asChild>
            <Link to="/">{t('orderTracking.backToStore')}</Link>
          </Button>
        </div>
      </>
    );
  }

  const shippingAddr = getAddressString(order.shipping_address);

  return (
    <>
      <SEOHead title={`Track Order ${order.order_number}`} description="Track your order status and delivery progress." noIndex={true} />
      {/* Header */}
      <section className="relative bg-gradient-to-r from-store-primary to-store-secondary py-8 overflow-hidden">
        <div className="absolute -top-20 -right-20 w-72 h-72 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-store-accent/10 rounded-full blur-3xl" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              className="text-store-primary-foreground"
              asChild
            >
              <Link to="/myaccount">
                <ChevronLeft className="h-5 w-5" />
              </Link>
            </Button>
            <div>
              <h1 className="font-display text-2xl font-bold text-store-primary-foreground">
                {t('orderTracking.orderStatus')}
              </h1>
              <p className="text-store-primary-foreground/80 text-sm">
                {order.order_number}
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Status Timeline */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5 text-store-primary" />
                {t('orderTracking.orderStatus')}
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={fetchOrder}>
                <RefreshCw className="h-4 w-4 mr-2" />
                {t('orderTracking.refresh')}
              </Button>
            </CardHeader>
            <CardContent>
              {isCancelled ? (
                <div className="text-center py-8">
                  <XCircle className="h-16 w-16 mx-auto text-destructive mb-4" />
                  <h3 className="text-xl font-semibold text-destructive mb-2">{t('orderTracking.cancelled')}</h3>
                  <p className="text-muted-foreground">
                    {t('orderTracking.cancelledMsg')}
                  </p>
                </div>
              ) : (
                <div className="relative">
                  {/* Progress Line */}
                  <div className="absolute left-6 top-8 bottom-8 w-0.5 bg-muted" />
                  <div 
                    className="absolute left-6 top-8 w-0.5 bg-store-primary transition-all duration-500"
                    style={{ 
                      height: `calc(${Math.min(currentStep / (statusSteps.length - 1), 1) * 100}% - 32px)` 
                    }}
                  />

                  {/* Steps */}
                  <div className="space-y-8">
                    {statusSteps.map((step, index) => {
                      const isCompleted = currentStep >= index;
                      const isCurrent = currentStep === index;
                      const StepIcon = step.icon;

                      return (
                        <div key={step.key} className="flex gap-4 relative">
                          <div
                            className={cn(
                              "w-12 h-12 rounded-full flex items-center justify-center transition-all z-10",
                              isCompleted
                                ? "bg-store-primary text-store-primary-foreground"
                                : "bg-muted text-muted-foreground",
                              isCurrent && "ring-4 ring-store-primary/30"
                            )}
                          >
                            <StepIcon className="h-5 w-5" />
                          </div>
                          <div className="flex-1 pt-2">
                            <h4
                              className={cn(
                                "font-medium",
                                isCompleted ? "text-foreground" : "text-muted-foreground"
                              )}
                            >
                              {step.label}
                            </h4>
                            <p className="text-sm text-muted-foreground">{step.description}</p>
                            {isCurrent && order.updated_at && (
                              <p className="text-xs text-store-primary mt-1">
                                {t('orderTracking.lastUpdated')}: {formatDate(order.updated_at)}
                              </p>
                            )}
                          </div>
                          {isCompleted && !isCurrent && (
                            <CheckCircle className="h-5 w-5 text-store-primary mt-3" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Delivery Estimate */}
          {!isCancelled && order.status !== "delivered" && (
            (() => {
              const estimate = getDeliveryEstimate(order.shipping_address, order.created_at, order.status);
              const formatDeliveryDate = (date: Date) =>
                date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });

              return (
                <Card className={cn(
                  "border-2",
                  estimate.isOverdue ? "border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20" : "border-store-primary/20"
                )}>
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Calendar className="h-5 w-5 text-store-primary" />
                      {t('orderTracking.estimatedDelivery')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div>
                        <p className="text-2xl font-bold text-foreground">
                          {formatDeliveryDate(estimate.minDate)} - {formatDeliveryDate(estimate.maxDate)}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {t('orderTracking.shippingTo')}: <span className="font-medium">{estimate.zone}</span>
                        </p>
                      </div>
                      <div className="text-right">
                        {estimate.isOverdue ? (
                          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            {t('orderTracking.delayed')}
                          </Badge>
                        ) : estimate.daysUntilMax === 0 ? (
                          <Badge className="bg-store-primary text-store-primary-foreground">
                            {t('orderTracking.arrivingToday')}
                          </Badge>
                        ) : estimate.daysUntilMin === 0 ? (
                          <Badge className="bg-store-accent text-store-accent-foreground">
                            {t('orderTracking.arrivingSoon')}
                          </Badge>
                        ) : (
                          <p className="text-sm text-muted-foreground">
                            {estimate.daysUntilMin === estimate.daysUntilMax
                              ? `${estimate.daysUntilMax} ${estimate.daysUntilMax !== 1 ? t('orderTracking.daysRemaining') : t('orderTracking.dayRemaining')}`
                              : `${estimate.daysUntilMin}-${estimate.daysUntilMax} ${t('orderTracking.daysRemaining')}`}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Delivery Progress */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{t('orderTracking.orderPlaced')}</span>
                        <span>{t('orderTracking.estimatedDelivery')}</span>
                      </div>
                      <Progress value={estimate.progressPercent} className="h-2" />
                    </div>

                    {estimate.isOverdue && (
                      <div className="flex items-start gap-2 p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                        <AlertCircle className="h-4 w-4 text-yellow-600 flex-shrink-0 mt-0.5" />
                         <p className="text-sm text-yellow-800 dark:text-yellow-200">
                           {t('orderTracking.deliveryOverdue')}
                         </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })()
          )}

          {/* Delivered Message */}
          {order.status === "delivered" && (
            <Card className="border-2 border-green-500 bg-green-50 dark:bg-green-950/20">
              <CardContent className="py-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-green-800 dark:text-green-200">{t('orderTracking.deliveredSuccessMsg')}</h4>
                    <p className="text-sm text-green-600 dark:text-green-400">
                      {t('orderTracking.deliveredOn')} {formatDate(order.updated_at)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Order Details */}
          <Card>
            <CardHeader>
              <CardTitle>{t('orderTracking.orderDetails')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">{t('orderTracking.orderDetails').split(' ')[0]} {t('track.orderNumber')}</p>
                  <p className="font-medium">{order.order_number}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t('orderTracking.orderDate')}</p>
                  <p className="font-medium">{formatDate(order.created_at)}</p>
                </div>
              </div>

              <Separator />

              {/* Payment Information */}
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">{t('orderTracking.paymentInfo')}</p>
                <div className="flex items-start gap-4 p-4 bg-muted/50 rounded-lg">
                  {paymentMethodInfo?.logo_url ? (
                    <img 
                      src={paymentMethodInfo.logo_url} 
                      alt={paymentMethodInfo.name}
                      className="h-12 w-12 object-contain rounded-lg border border-border p-1 bg-background"
                    />
                  ) : (
                    <div className="h-12 w-12 rounded-lg bg-background border border-border flex items-center justify-center">
                      {order.payment_method === 'cod' ? (
                        <Banknote className="h-6 w-6 text-muted-foreground" />
                      ) : (
                        <CreditCard className="h-6 w-6 text-muted-foreground" />
                      )}
                    </div>
                  )}
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">
                          {paymentMethodInfo?.name || order.payment_method || 'N/A'}
                          {paymentMethodInfo?.name_bn && (
                            <span className="text-muted-foreground ml-1">({paymentMethodInfo.name_bn})</span>
                          )}
                        </p>
                      </div>
                      <Badge 
                        variant="outline" 
                        className={cn(
                          "capitalize",
                          order.payment_status === 'paid' && "bg-success/10 text-success border-success/20",
                          order.payment_status === 'pending' && "bg-warning/10 text-warning border-warning/20",
                          order.payment_status === 'failed' && "bg-destructive/10 text-destructive border-destructive/20"
                        )}
                      >
                        {order.payment_status === 'paid' && <CheckCircle className="h-3 w-3 mr-1" />}
                        {order.payment_status === 'pending' && <Clock className="h-3 w-3 mr-1" />}
                        {order.payment_status}
                      </Badge>
                    </div>
                    
                    {/* Extract Transaction ID from notes if present */}
                    {order.notes && order.notes.includes('TrxID:') && (
                      <p className="text-sm text-muted-foreground mt-2">
                        {t('orderTracking.transactionId')}: <span className="font-mono font-medium text-foreground">
                          {order.notes.match(/TrxID:\s*(\S+)/)?.[1] || 'N/A'}
                        </span>
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <p className="text-sm text-muted-foreground mb-2">{t('orderTracking.shippingAddress')}</p>
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <p className="font-medium">{shippingAddr}</p>
                </div>
              </div>

              <Separator />

              {/* Items */}
              <div>
                <p className="text-sm text-muted-foreground mb-3">{t('orderTracking.items')}</p>
                <div className="space-y-2">
                  {items.map((item) => (
                    <div key={item.id} className="flex justify-between items-center py-2 border-b last:border-0">
                      <div>
                        <p className="font-medium">{item.product_name}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatPrice(item.unit_price)} × {item.quantity}
                        </p>
                      </div>
                      <p className="font-medium">{formatPrice(item.total_price)}</p>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Totals */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{t('orderTracking.subtotal')}</span>
                  <span>{formatPrice(order.subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{t('orderTracking.shipping')}</span>
                  <span>{formatPrice(order.shipping_cost)}</span>
                </div>
                {order.discount > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>{t('orderTracking.discount')}</span>
                    <span>-{formatPrice(order.discount)}</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between font-semibold text-lg">
                  <span>{t('store.total')}</span>
                  <span>{formatPrice(order.total)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
