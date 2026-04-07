
import { SEOHead } from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Mail, Phone, MapPin, Clock, Loader2, Send, Facebook, Instagram, MessageCircle, CheckCircle2, ChevronRight, Home, Search, Package, Truck, RotateCcw, HelpCircle, ThumbsUp, ThumbsDown, X } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { usePageContent } from "@/hooks/useSiteContent";
import { useLanguage } from "@/contexts/LanguageContext";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

const contactFormSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required").max(50),
  lastName: z.string().trim().min(1, "Last name is required").max(50),
  email: z.string().trim().email("Invalid email address").max(100),
  phone: z.string().trim().max(20).optional().or(z.literal("")),
  subject: z.string().min(1, "Please select a topic"),
  message: z.string().trim().min(10, "Message must be at least 10 characters").max(1000),
});

type ContactFormValues = z.infer<typeof contactFormSchema>;

const subjectOptions = [
  { value: "general", label: "General Inquiry" },
  { value: "order", label: "Order Issue" },
  { value: "return", label: "Return / Refund" },
  { value: "product", label: "Product Question" },
  { value: "shipping", label: "Shipping Issue" },
  { value: "other", label: "Other" },
];

type FaqCategory = "orders" | "returns" | "shipping" | "general";

interface FaqItemRaw {
  q?: string;
  a?: string;
  question?: string;
  answer?: string;
  category: FaqCategory;
}

interface FaqItem {
  q: string;
  a: string;
  category: FaqCategory;
}

function normalizeFaq(raw: FaqItemRaw): FaqItem {
  const cat = raw.category as FaqCategory;
  const validCategories: FaqCategory[] = ["orders", "returns", "shipping", "general"];
  return {
    q: raw.q ?? raw.question ?? "",
    a: raw.a ?? raw.answer ?? "",
    category: validCategories.includes(cat) ? cat : "general",
  };
}

