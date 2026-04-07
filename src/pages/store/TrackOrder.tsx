
import { useState, useEffect } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { Search, Package, ArrowRight, Phone, Hash, Loader2, Copy, Check, CheckCircle2, Truck, Clock, HelpCircle, MessageCircle, PackageX } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SEOHead } from "@/components/SEOHead";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";
import { formatPrice } from "@/lib/formatPrice";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";

interface OrderResult {
  orderNumber: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  shippingAddress: any;
  total: number;
  shippingCost: number;
}

const statusSteps = ["pending", "processing", "shipped", "delivered"];

function getStatusIndex(status: string) {
  const s = status.toLowerCase();
  const idx = statusSteps.indexOf(s);
  return idx >= 0 ? idx : (s === "cancelled" ? -1 : 0);
}

export default function TrackOrder() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const orderFromUrl = searchParams.get('order');
  const [orderNumber, setOrderNumber] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [orderError, setOrderError] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [phoneResults, setPhoneResults] = useState<OrderResult[]>([]);
  const [showPhoneResults, setShowPhoneResults] = useState(false);
  const [copiedOrder, setCopiedOrder] = useState<string | null>(null);
  const [recentOrders, setRecentOrders] = useState<OrderResult[]>([]);
  const [loadingRecent, setLoadingRecent] = useState(false);

  // Auto-fill order number from URL query param
  useEffect(() => {
    if (orderFromUrl) {
      setOrderNumber(orderFromUrl.toUpperCase());
    }
  }, [orderFromUrl]);

  // Load recent orders for logged-in users
  useEffect(() => {
    if (user) {
      setLoadingRecent(true);
      supabase
        .from("orders")
        .select("order_number, status, created_at, updated_at, shipping_address, total_amount, shipping_cost")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(5)
        .then(({ data }) => {
          if (data) {
            setRecentOrders(data.map(o => ({
              orderNumber: o.order_number,
              status: o.status,
              createdAt: o.created_at,
              updatedAt: o.updated_at,
              shippingAddress: o.shipping_address,
              total: o.total_amount,
              shippingCost: o.shipping_cost,
            })));
          }
          setLoadingRecent(false);
        });
    }
  }, [user]);

  const handleOrderSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setOrderError("");
    const trimmedOrder = orderNumber.trim().toUpperCase();
    const orderNumberRegex = /^ORD-\d{8}-\d{4}$/;
    if (!orderNumberRegex.test(trimmedOrder)) {
      setOrderError(t('track.invalidOrder'));
      return;
    }
    navigate(`/track-order?order=${trimmedOrder}`);
  };

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPhoneError("");
    setPhoneResults([]);
    setShowPhoneResults(false);
    const cleanPhone = phoneNumber.replace(/[\s\-\(\)]/g, "");
    if (cleanPhone.length < 10 || cleanPhone.length > 15) {
      setPhoneError(t('track.validPhone'));
      return;
    }
    if (!/^[\d+]+$/.test(cleanPhone)) {
      setPhoneError(t('track.validPhone'));
      return;
    }
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('track-order', {
        body: { phone: cleanPhone }
      });
      if (error) throw error;
      if (data.error) { setPhoneError(data.error); return; }
      if (data.orders && data.orders.length > 0) {
        setPhoneResults(data.orders);
        setShowPhoneResults(true);
      } else {
        setPhoneError(t('track.noOrders'));
      }
    } catch (error: any) {
      console.error("Phone search error:", error);
      setPhoneError(t('track.searchError'));
    } finally {
      setIsLoading(false);
    }
  };

  const copyOrderNumber = (num: string) => {
    navigator.clipboard.writeText(num);
    setCopiedOrder(num);
    toast.success("Order number copied!");
    setTimeout(() => setCopiedOrder(null), 2000);
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'shipped': return 'bg-blue-100 text-blue-800';
      case 'processing': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const StatusStepper = ({ status }: { status: string }) => {
    const currentIdx = getStatusIndex(status);
    if (currentIdx === -1) return <span className="text-xs text-red-500 font-medium">Cancelled</span>;
    return (
      <div className="flex items-center gap-1 mt-2">
        {statusSteps.map((step, i) => (
          <div key={step} className="flex items-center gap-1">
            <div className={`w-2.5 h-2.5 rounded-full ${i <= currentIdx ? 'bg-store-primary' : 'bg-muted'}`} />
            {i < statusSteps.length - 1 && <div className={`w-4 h-0.5 ${i < currentIdx ? 'bg-store-primary' : 'bg-muted'}`} />}
          </div>
        ))}
      </div>
    );
  };

  const OrderResultCard = ({ order }: { order: OrderResult }) => (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 border rounded-xl hover:border-store-primary/50 cursor-pointer transition-all hover:shadow-md bg-card"
      onClick={() => navigate(`/track-order?order=${order.orderNumber}`)}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="font-mono font-medium text-store-primary">{order.orderNumber}</span>
          <button
            onClick={(e) => { e.stopPropagation(); copyOrderNumber(order.orderNumber); }}
            className="p-1 rounded hover:bg-muted transition-colors"
          >
            {copiedOrder === order.orderNumber ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5 text-muted-foreground" />}
          </button>
        </div>
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor(order.status)}`}>{order.status}</span>
      </div>
      <StatusStepper status={order.status} />
      <div className="text-sm text-muted-foreground mt-2">
        <p>{t('track.date')}: {formatDate(order.createdAt)}</p>
        <p>{t('track.total')}: {formatPrice(order.total || 0)}</p>
      </div>
    </motion.div>
  );

  return (
    <>
      <SEOHead title="Track Order" description="Track your order status using your order number or phone number." canonicalPath="/track-order" />
      
      {/* Hero Banner */}
      <div className="relative bg-gradient-to-br from-store-primary/10 via-background to-store-primary/5 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-20 -right-20 w-72 h-72 bg-store-primary/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-20 -left-20 w-72 h-72 bg-store-primary/5 rounded-full blur-3xl" />
        </div>
        <div className="container mx-auto px-4 py-12 md:py-16 relative z-10">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center max-w-2xl mx-auto">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-store-primary/10 flex items-center justify-center">
              <Package className="h-8 w-8 text-store-primary" />
            </div>
            <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-2">Track Your Order</h1>
            <p className="text-muted-foreground text-lg">Enter your order number or phone number to check the status of your order</p>
          </motion.div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-lg mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card className="border-store-primary/20 shadow-md">
              <CardHeader>
                <CardTitle className="text-lg">{t('track.findOrder')}</CardTitle>
                <CardDescription>{t('track.searchBy')}</CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="order" className="w-full">
                  <TabsList className="grid w-full grid-cols-2 mb-4">
                    <TabsTrigger value="order" className="flex items-center gap-2"><Hash className="h-4 w-4" />{t('track.orderNumber')}</TabsTrigger>
                    <TabsTrigger value="phone" className="flex items-center gap-2"><Phone className="h-4 w-4" />{t('track.phoneNumber')}</TabsTrigger>
                  </TabsList>

                  <TabsContent value="order">
                    <form onSubmit={handleOrderSubmit} className="space-y-4">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input type="text" placeholder="ORD-20260202-1234" value={orderNumber} onChange={(e) => { setOrderNumber(e.target.value.toUpperCase()); setOrderError(""); }} className="pl-10 h-12 text-lg font-mono" maxLength={18} />
                      </div>
                      {orderError && (
                        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-sm text-destructive flex items-center gap-1">
                          <PackageX className="h-4 w-4" /> {orderError}
                        </motion.p>
                      )}
                      <Button type="submit" className="w-full h-12 bg-store-primary hover:bg-store-primary/90" disabled={!orderNumber.trim()}>
                        {t('track.trackOrder')}<ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </form>
                  </TabsContent>

                  <TabsContent value="phone">
                    <form onSubmit={handlePhoneSubmit} className="space-y-4">
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input type="tel" placeholder="01XXXXXXXXX" value={phoneNumber} onChange={(e) => { const value = e.target.value.replace(/[^\d+\s\-()]/g, ''); setPhoneNumber(value); setPhoneError(""); setShowPhoneResults(false); }} className="pl-10 h-12 text-lg" maxLength={15} />
                      </div>
                      {phoneError && (
                        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-sm text-destructive flex items-center gap-1">
                          <PackageX className="h-4 w-4" /> {phoneError}
                        </motion.p>
                      )}
                      <Button type="submit" className="w-full h-12 bg-store-primary hover:bg-store-primary/90" disabled={!phoneNumber.trim() || isLoading}>
                        {isLoading ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" />{t('track.searching')}</>) : (<>{t('track.findOrders')}<ArrowRight className="ml-2 h-4 w-4" /></>)}
                      </Button>
                    </form>

                    <AnimatePresence>
                      {showPhoneResults && phoneResults.length > 0 && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="mt-6 space-y-3 overflow-hidden">
                          <h3 className="font-medium text-sm text-foreground">{t('track.foundOrders')} {phoneResults.length} {t('track.orders')}:</h3>
                          {phoneResults.map((order) => (
                            <OrderResultCard key={order.orderNumber} order={order} />
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </TabsContent>
                </Tabs>

                <div className="mt-6 pt-6 border-t">
                  <h3 className="font-medium text-sm text-foreground mb-3">{t('track.whereToFind')}</h3>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2"><span className="text-store-primary">•</span>{t('track.inEmail')}</li>
                    <li className="flex items-start gap-2"><span className="text-store-primary">•</span>{t('track.inSms')}</li>
                    <li className="flex items-start gap-2"><span className="text-store-primary">•</span>{t('track.inAccount')}</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Recent Orders for logged-in users */}
          {user && recentOrders.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="mt-8">
              <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                <Clock className="h-5 w-5 text-store-primary" /> Your Recent Orders
              </h3>
              <div className="space-y-3">
                {recentOrders.map(order => (
                  <OrderResultCard key={order.orderNumber} order={order} />
                ))}
              </div>
            </motion.div>
          )}

          {/* Need Help CTA */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="mt-8">
            <Card className="bg-gradient-to-r from-store-primary/10 to-store-primary/5 border-store-primary/20">
              <CardContent className="flex flex-col sm:flex-row items-center justify-between gap-4 p-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-store-primary/10 flex items-center justify-center shrink-0">
                    <HelpCircle className="h-5 w-5 text-store-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold">Need Help?</h4>
                    <p className="text-sm text-muted-foreground">Can't find your order? Our support team is here to help.</p>
                  </div>
                </div>
                <Button asChild variant="outline" className="shrink-0 border-store-primary/30 text-store-primary hover:bg-store-primary/10">
                  <Link to="/contact"><MessageCircle className="mr-2 h-4 w-4" /> Contact Us</Link>
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </>
  );
}
