
import { useState } from "react";
import { SEOHead } from "@/components/SEOHead";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { CheckCircle, XCircle, RefreshCw, Package, Clock, Shield, ArrowRightLeft, MessageCircle, ThumbsUp, ThumbsDown, ChevronRight, Phone, Mail } from "lucide-react";
import { usePageContent } from "@/hooks/useSiteContent";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";

const defaultEligible = [
  "Unused items with original tags and packaging",
  "Items received damaged or defective",
  "Wrong item received",
  "Items that don't match the product description",
  "Items returned within 7 days of delivery",
];

const defaultNotEligible = [
  "Items used, washed, or altered",
  "Undergarments and intimate apparel",
  "Items without original tags or packaging",
  "Items returned after 7 days of delivery",
  "Gift cards and vouchers",
  "Items marked as 'Final Sale'",
];

const defaultSteps = [
  { title: "Contact Us", text: "Reach out via our Contact page or call us to initiate a return request." },
  { title: "Get Approval", text: "Our team will review your request and send you a return authorization within 24 hours." },
  { title: "Ship the Item", text: "Pack the item securely with original tags and packaging, then ship it to us." },
  { title: "Refund Processed", text: "Once we receive and inspect the item, your refund will be processed within 3-5 business days." },
];

const defaultRefundInfo = [
  "Refunds are processed within 3-5 business days after inspection",
  "Original payment method will be refunded",
  "Shipping charges are non-refundable unless item was defective",
  "You will receive an email confirmation once refund is processed",
  "Bank processing time may add 2-3 additional business days",
];

const defaultFaqs = [
  { question: "How long do I have to return an item?", answer: "You have 7 days from the date of delivery to initiate a return request. Items must be unused and in original packaging.", category: "Returns" },
  { question: "How do I start a return?", answer: "Contact us through our Contact page, call us, or visit your Account > Returns section if you're a registered user.", category: "Returns" },
  { question: "Can I exchange instead of return?", answer: "Yes! We offer exchanges for different sizes or colors, subject to availability. Contact us to arrange an exchange.", category: "Exchange" },
  { question: "Who pays for return shipping?", answer: "If the item is defective or we made an error, we cover shipping. For other returns, the customer is responsible for shipping costs.", category: "Shipping" },
  { question: "When will I get my refund?", answer: "Refunds are processed within 3-5 business days after we receive and inspect the returned item. Bank processing may add 2-3 days.", category: "Refund" },
  { question: "Can I return a sale item?", answer: "Items marked as 'Final Sale' cannot be returned. Other discounted items follow the standard return policy.", category: "Returns" },
];

const timelineSteps = [
  { icon: MessageCircle, label: "Contact Us", desc: "Initiate request" },
  { icon: CheckCircle, label: "Get Approval", desc: "Within 24 hours" },
  { icon: Package, label: "Ship Item", desc: "Pack & send" },
  { icon: RefreshCw, label: "Refund", desc: "3-5 business days" },
];

const policyHighlights = [
  { icon: Clock, title: "7-Day Window", desc: "Return within 7 days of delivery" },
  { icon: Shield, title: "Quality Guarantee", desc: "Defective items always accepted" },
  { icon: ArrowRightLeft, title: "Easy Exchange", desc: "Swap for different size or color" },
  { icon: Package, title: "Secure Packaging", desc: "Original tags & packaging required" },
];