const faqCategoryConfig: Record<FaqCategory, { label: string; icon: React.ElementType; color: string }> = {
  orders: { label: "Orders", icon: Package, color: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300" },
  shipping: { label: "Shipping", icon: Truck, color: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300" },
  returns: { label: "Returns", icon: RotateCcw, color: "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300" },
  general: { label: "General", icon: HelpCircle, color: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300" },
};


const iconMap: Record<string, React.ElementType> = {
  "map-pin": MapPin, phone: Phone, mail: Mail, clock: Clock,
};

function BusinessHoursStatus() {
  const now = new Date();
  const day = now.getDay();
  const hour = now.getHours();
  const isWeekday = day >= 0 && day <= 4; // Sun-Thu for BD
  const isOpen = isWeekday && hour >= 10 && hour < 20;

  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full ${isOpen ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${isOpen ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
      {isOpen ? "Open Now" : "Closed"}
    </span>
  );
}

export default function Contact() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [faqSearch, setFaqSearch] = useState("");
  const [faqHelpful, setFaqHelpful] = useState<Record<number, "yes" | "no">>({});
  const [showSuggestions, setShowSuggestions] = useState(false);
  const { data: pageData, loading: pageLoading } = usePageContent("contact");
  const { t } = useLanguage();
  const form = useForm<ContactFormValues>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: { firstName: "", lastName: "", email: "", phone: "", subject: "", message: "" },
  });

  const messageValue = form.watch("message");

  const onSubmit = async (data: ContactFormValues) => {
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from("contact_messages").insert({
        first_name: data.firstName, last_name: data.lastName, email: data.email,
        phone: data.phone || null, subject: data.subject, message: data.message,
      });
      if (error) throw error;
      setIsSuccess(true);
      form.reset();
    } catch (error) {
      console.error("Error submitting contact form:", error);
      toast.error("Failed to send message. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const title = pageData?.title || t('store.contactTitle');
  const subtitle = pageData?.subtitle || t('store.contactSubtitle');
  const contentData = (pageData?.content || {}) as any;
  const formTitle = contentData.form_title || t('store.sendUsMessage');
  const cards = contentData.cards || [];
  const faqItems: FaqItem[] = (contentData.faqs || []).map(normalizeFaq);

  if (pageLoading) {
    return (
      <div className="container mx-auto px-4 py-12 space-y-4">
        <Skeleton className="h-10 w-48 mx-auto" />
        <Skeleton className="h-6 w-96 mx-auto" />
      </div>
    );
  }

  return (
    <>
      <SEOHead
        title={t('store.contactTitle')}
        description={subtitle}
        canonicalPath="/contact"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "ContactPage",
          name: title,
          description: subtitle,
        }}
      />


      {/* Hero Banner */}
      <div className="relative overflow-hidden bg-gradient-to-br from-store-primary/10 via-store-primary/5 to-transparent">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-20 -right-20 w-64 h-64 bg-store-primary/5 rounded-full blur-3xl" />
          <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-store-primary/8 rounded-full blur-2xl" />
        </div>
        <div className="container mx-auto px-4 py-12 md:py-16 text-center relative z-10">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-display text-3xl md:text-4xl lg:text-5xl font-bold mb-3"
          >
            {title}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-muted-foreground text-base md:text-lg max-w-xl mx-auto"
          >
            {subtitle}
          </motion.p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-10">
        {/* Info Cards + Form */}
        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">

          {/* Left: Info Cards (show first on mobile) */}
          <div className="space-y-4 order-1 md:order-2">
            {cards.map((card: any, i: number) => {
              const IconComp = iconMap[card.icon] || MapPin;
              const isClockCard = card.icon === "clock";
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.08 }}
                >
                  <Card className="group hover:shadow-md transition-all duration-300 hover:border-store-primary/30">
                    <CardContent className="p-5">
                      <div className="flex items-start gap-4">
                        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-store-primary/20 to-store-primary/10 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                          <IconComp className="h-5 w-5 text-store-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-sm">{card.title}</h3>
                            {isClockCard && <BusinessHoursStatus />}
                          </div>
                          <p className="text-muted-foreground text-sm whitespace-pre-line">{card.text}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}

            {/* Social Media Links */}
            <Card className="hover:shadow-md transition-all duration-300 hover:border-store-primary/30">
              <CardContent className="p-5">
                <h3 className="font-semibold text-sm mb-3">Connect With Us</h3>
                <div className="flex items-center gap-3">
                  <a href="https://facebook.com" target="_blank" rel="noopener noreferrer"
                    className="w-10 h-10 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 flex items-center justify-center transition-colors">
                    <Facebook className="h-4.5 w-4.5 text-blue-600" />
                  </a>
                  <a href="https://instagram.com" target="_blank" rel="noopener noreferrer"
                    className="w-10 h-10 rounded-xl bg-pink-500/10 hover:bg-pink-500/20 flex items-center justify-center transition-colors">
                    <Instagram className="h-4.5 w-4.5 text-pink-600" />
                  </a>
                  <a href="https://wa.me/8801XXXXXXXXX" target="_blank" rel="noopener noreferrer"
                    className="w-10 h-10 rounded-xl bg-green-500/10 hover:bg-green-500/20 flex items-center justify-center transition-colors">
                    <MessageCircle className="h-4.5 w-4.5 text-green-600" />
                  </a>
                </div>
              </CardContent>
            </Card>

            {/* Google Map */}
            <Card className="overflow-hidden hover:shadow-md transition-all duration-300">
              <div className="h-48 w-full">
                <iframe
                  title="Store Location"
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d233668.0714569872!2d90.27885829067017!3d23.780573258035967!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3755b8b087026b81%3A0x8fa563b5e1d8bd6!2sDhaka!5e0!3m2!1sen!2sbd!4v1700000000000!5m2!1sen!2sbd"
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  className="grayscale hover:grayscale-0 transition-all duration-500"
                />
              </div>
            </Card>
          </div>

          {/* Right: Contact Form */}
          <div className="order-2 md:order-1">
            <AnimatePresence mode="wait">
              {isSuccess ? (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="flex flex-col items-center justify-center text-center py-16"
                >
                  <div className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-5">
                    <CheckCircle2 className="h-10 w-10 text-green-600 dark:text-green-400" />
                  </div>
                  <h2 className="text-2xl font-bold mb-2">Message Sent!</h2>
                  <p className="text-muted-foreground mb-6 max-w-sm">
                    Thank you for reaching out. We'll get back to you within 24 hours.
                  </p>
                  <Button onClick={() => setIsSuccess(false)} variant="outline">
                    Send Another Message
                  </Button>
                </motion.div>
              ) : (
                <motion.div
                  key="form"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <Card className="shadow-lg border-store-primary/10">
                    <CardContent className="p-6 md:p-8">
                      <h2 className="text-xl font-bold mb-5">{formTitle}</h2>
                      <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <FormField control={form.control} name="firstName" render={({ field }) => (
                              <FormItem><FormLabel>{t('store.firstName')}</FormLabel><FormControl><Input placeholder="John" {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                            <FormField control={form.control} name="lastName" render={({ field }) => (
                              <FormItem><FormLabel>{t('store.lastName')}</FormLabel><FormControl><Input placeholder="Doe" {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                          </div>
                          <FormField control={form.control} name="email" render={({ field }) => (
                            <FormItem><FormLabel>{t('common.email')}</FormLabel><FormControl><Input type="email" placeholder="john@example.com" {...field} /></FormControl><FormMessage /></FormItem>
                          )} />
                          <FormField control={form.control} name="phone" render={({ field }) => (
                            <FormItem><FormLabel>{t('store.phoneOptional')}</FormLabel><FormControl><Input placeholder="+880 1XXX-XXXXXX" {...field} /></FormControl><FormMessage /></FormItem>
                          )} />
                          <FormField control={form.control} name="subject" render={({ field }) => (
                            <FormItem>
                              <FormLabel>Topic</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger><SelectValue placeholder="What is this about?" /></SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {subjectOptions.map(opt => (
                                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )} />
                          <FormField control={form.control} name="message" render={({ field }) => (
                            <FormItem>
                              <FormLabel>{t('store.message')}</FormLabel>
                              <FormControl><Textarea placeholder="How can we help you?" rows={5} {...field} /></FormControl>
                              <div className="flex justify-between items-center">
                                <FormMessage />
                                <span className={`text-xs ml-auto ${(messageValue?.length || 0) > 900 ? 'text-destructive' : 'text-muted-foreground'}`}>
                                  {messageValue?.length || 0}/1000
                                </span>
                              </div>
                            </FormItem>
                          )} />
                          <Button type="submit" className="w-full bg-store-primary hover:bg-store-primary/90 gap-2" disabled={isSubmitting}>
                            {isSubmitting ? (
                              <><Loader2 className="h-4 w-4 animate-spin" />{t('store.sending')}</>
                            ) : (
                              <><Send className="h-4 w-4" />{t('store.sendMessage')}</>
                            )}
                          </Button>
                        </form>
                      </Form>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="max-w-3xl mx-auto mt-14">
          <h2 className="text-2xl font-bold text-center mb-6">Frequently Asked Questions</h2>
          
          {/* Search with Suggestions */}
          <div className="relative mb-6">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search questions..."
                value={faqSearch}
                onChange={(e) => { setFaqSearch(e.target.value); setShowSuggestions(true); }}
                onFocus={() => faqSearch && setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                className="pl-10 pr-10 h-11 rounded-xl border-muted-foreground/20 bg-background shadow-sm"
              />
              {faqSearch && (
                <button onClick={() => { setFaqSearch(""); setShowSuggestions(false); }} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            {showSuggestions && faqSearch && (
              <div className="absolute z-20 top-full mt-1 w-full bg-card border rounded-xl shadow-lg overflow-hidden">
                {faqItems.filter(f => f.q.toLowerCase().includes(faqSearch.toLowerCase())).map((item, i) => {
                  const cat = faqCategoryConfig[item.category];
                  const Icon = cat.icon;
                  return (
                    <button
                      key={i}
                      className="w-full text-left px-4 py-3 hover:bg-accent/50 flex items-center gap-3 text-sm transition-colors"
                      onMouseDown={() => { setFaqSearch(item.q); setShowSuggestions(false); }}
                    >
                      <span className={`p-1 rounded-md ${cat.color}`}><Icon className="h-3.5 w-3.5" /></span>
                      {item.q}
                    </button>
                  );
                })}
                {faqItems.filter(f => f.q.toLowerCase().includes(faqSearch.toLowerCase())).length === 0 && (
                  <div className="px-4 py-3 text-sm text-muted-foreground">No matching questions</div>
                )}
              </div>
            )}
          </div>

          {/* FAQ Accordion - matching FAQ page style */}
          <Accordion type="single" collapsible className="space-y-3">
            <AnimatePresence>
              {faqItems
                .filter(f => !faqSearch || f.q.toLowerCase().includes(faqSearch.toLowerCase()) || f.a.toLowerCase().includes(faqSearch.toLowerCase()))
                .map((item, i) => {
                  const cat = faqCategoryConfig[item.category];
                  const CatIcon = cat.icon;
                  return (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04 }}
                    >
                      <AccordionItem
                        value={`faq-${i}`}
                        className="border rounded-xl px-5 bg-card shadow-sm hover:shadow-md transition-shadow"
                      >
                        <AccordionTrigger className="text-left gap-3 py-4 hover:no-underline">
                          <div className="flex items-center gap-3 flex-1">
                            <span className={`p-1.5 rounded-lg ${cat.color}`}>
                              <CatIcon className="h-4 w-4" />
                            </span>
                            <span className="font-medium text-sm">{item.q}</span>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="text-muted-foreground pb-4">
                          <p className="pl-10">{item.a}</p>
                          <div className="pl-10 mt-3 flex items-center gap-3">
                            <span className="text-xs text-muted-foreground/70">Was this helpful?</span>
                            <button
                              onClick={() => setFaqHelpful(m => ({ ...m, [i]: "yes" }))}
                              className={`p-1 rounded hover:bg-accent transition-colors ${faqHelpful[i] === "yes" ? "text-green-600" : "text-muted-foreground/50"}`}
                            >
                              <ThumbsUp className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => setFaqHelpful(m => ({ ...m, [i]: "no" }))}
                              className={`p-1 rounded hover:bg-accent transition-colors ${faqHelpful[i] === "no" ? "text-red-500" : "text-muted-foreground/50"}`}
                            >
                              <ThumbsDown className="h-3.5 w-3.5" />
                            </button>
                            {faqHelpful[i] && (
                              <span className="text-xs text-muted-foreground/60">Thanks for your feedback!</span>
                            )}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    </motion.div>
                  );
                })}
            </AnimatePresence>
          </Accordion>
        </div>
      </div>
    </>
  );
}
