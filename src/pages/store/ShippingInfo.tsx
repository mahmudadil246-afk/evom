
import { SEOHead } from "@/components/SEOHead";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Truck, Clock, MapPin, Package, ArrowRight, Calculator, CheckCircle2, HelpCircle, ThumbsUp, ThumbsDown, Search as SearchIcon } from "lucide-react";
import { usePageContent } from "@/hooks/useSiteContent";
import { useLanguage } from "@/contexts/LanguageContext";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { formatPrice } from "@/lib/formatPrice";


export default function ShippingInfo() {
  const { data, loading } = usePageContent("shipping-info");
  const { t } = useLanguage();
  const title = data?.title || t('store.shippingInfoTitle') || "Shipping Information";
  const subtitle = data?.subtitle || t('store.shippingInfoSubtitle') || "Everything you need to know about our delivery process";
  const c = (data?.content || {}) as any;

  const [selectedArea, setSelectedArea] = useState("");
  const [helpfulFaqs, setHelpfulFaqs] = useState<Record<number, boolean | null>>({});

  const deliveryOptions = c.delivery_options || [];
  const deliveryAreas = c.delivery_areas || [];
  const shippingCosts = c.shipping_costs || [];
  const courierPartners = c.courier_partners || [];
  const shippingFaqs = c.faqs || [];
  const processingText = c.processing_text || "";
  const trackingText = c.tracking_text || "";
  const notes = c.notes || [];

  const faqCategoryConfig: Record<string, { icon: any; color: string; label: string }> = {
    cost: { icon: Calculator, color: "bg-green-100 text-green-700", label: "Cost" },
    time: { icon: Clock, color: "bg-blue-100 text-blue-700", label: "Delivery Time" },
    tracking: { icon: SearchIcon, color: "bg-purple-100 text-purple-700", label: "Tracking" },
    area: { icon: MapPin, color: "bg-orange-100 text-orange-700", label: "Coverage" },
    issue: { icon: HelpCircle, color: "bg-red-100 text-red-700", label: "Issues" },
  };

  const timelineSteps = [
    { icon: Package, label: "Order Placed", desc: "Your order is confirmed", day: "Day 0" },
    { icon: Clock, label: "Processing", desc: "We're preparing your package", day: "Day 1" },
    { icon: Truck, label: "Shipped", desc: "Handed to courier partner", day: "Day 1-2" },
    { icon: CheckCircle2, label: "Delivered", desc: "At your doorstep!", day: "Day 2-7" },
  ];

  const selectedCost = shippingCosts.find(s => s.area === selectedArea);

  if (loading) {
    return <div className="container mx-auto px-4 py-12"><Skeleton className="h-10 w-48 mx-auto" /></div>;
  }

  return (
    <>
      <SEOHead title="Shipping Information" description="Learn about our shipping options, delivery times and costs across Bangladesh." canonicalPath="/shipping-info" />
      
      {/* Hero Banner */}
      <div className="relative bg-gradient-to-br from-store-primary/10 via-background to-store-primary/5 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-20 -right-20 w-72 h-72 bg-store-primary/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-20 -left-20 w-72 h-72 bg-store-primary/5 rounded-full blur-3xl" />
        </div>
        <div className="container mx-auto px-4 py-12 md:py-16 relative z-10">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center max-w-2xl mx-auto">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-store-primary/10 flex items-center justify-center">
              <Truck className="h-8 w-8 text-store-primary" />
            </div>
            <h1 className="font-display text-3xl md:text-4xl font-bold mb-3">{title}</h1>
            <p className="text-muted-foreground text-lg">{subtitle}</p>
          </motion.div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        {/* Delivery Options & Areas */}
        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto mb-12">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
            <Card className="h-full">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-store-primary/10 flex items-center justify-center">
                    <Truck className="h-5 w-5 text-store-primary" />
                  </div>
                  <CardTitle>Delivery Options</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {deliveryOptions.map((opt: any, i: number) => (
                  <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 + i * 0.05 }} className={i < deliveryOptions.length - 1 ? "border-b pb-3" : ""}>
                    <h4 className="font-semibold">{opt.title}</h4>
                    <p className="text-sm text-muted-foreground">{opt.text}</p>
                  </motion.div>
                ))}
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
            <Card className="h-full">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-store-primary/10 flex items-center justify-center">
                    <MapPin className="h-5 w-5 text-store-primary" />
                  </div>
                  <CardTitle>Delivery Areas</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {deliveryAreas.map((area: any, i: number) => (
                  <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 + i * 0.05 }} className={i < deliveryAreas.length - 1 ? "border-b pb-3" : ""}>
                    <h4 className="font-semibold">{area.title}</h4>
                    <p className="text-sm text-muted-foreground">{area.text}</p>
                  </motion.div>
                ))}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Shipping Cost Calculator */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="max-w-4xl mx-auto mb-12">
          <Card className="border-store-primary/20">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-store-primary/10 flex items-center justify-center">
                  <Calculator className="h-5 w-5 text-store-primary" />
                </div>
                <div>
                  <CardTitle>Shipping Cost Calculator</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">Select your delivery area to see estimated costs</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6 items-start">
                <Select value={selectedArea} onValueChange={setSelectedArea}>
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder="Select delivery area..." />
                  </SelectTrigger>
                  <SelectContent>
                    {shippingCosts.map((s: any) => (
                      <SelectItem key={s.area} value={s.area}>{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <AnimatePresence mode="wait">
                  {selectedCost && (
                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-store-primary/5 rounded-xl p-5 text-center">
                      <p className="text-sm text-muted-foreground mb-1">Estimated Shipping Cost</p>
                      <p className="text-3xl font-bold text-store-primary">{formatPrice(selectedCost.cost)}</p>
                      <p className="text-sm text-muted-foreground mt-1">Estimated delivery: {selectedCost.days}</p>
                      <p className="text-xs text-muted-foreground mt-2">Free shipping on orders over {formatPrice(2000)}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Delivery Timeline */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="max-w-4xl mx-auto mb-12">
          <h2 className="font-display text-2xl font-bold mb-6 text-center">Delivery Timeline</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {timelineSteps.map((step, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 + i * 0.1 }} className="relative text-center">
                <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-store-primary/10 flex items-center justify-center">
                  <step.icon className="h-6 w-6 text-store-primary" />
                </div>
                {i < timelineSteps.length - 1 && (
                  <div className="hidden md:block absolute top-7 left-[60%] w-[80%] h-0.5 bg-store-primary/20" />
                )}
                <Badge variant="secondary" className="mb-2">{step.day}</Badge>
                <h4 className="font-semibold text-sm">{step.label}</h4>
                <p className="text-xs text-muted-foreground mt-1">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Processing & Tracking */}
        <div className="max-w-4xl mx-auto space-y-6 mb-12">
          <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
            <h2 className="font-display text-2xl font-bold mb-4 flex items-center gap-2">
              <Clock className="h-6 w-6 text-store-primary" /> Processing Time
            </h2>
            <p className="text-muted-foreground">{processingText}</p>
          </motion.section>

          <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }}>
            <h2 className="font-display text-2xl font-bold mb-4 flex items-center gap-2">
              <Package className="h-6 w-6 text-store-primary" /> Order Tracking
            </h2>
            <p className="text-muted-foreground">{trackingText}</p>
          </motion.section>
        </div>

        {/* Important Notes */}
        {notes.length > 0 && (
          <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="max-w-4xl mx-auto mb-12 bg-store-primary/5 rounded-xl p-6">
            <h3 className="font-semibold mb-3">Important Notes</h3>
            <ul className="list-disc list-inside text-muted-foreground space-y-1.5">
              {notes.map((note: string, i: number) => <li key={i}>{note}</li>)}
            </ul>
          </motion.section>
        )}

        {/* Courier Partners */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.65 }} className="max-w-4xl mx-auto mb-12">
          <h2 className="font-display text-2xl font-bold mb-6 text-center">Our Courier Partners</h2>
          <div className="grid grid-cols-3 md:grid-cols-5 gap-4">
            {courierPartners.map((cp: any, i: number) => (
              <motion.div key={cp.name} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.7 + i * 0.05 }} className="flex flex-col items-center gap-2 p-4 rounded-xl border bg-card hover:shadow-md transition-shadow">
                <div className="w-16 h-12 flex items-center justify-center">
                  <img src={cp.logo} alt={cp.name} className="max-h-10 max-w-full object-contain" />
                </div>
                <span className="text-xs font-medium text-muted-foreground">{cp.name}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Shipping FAQ */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.75 }} className="max-w-4xl mx-auto mb-12">
          <h2 className="font-display text-2xl font-bold mb-6 text-center">Shipping FAQ</h2>
          <Accordion type="single" collapsible className="space-y-3">
            {shippingFaqs.map((faq: any, i: number) => {
              const catConfig = faqCategoryConfig[faq.category];
              const CatIcon = catConfig?.icon || HelpCircle;
              return (
                <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 + i * 0.05 }}>
                  <AccordionItem value={`faq-${i}`} className="border rounded-xl px-5 bg-card shadow-sm">
                    <AccordionTrigger className="hover:no-underline py-4">
                      <div className="flex items-center gap-3 text-left">
                        <CatIcon className="h-4 w-4 text-store-primary shrink-0" />
                        <span className="font-medium">{faq.q ?? faq.question ?? ""}</span>
                        {catConfig && <Badge variant="secondary" className={`${catConfig.color} text-xs ml-auto mr-2 shrink-0`}>{catConfig.label}</Badge>}
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground pb-4">
                      <p>{faq.a ?? faq.answer ?? ""}</p>
                      <div className="flex items-center gap-3 mt-3 pt-3 border-t">
                        <span className="text-xs text-muted-foreground">Was this helpful?</span>
                        <button onClick={() => setHelpfulFaqs(p => ({ ...p, [i]: true }))} className={`p-1.5 rounded-full transition-colors ${helpfulFaqs[i] === true ? 'bg-green-100 text-green-600' : 'hover:bg-muted'}`}>
                          <ThumbsUp className="h-3.5 w-3.5" />
                        </button>
                        <button onClick={() => setHelpfulFaqs(p => ({ ...p, [i]: false }))} className={`p-1.5 rounded-full transition-colors ${helpfulFaqs[i] === false ? 'bg-red-100 text-red-600' : 'hover:bg-muted'}`}>
                          <ThumbsDown className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </motion.div>
              );
            })}
          </Accordion>
        </motion.div>

        {/* Track Order CTA */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.85 }} className="max-w-4xl mx-auto">
          <Card className="bg-gradient-to-r from-store-primary/10 to-store-primary/5 border-store-primary/20">
            <CardContent className="flex flex-col md:flex-row items-center justify-between gap-4 p-8">
              <div>
                <h3 className="text-xl font-bold mb-1">Track Your Order</h3>
                <p className="text-muted-foreground">Already placed an order? Track its status in real-time.</p>
              </div>
              <Button asChild className="bg-store-primary hover:bg-store-primary/90 shrink-0">
                <Link to="/track-order">Track Order <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </>
  );
}
