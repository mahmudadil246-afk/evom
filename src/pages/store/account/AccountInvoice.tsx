import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { SEOHead } from "@/components/SEOHead";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Download, FileText, Receipt } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { toast } from "sonner";
import jsPDF from "jspdf";
import { formatPrice } from "@/lib/formatPrice";
import { motion } from "framer-motion";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" as const } },
};

export default function AccountInvoice() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      setLoading(true);
      const { data: customer } = await supabase.from("customers").select("id").eq("user_id", user.id).maybeSingle();
      if (!customer) { setLoading(false); return; }
      const { data } = await supabase
        .from("orders")
        .select("id, order_number, status, payment_status, total_amount, shipping_cost, discount_amount, created_at, payment_method, shipping_address")
        .eq("customer_id", customer.id).order("created_at", { ascending: false });
      if (data) {
        const withItems = await Promise.all(data.map(async (o) => {
          const { data: items } = await supabase.from("order_items").select("product_name, quantity, unit_price, total_price").eq("order_id", o.id);
          return { ...o, items: items || [] };
        }));
        setOrders(withItems);
      }
      setLoading(false);
    };
    fetch();
  }, [user]);

  const generatePDF = (order: any) => {
    setDownloading(order.id);
    try {
      const doc = new jsPDF();
      const w = doc.internal.pageSize.getWidth();
      doc.setFontSize(20); doc.setFont("helvetica", "bold"); doc.text("INVOICE", 14, 25);
      doc.setFontSize(10); doc.setFont("helvetica", "normal");
      doc.text(`Order: #${order.order_number}`, 14, 35);
      doc.text(`Date: ${format(new Date(order.created_at), "MMM dd, yyyy")}`, 14, 41);
      doc.text(`Payment: ${order.payment_method || "N/A"}`, 14, 47);
      doc.text(`Status: ${order.payment_status || "pending"}`, 14, 53);
      const addr = order.shipping_address;
      if (addr) {
        doc.text("Ship To:", w - 80, 35);
        doc.text(addr.name || "", w - 80, 41);
        doc.text(addr.address || "", w - 80, 47);
        doc.text(`${addr.city || ""}, ${addr.area || ""}`, w - 80, 53);
        doc.text(addr.phone || "", w - 80, 59);
      }
      let y = 70;
      doc.setFillColor(245, 245, 245); doc.rect(14, y, w - 28, 8, "F");
      doc.setFont("helvetica", "bold"); doc.setFontSize(9);
      doc.text("Product", 16, y + 6); doc.text("Qty", 120, y + 6); doc.text("Price", 140, y + 6); doc.text("Total", 170, y + 6);
      y += 12; doc.setFont("helvetica", "normal");
      for (const item of order.items) {
        doc.text(item.product_name.substring(0, 40), 16, y);
        doc.text(String(item.quantity), 120, y);
        doc.text(formatPrice(item.unit_price), 140, y);
        doc.text(formatPrice(item.total_price), 170, y);
        y += 7;
      }
      y += 5; doc.setDrawColor(200); doc.line(14, y, w - 14, y); y += 8;
      const subtotal = order.items.reduce((s: number, i: any) => s + Number(i.total_price), 0);
      doc.text("Subtotal:", 140, y); doc.text(formatPrice(subtotal), 170, y); y += 7;
      doc.text("Shipping:", 140, y); doc.text(formatPrice(order.shipping_cost || 0), 170, y);
      if (Number(order.discount_amount) > 0) { y += 7; doc.text("Discount:", 140, y); doc.text(`-${formatPrice(order.discount_amount)}`, 170, y); }
      y += 7; doc.setFont("helvetica", "bold");
      doc.text("Total:", 140, y); doc.text(formatPrice(order.total_amount), 170, y);
      doc.save(`Invoice-${order.order_number}.pdf`);
      toast.success(t('account.invoiceDownloaded'));
    } catch { toast.error(t('account.failedToGenerate')); }
    finally { setDownloading(null); }
  };

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <>
    <SEOHead title="Invoices" noIndex />
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-4">
      {orders.length === 0 ? (
        <motion.div variants={itemVariants}>
          <Card className="border-dashed">
            <CardContent className="py-16 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
                <Receipt className="h-8 w-8 text-primary" />
              </div>
              <h3 className="font-semibold text-lg mb-1">{t('account.noInvoices')}</h3>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto">Your order invoices will appear here once you make a purchase</p>
            </CardContent>
          </Card>
        </motion.div>
      ) : (
        orders.map((order) => (
          <motion.div key={order.id} variants={itemVariants}>
            <Card className="hover:shadow-md transition-all hover:border-primary/30">
              <CardContent className="flex items-center justify-between py-4 flex-wrap gap-3">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <FileText className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">#{order.order_number}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(order.created_at), "MMM dd, yyyy")} · {formatPrice(order.total_amount)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={order.payment_status === "paid" ? "default" : "secondary"}>
                    {order.payment_status || t('account.pending')}
                  </Badge>
                  <Button size="sm" variant="outline" onClick={() => generatePDF(order)} disabled={downloading === order.id}>
                    {downloading === order.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                    <span className="ml-1.5">{t('common.download')}</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))
      )}
    </motion.div>
    </>
  );
}