export default function Returns() {
  const { data, loading } = usePageContent("returns");
  const { t } = useLanguage();
  const { user } = useAuth();
  const [helpfulFaq, setHelpfulFaq] = useState<Record<number, boolean | null>>({});

  const title = data?.title || t('store.returnsTitle') !== 'store.returnsTitle' ? (data?.title || t('store.returnsTitle')) : "Returns & Exchange Policy";
  const subtitle = data?.subtitle || t('store.returnsSubtitle') !== 'store.returnsSubtitle' ? (data?.subtitle || t('store.returnsSubtitle')) : "Easy returns and exchanges within 7 days. Your satisfaction is our priority.";
  const c = (data?.content || {}) as any;

  const eligible = c.eligible || [];
  const notEligible = c.not_eligible || [];
  const steps = c.steps || [];
  const refundInfo = c.refund_info || [];
  const faqs = c.faqs || [];

  if (loading) {
    return <div className="container mx-auto px-4 py-12"><Skeleton className="h-10 w-48 mx-auto" /></div>;
  }

  return (
    <>
      <SEOHead title="Returns & Exchange" description="Learn about our return and exchange policy. Easy returns within 7 days." canonicalPath="/returns" />

      {/* Hero Banner */}
      <section className="relative bg-gradient-to-br from-primary/10 via-accent/5 to-secondary/10 overflow-hidden">
        <div className="absolute top-10 left-10 w-32 h-32 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-10 w-40 h-40 bg-accent/10 rounded-full blur-3xl" />
        <div className="container mx-auto px-4 py-16 text-center relative z-10">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <Badge variant="secondary" className="mb-4">Return Policy</Badge>
            <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-3">{title}</h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">{subtitle}</p>
          </motion.div>
        </div>
        <svg className="w-full text-background" viewBox="0 0 1440 60" fill="currentColor" preserveAspectRatio="none"><path d="M0,60 L0,20 Q360,0 720,20 Q1080,40 1440,20 L1440,60 Z" /></svg>
      </section>

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto space-y-12">

          {/* Policy Highlights */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {policyHighlights.map((item, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 + i * 0.05 }}>
                  <Card className="text-center h-full hover:shadow-md transition-shadow">
                    <CardContent className="p-4 md:p-6">
                      <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                        <item.icon className="h-5 w-5 md:h-6 md:w-6 text-primary" />
                      </div>
                      <h3 className="font-semibold text-sm md:text-base mb-1">{item.title}</h3>
                      <p className="text-xs md:text-sm text-muted-foreground">{item.desc}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Return Process Timeline */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <h2 className="font-display text-2xl font-bold mb-6 flex items-center gap-2">
              <RefreshCw className="h-6 w-6 text-primary" /> How to Return
            </h2>
            <Card>
              <CardContent className="p-6 md:p-8">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  {timelineSteps.map((step, i) => (
                    <div key={i} className="flex md:flex-col items-center gap-3 md:gap-2 flex-1 relative">
                      <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center shrink-0">
                        <step.icon className="h-5 w-5" />
                      </div>
                      <div className="md:text-center">
                        <p className="font-semibold text-sm">{step.label}</p>
                        <p className="text-xs text-muted-foreground">{step.desc}</p>
                      </div>
                      {i < timelineSteps.length - 1 && (
                        <ChevronRight className="hidden md:block absolute -right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground/50" style={{ right: '-14px', top: '24px' }} />
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Eligible / Not Eligible */}
          <div className="grid md:grid-cols-2 gap-6">
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }}>
              <Card className="h-full border-primary/30">
                <CardContent className="p-6">
                  <h2 className="font-display text-xl font-bold mb-4 flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-primary" /> Eligible for Return
                  </h2>
                  <ul className="space-y-2">
                    {eligible.map((item: string, i: number) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <CheckCircle className="h-4 w-4 text-primary/70 mt-0.5 shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.45 }}>
              <Card className="h-full border-destructive/30">
                <CardContent className="p-6">
                  <h2 className="font-display text-xl font-bold mb-4 flex items-center gap-2">
                    <XCircle className="h-5 w-5 text-destructive" /> Not Eligible for Return
                  </h2>
                  <ul className="space-y-2">
                    {notEligible.map((item: string, i: number) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <XCircle className="h-4 w-4 text-destructive/70 mt-0.5 shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Exchange & Refund Info */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardContent className="p-6">
                  <h2 className="font-display text-xl font-bold mb-3 flex items-center gap-2">
                    <ArrowRightLeft className="h-5 w-5 text-primary" /> Exchange Policy
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {c.exchange_text || "We offer hassle-free exchanges for different sizes or colors, subject to stock availability. Contact us within 7 days of delivery to arrange an exchange. The exchanged item must be unused with original tags and packaging."}
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-muted/50">
                <CardContent className="p-6">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <Shield className="h-5 w-5 text-primary" /> Refund Information
                  </h3>
                  <ul className="text-sm text-muted-foreground space-y-2">
                    {refundInfo.map((item: string, i: number) => <li key={i} className="flex items-start gap-2"><span className="text-primary mt-0.5">•</span> {item}</li>)}
                  </ul>
                </CardContent>
              </Card>
            </div>
          </motion.div>

          {/* Return Status Checker for logged-in users */}
          {user && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }}>
              <Card className="bg-primary/5 border-primary/20">
                <CardContent className="p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div>
                    <h3 className="font-semibold mb-1">Check Your Return Status</h3>
                    <p className="text-sm text-muted-foreground">View and track your existing return requests in your account.</p>
                  </div>
                  <Button asChild>
                    <Link to="/account/returns">View My Returns <ChevronRight className="h-4 w-4 ml-1" /></Link>
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* FAQ Section */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
            <h2 className="font-display text-2xl font-bold mb-6">Frequently Asked Questions</h2>
            <Accordion type="single" collapsible className="space-y-3">
              {faqs.map((faq: any, i: number) => (
                <AccordionItem key={i} value={`faq-${i}`} className="border rounded-xl px-5 bg-card shadow-sm">
                  <AccordionTrigger className="hover:no-underline text-left">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="text-xs shrink-0">{faq.category}</Badge>
                      <span className="font-medium text-sm">{faq.question}</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <p className="text-sm text-muted-foreground mb-3">{faq.answer}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>Was this helpful?</span>
                      <Button
                        variant={helpfulFaq[i] === true ? "default" : "ghost"}
                        size="sm"
                        className="h-7 w-7 p-0"
                        onClick={() => setHelpfulFaq(prev => ({ ...prev, [i]: true }))}
                      >
                        <ThumbsUp className="h-3 w-3" />
                      </Button>
                      <Button
                        variant={helpfulFaq[i] === false ? "default" : "ghost"}
                        size="sm"
                        className="h-7 w-7 p-0"
                        onClick={() => setHelpfulFaq(prev => ({ ...prev, [i]: false }))}
                      >
                        <ThumbsDown className="h-3 w-3" />
                      </Button>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </motion.div>

          {/* Contact CTA */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}>
            <Card className="bg-gradient-to-r from-primary/10 to-accent/10 border-primary/20">
              <CardContent className="p-8 text-center">
                <h2 className="font-display text-2xl font-bold mb-2">Need Help with a Return?</h2>
                <p className="text-muted-foreground mb-6 max-w-lg mx-auto">
                  Our support team is here to help you with any return or exchange questions.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <Button asChild>
                    <Link to="/contact">
                      <Mail className="h-4 w-4 mr-2" /> Contact Us
                    </Link>
                  </Button>
                  <Button variant="outline" asChild>
                    <a href="tel:+8801XXXXXXXXX">
                      <Phone className="h-4 w-4 mr-2" /> Call Us
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>

        </div>
      </div>
    </>
  );
}
