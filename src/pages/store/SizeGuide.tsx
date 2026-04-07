
import { useState } from "react";
import { SEOHead } from "@/components/SEOHead";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Ruler, Info, ArrowRightLeft, Mail, Phone, ThumbsUp, ThumbsDown, Calculator } from "lucide-react";
import { usePageContent } from "@/hooks/useSiteContent";
import { Skeleton } from "@/components/ui/skeleton";
import { useLanguage } from "@/contexts/LanguageContext";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";


function getSizeRecommendation(heightCm: number, weightKg: number, gender: string): string {
  if (!heightCm || !weightKg) return "";
  const bmi = weightKg / ((heightCm / 100) ** 2);
  if (gender === "men") {
    if (bmi < 20) return "S";
    if (bmi < 23) return heightCm < 170 ? "M" : "L";
    if (bmi < 26) return heightCm < 175 ? "L" : "XL";
    return "XXL";
  } else {
    if (bmi < 19) return "S";
    if (bmi < 22) return heightCm < 160 ? "M" : "L";
    if (bmi < 25) return heightCm < 165 ? "L" : "XL";
    return "XXL";
  }
}

export default function SizeGuide() {
  const { t } = useLanguage();
  const { data, loading } = usePageContent("size-guide");
  const [unit, setUnit] = useState<"inch" | "cm">("inch");
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [recGender, setRecGender] = useState<"men" | "women">("men");
  const [helpfulFaq, setHelpfulFaq] = useState<Record<number, boolean | null>>({});

  const title = data?.title || "Size Guide";
  const subtitle = data?.subtitle || "Find your perfect fit with our comprehensive size charts and measurement guide.";
  const c = (data?.content || {}) as any;

  const mensSizes = c.mens_sizes || [];
  const womensSizes = c.womens_sizes || [];
  const howToMeasure = c.how_to_measure || [];
  const tips = c.tips || [];
  const faqs = c.faqs || [];

  const recommendation = getSizeRecommendation(Number(height), Number(weight), recGender);

  const getMensValue = (row: any, field: string) => {
    if (unit === "cm") return row[`${field}_cm`] || row[field];
    return row[field];
  };
  const getWomensValue = (row: any, field: string) => {
    if (unit === "cm") return row[`${field}_cm`] || row[field];
    return row[field];
  };

  if (loading) {
    return <div className="container mx-auto px-4 py-12"><Skeleton className="h-10 w-48 mx-auto" /></div>;
  }

  return (
    <>
      <SEOHead title="Size Guide" description="Find your perfect fit with our size chart for men and women. Measurement guide included." canonicalPath="/size-guide" />

      {/* Hero Banner */}
      <section className="relative bg-gradient-to-br from-primary/10 via-accent/5 to-secondary/10 overflow-hidden">
        <div className="absolute top-10 left-10 w-32 h-32 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-10 w-40 h-40 bg-accent/10 rounded-full blur-3xl" />
        <div className="container mx-auto px-4 py-16 text-center relative z-10">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <Badge variant="secondary" className="mb-4">Size Guide</Badge>
            <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-3">{title}</h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">{subtitle}</p>
          </motion.div>
        </div>
        <svg className="w-full text-background" viewBox="0 0 1440 60" fill="currentColor" preserveAspectRatio="none"><path d="M0,60 L0,20 Q360,0 720,20 Q1080,40 1440,20 L1440,60 Z" /></svg>
      </section>

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto space-y-12">

          {/* Unit Toggle + Size Charts */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display text-2xl font-bold flex items-center gap-2">
                <Ruler className="h-6 w-6 text-primary" /> Size Charts
              </h2>
              <div className="flex items-center gap-2 bg-muted rounded-lg p-1">
                <Button variant={unit === "inch" ? "default" : "ghost"} size="sm" onClick={() => setUnit("inch")} className="h-8">
                  Inches
                </Button>
                <Button variant={unit === "cm" ? "default" : "ghost"} size="sm" onClick={() => setUnit("cm")} className="h-8">
                  CM
                </Button>
              </div>
            </div>

            <Tabs defaultValue="men" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="men">Men's Sizes</TabsTrigger>
                <TabsTrigger value="women">Women's Sizes</TabsTrigger>
              </TabsList>

              <TabsContent value="men">
                <Card>
                  <CardContent className="p-0 md:p-2">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="font-bold">Size</TableHead>
                          <TableHead>Chest ({unit === "cm" ? "cm" : "in"})</TableHead>
                          <TableHead>Waist ({unit === "cm" ? "cm" : "in"})</TableHead>
                          <TableHead>Hip ({unit === "cm" ? "cm" : "in"})</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {mensSizes.map((row: any) => (
                          <TableRow key={row.size} className="hover:bg-muted/50">
                            <TableCell className="font-bold"><Badge variant="outline">{row.size}</Badge></TableCell>
                            <TableCell>{getMensValue(row, "chest")}</TableCell>
                            <TableCell>{getMensValue(row, "waist")}</TableCell>
                            <TableCell>{getMensValue(row, "hip")}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="women">
                <Card>
                  <CardContent className="p-0 md:p-2">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="font-bold">Size</TableHead>
                          <TableHead>Bust ({unit === "cm" ? "cm" : "in"})</TableHead>
                          <TableHead>Waist ({unit === "cm" ? "cm" : "in"})</TableHead>
                          <TableHead>Hip ({unit === "cm" ? "cm" : "in"})</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {womensSizes.map((row: any) => (
                          <TableRow key={row.size} className="hover:bg-muted/50">
                            <TableCell className="font-bold"><Badge variant="outline">{row.size}</Badge></TableCell>
                            <TableCell>{getWomensValue(row, "bust")}</TableCell>
                            <TableCell>{getWomensValue(row, "waist")}</TableCell>
                            <TableCell>{getWomensValue(row, "hip")}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </motion.div>

          {/* Size Recommendation Tool */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="p-6">
                <h2 className="font-display text-xl font-bold mb-4 flex items-center gap-2">
                  <Calculator className="h-5 w-5 text-primary" /> Size Recommendation Tool
                </h2>
                <p className="text-sm text-muted-foreground mb-4">Enter your height and weight to get a recommended size.</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                  <div>
                    <label className="text-sm font-medium mb-1 block">Height (cm)</label>
                    <Input type="number" placeholder="e.g. 170" value={height} onChange={e => setHeight(e.target.value)} />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Weight (kg)</label>
                    <Input type="number" placeholder="e.g. 70" value={weight} onChange={e => setWeight(e.target.value)} />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Category</label>
                    <div className="flex gap-2 mt-1">
                      <Button variant={recGender === "men" ? "default" : "outline"} size="sm" onClick={() => setRecGender("men")} className="flex-1">Men</Button>
                      <Button variant={recGender === "women" ? "default" : "outline"} size="sm" onClick={() => setRecGender("women")} className="flex-1">Women</Button>
                    </div>
                  </div>
                </div>
                {recommendation && (
                  <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-background rounded-lg p-4 text-center border">
                    <p className="text-sm text-muted-foreground mb-1">Recommended Size</p>
                    <p className="text-3xl font-bold text-primary">{recommendation}</p>
                    <p className="text-xs text-muted-foreground mt-1">This is an estimate. We recommend measuring yourself for the best fit.</p>
                  </motion.div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* How to Measure */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <h2 className="font-display text-2xl font-bold mb-6 flex items-center gap-2">
              <Ruler className="h-6 w-6 text-primary" /> How to Measure
            </h2>
            <div className="grid md:grid-cols-3 gap-6">
              {howToMeasure.map((item: any, i: number) => (
                <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 + i * 0.05 }}>
                  <Card className="h-full hover:shadow-md transition-shadow">
                    <CardContent className="p-6 text-center">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                        <Ruler className="h-6 w-6 text-primary" />
                      </div>
                      <h3 className="font-semibold mb-2">{item.title}</h3>
                      <p className="text-sm text-muted-foreground">{item.text}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Sizing Tips */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}>
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="p-6">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Info className="h-5 w-5 text-primary" /> Sizing Tips
                </h3>
                <ul className="text-sm text-muted-foreground space-y-2">
                  {tips.map((tip: string, i: number) => (
                    <li key={i} className="flex items-start gap-2"><span className="text-primary mt-0.5">•</span> {tip}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </motion.div>

          {/* FAQ Section */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
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
                      <Button variant={helpfulFaq[i] === true ? "default" : "ghost"} size="sm" className="h-7 w-7 p-0" onClick={() => setHelpfulFaq(prev => ({ ...prev, [i]: true }))}>
                        <ThumbsUp className="h-3 w-3" />
                      </Button>
                      <Button variant={helpfulFaq[i] === false ? "default" : "ghost"} size="sm" className="h-7 w-7 p-0" onClick={() => setHelpfulFaq(prev => ({ ...prev, [i]: false }))}>
                        <ThumbsDown className="h-3 w-3" />
                      </Button>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </motion.div>

          {/* Still Unsure CTA */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
            <Card className="bg-gradient-to-r from-primary/10 to-accent/10 border-primary/20">
              <CardContent className="p-8 text-center">
                <h2 className="font-display text-2xl font-bold mb-2">Still Unsure About Your Size?</h2>
                <p className="text-muted-foreground mb-6 max-w-lg mx-auto">
                  Our team is happy to help you find the perfect fit. Reach out to us anytime!
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <Button asChild>
                    <Link to="/contact"><Mail className="h-4 w-4 mr-2" /> Contact Us</Link>
                  </Button>
                  <Button variant="outline" asChild>
                    <Link to="/returns"><ArrowRightLeft className="h-4 w-4 mr-2" /> Exchange Policy</Link>
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
