
import { useState } from "react";
import { SEOHead } from "@/components/SEOHead";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { usePageContent } from "@/hooks/useSiteContent";
import { useLanguage } from "@/contexts/LanguageContext";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, Package, CreditCard, Truck, RotateCcw, HelpCircle,
  Ruler, UserCircle, ThumbsUp, ThumbsDown, MessageCircle,
  ChevronDown, ChevronUp, X,
} from "lucide-react";

type FaqCategory = "all" | "orders" | "payment" | "shipping" | "returns" | "account" | "general";

interface FaqItem {
  question: string;
  answer: string;
  category: FaqCategory;
}

function normalizeFaqItem(raw: any): FaqItem {
  return {
    question: raw.question ?? raw.q ?? "",
    answer: raw.answer ?? raw.a ?? "",
    category: raw.category ?? "general",
  };
}

const categoryConfig: Record<Exclude<FaqCategory, "all">, { label: string; icon: React.ElementType; color: string }> = {
  orders: { label: "Orders", icon: Package, color: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300" },
  payment: { label: "Payment", icon: CreditCard, color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300" },
  shipping: { label: "Shipping", icon: Truck, color: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300" },
  returns: { label: "Returns", icon: RotateCcw, color: "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300" },
  account: { label: "Account", icon: UserCircle, color: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300" },
  general: { label: "General", icon: HelpCircle, color: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300" },
};

export default function FAQ() {
  const { data, loading } = usePageContent("faq");
  const { t } = useLanguage();
  const title = data?.title || t("store.faqTitle");
  const subtitle = data?.subtitle || t("store.faqSubtitle");
  const faqs: FaqItem[] = ((data?.content as any)?.faqs || []).map(normalizeFaqItem);

  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<FaqCategory>("all");
  const [openItems, setOpenItems] = useState<string[]>([]);
  const [helpfulMap, setHelpfulMap] = useState<Record<number, "yes" | "no">>({});

  const filtered = faqs.filter((faq) => {
    const matchesCategory = activeCategory === "all" || faq.category === activeCategory;
    const matchesSearch =
      !search ||
      faq.question.toLowerCase().includes(search.toLowerCase()) ||
      faq.answer.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const allExpanded = filtered.length > 0 && openItems.length === filtered.length;

  const toggleAll = () => {
    if (allExpanded) {
      setOpenItems([]);
    } else {
      setOpenItems(filtered.map((_, i) => `item-${i}`));
    }
  };

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: { "@type": "Answer", text: faq.answer },
    })),
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12 space-y-4">
        <Skeleton className="h-10 w-64 mx-auto" />
        <Skeleton className="h-6 w-96 mx-auto" />
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-14 w-full max-w-3xl mx-auto" />
        ))}
      </div>
    );
  }

  return (
    <>
      <SEOHead title="FAQ" description={subtitle} canonicalPath="/faq" jsonLd={faqJsonLd} />

      {/* Hero Banner */}
      <div className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-accent/30 to-secondary/20 py-14 md:py-20">
        <div className="absolute top-6 left-10 w-48 h-48 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-4 right-16 w-64 h-64 bg-accent/15 rounded-full blur-3xl" />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="container mx-auto px-4 text-center relative z-10"
        >
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary rounded-full px-4 py-1.5 text-sm font-medium mb-4">
            <HelpCircle className="h-4 w-4" />
            Help Center
          </div>
          <h1 className="font-display text-3xl md:text-5xl font-bold mb-3">{title}</h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">{subtitle}</p>
        </motion.div>
      </div>

      <div className="container mx-auto px-4 py-10">
        {/* Search */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="max-w-2xl mx-auto mb-8"
        >
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-muted-foreground" />
            <Input
              placeholder="Search questions..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 pr-10 h-12 text-base rounded-xl border-muted-foreground/20 bg-background shadow-sm"
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </motion.div>

        {/* Category Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex flex-wrap justify-center gap-2 mb-8"
        >
          <Badge
            variant={activeCategory === "all" ? "default" : "outline"}
            className="cursor-pointer px-4 py-1.5 text-sm transition-all hover:scale-105"
            onClick={() => setActiveCategory("all")}
          >
            All
          </Badge>
          {(Object.entries(categoryConfig) as [Exclude<FaqCategory, "all">, typeof categoryConfig[keyof typeof categoryConfig]][]).map(([key, cfg]) => {
            const Icon = cfg.icon;
            return (
              <Badge
                key={key}
                variant={activeCategory === key ? "default" : "outline"}
                className="cursor-pointer px-4 py-1.5 text-sm gap-1.5 transition-all hover:scale-105"
                onClick={() => setActiveCategory(key)}
              >
                <Icon className="h-3.5 w-3.5" />
                {cfg.label}
              </Badge>
            );
          })}
        </motion.div>

        {/* Expand/Collapse All */}
        <div className="max-w-3xl mx-auto flex justify-end mb-3">
          <Button variant="ghost" size="sm" onClick={toggleAll} className="gap-1.5 text-muted-foreground">
            {allExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            {allExpanded ? "Collapse All" : "Expand All"}
          </Button>
        </div>

        {/* FAQ Accordion */}
        <div className="max-w-3xl mx-auto">
          <AnimatePresence mode="wait">
            {filtered.length === 0 ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center py-16"
              >
                <Search className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
                <p className="text-lg font-medium text-muted-foreground">No matching questions found</p>
                <p className="text-sm text-muted-foreground/70 mt-1">Try a different search term or category</p>
                <Button variant="outline" className="mt-4" onClick={() => { setSearch(""); setActiveCategory("all"); }}>
                  Clear Filters
                </Button>
              </motion.div>
            ) : (
              <Accordion
                type="multiple"
                value={openItems}
                onValueChange={setOpenItems}
                className="space-y-3"
              >
                {filtered.map((faq, index) => {
                  const cat = categoryConfig[faq.category] || categoryConfig.general;
                  const Icon = cat.icon;
                  return (
                    <motion.div
                      key={`${activeCategory}-${index}`}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.04 }}
                    >
                      <AccordionItem
                        value={`item-${index}`}
                        className="border rounded-xl px-5 bg-card shadow-sm hover:shadow-md transition-shadow"
                      >
                        <AccordionTrigger className="text-left gap-3 py-4 hover:no-underline">
                          <div className="flex items-center gap-3 flex-1">
                            <span className={`p-1.5 rounded-lg ${cat.color}`}>
                              <Icon className="h-4 w-4" />
                            </span>
                            <span className="font-medium">{faq.question}</span>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="text-muted-foreground pb-4">
                          <p className="pl-10">{faq.answer}</p>
                          <div className="pl-10 mt-3 flex items-center gap-3">
                            <span className="text-xs text-muted-foreground/70">Was this helpful?</span>
                            <button
                              onClick={() => setHelpfulMap((m) => ({ ...m, [index]: "yes" }))}
                              className={`p-1 rounded hover:bg-accent transition-colors ${helpfulMap[index] === "yes" ? "text-green-600" : "text-muted-foreground/50"}`}
                            >
                              <ThumbsUp className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => setHelpfulMap((m) => ({ ...m, [index]: "no" }))}
                              className={`p-1 rounded hover:bg-accent transition-colors ${helpfulMap[index] === "no" ? "text-red-500" : "text-muted-foreground/50"}`}
                            >
                              <ThumbsDown className="h-3.5 w-3.5" />
                            </button>
                            {helpfulMap[index] && (
                              <span className="text-xs text-muted-foreground/60">Thanks for your feedback!</span>
                            )}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    </motion.div>
                  );
                })}
              </Accordion>
            )}
          </AnimatePresence>
        </div>

        {/* Contact CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="max-w-3xl mx-auto mt-14 text-center"
        >
          <div className="bg-gradient-to-br from-primary/5 via-accent/10 to-secondary/5 rounded-2xl p-8 md:p-12 border border-border/50">
            <MessageCircle className="h-10 w-10 text-primary mx-auto mb-4" />
            <h2 className="text-xl md:text-2xl font-bold mb-2">Still have questions?</h2>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Can't find what you're looking for? Our support team is here to help.
            </p>
            <Button asChild size="lg" className="rounded-xl">
              <Link to="/contact">Contact Us</Link>
            </Button>
          </div>
        </motion.div>
      </div>
    </>
  );
}
