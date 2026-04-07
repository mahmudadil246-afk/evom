import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Truck, Shield, RefreshCw, Headphones, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

import { SEOHead } from "@/components/SEOHead";
import { useFeaturedProducts } from "@/hooks/useFeaturedProducts";
import { FeaturedProductCard } from "@/components/store/FeaturedProductCard";
import { FeaturedProductsSkeleton } from "@/components/store/FeaturedProductsSkeleton";
import { useSiteContent } from "@/hooks/useSiteContent";
import { HeroCarousel } from "@/components/store/HeroCarousel";
import { CategoryGrid } from "@/components/store/CategoryGrid";
import { NewArrivalsSection } from "@/components/store/NewArrivalsSection";
import { PromoBannerSection } from "@/components/store/PromoBannerSection";
import { FlashSaleSection } from "@/components/store/FlashSaleSection";
import { TestimonialsSection } from "@/components/store/TestimonialsSection";
import { BrandMarquee } from "@/components/store/BrandMarquee";
import { TrendingProductsSection } from "@/components/store/TrendingProductsSection";
import { RecentlyViewedCarousel } from "@/components/store/RecentlyViewedCarousel";
import {
  WaveDivider,
  ZigzagDivider,
  SlantDivider,
  CurveDivider,
  DoubleWaveDivider,
  TiltCurveDivider,
  ScallopDivider,
  ArrowDivider,
} from "@/components/store/SectionDividers";

import { useSiteTitle } from "@/components/DynamicTitleProvider";
import { useLanguage } from "@/contexts/LanguageContext";

const iconMap: Record<string, React.ElementType> = {
  Truck, Shield, RefreshCw, Headphones,
};

export default function StoreHome() {
  const { products, loading: productsLoading, isNewProduct } = useFeaturedProducts(8);
  const { section, loading: cmsLoading } = useSiteContent("homepage");
  const { storeName } = useSiteTitle();
  const { t } = useLanguage();
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [newsletterLoading, setNewsletterLoading] = useState(false);

  const defaultFeatures = [
    { icon: "Truck", title: t('store.freeShipping'), desc: t('store.freeShippingDesc') },
    { icon: "Shield", title: t('store.securePayment'), desc: t('store.securePaymentDesc') },
    { icon: "RefreshCw", title: t('store.easyReturns'), desc: t('store.easyReturnsDesc') },
    { icon: "Headphones", title: t('store.support247'), desc: t('store.support247Desc') },
  ];

  const handleNewsletterSubmit = async () => {
    if (!newsletterEmail || !newsletterEmail.includes("@")) {
      toast.error(t('store.validEmail'));
      return;
    }
    setNewsletterLoading(true);
    try {
      const { error } = await supabase
        .from("newsletter_subscribers")
        .insert({ email: newsletterEmail, source: "homepage" });
      if (error) {
        if (error.code === "23505") {
          toast.info(t('store.alreadySubscribed'));
        } else throw error;
      } else {
        toast.success(t('store.subscribedSuccess'));
        setNewsletterEmail("");
      }
    } catch {
      toast.error(t('store.subscribeFailed'));
    } finally {
      setNewsletterLoading(false);
    }
  };

  const baseUrl = window.location.origin;

  const orgJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: storeName,
    url: baseUrl,
  };

  const websiteJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: storeName,
    url: baseUrl,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${baseUrl}/products?search={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };

  const combinedJsonLd = [orgJsonLd, websiteJsonLd];

  const heroCarousel = section("hero_carousel");
  const featureBar = section("feature_bar");
  const categoriesGrid = section("categories_grid");
  const newArrivals = section("new_arrivals");
  const promoBanners = section("promo_banners");
  const bestSellers = section("best_sellers");
  const flashSale = section("flash_sale");
  const testimonials = section("testimonials");
  const newsletter = section("newsletter");
  const brandMarquee = section("brand_marquee");
  const trendingProducts = section("trending_products");
  const recentlyViewed = section("recently_viewed");

  const features = featureBar?.content?.features || defaultFeatures;

  return (
    <>
      <SEOHead
        description="Shop the latest fashion, clothing and accessories online."
        canonicalPath="/"
        jsonLd={combinedJsonLd}
      />

      {/* 1. Hero Carousel */}
      {heroCarousel?.isEnabled !== false && (
        <HeroCarousel
          autoplay={heroCarousel?.content?.autoplay !== false}
          autoplayDelay={heroCarousel?.content?.autoplay_delay || 5000}
          showArrows={heroCarousel?.content?.show_arrows !== false}
        />
      )}

      <WaveDivider fillClass="fill-store-card" />

      {/* 2. Trust / Features Bar */}
      {featureBar?.isEnabled !== false && (
        <section className="bg-store-card py-5 border-b border-store-muted/50">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {features.map((feature: any) => {
                const FeatureIcon = iconMap[feature.icon] || Truck;
                return (
                  <div key={feature.title} className="flex items-center gap-3 group cursor-default">
                    <div className="w-11 h-11 rounded-full bg-store-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-store-primary/20 transition-colors duration-300 group-hover:animate-[bounce_0.6s_ease-in-out]">
                      <FeatureIcon className="h-5 w-5 text-store-primary group-hover:scale-110 transition-transform duration-300" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground text-sm">{feature.title}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      <ZigzagDivider fillClass="fill-store-background" />

      {/* 3. Brand Logos Marquee */}
      {brandMarquee?.isEnabled !== false && <BrandMarquee />}

      <SlantDivider fillClass="fill-store-background" direction="right" />

      {/* 4. Categories Grid */}
      {categoriesGrid?.isEnabled !== false && (
        <CategoryGrid
          title={categoriesGrid?.title || t('store.shopByCategory')}
          subtitle={categoriesGrid?.subtitle || undefined}
          categories={categoriesGrid?.content?.categories}
        />
      )}

      <CurveDivider fillClass="fill-store-card" />

      {/* 5. New Arrivals */}
      {newArrivals?.isEnabled !== false && (
        <NewArrivalsSection
          title={newArrivals?.title || t('store.newArrivals')}
          subtitle={newArrivals?.subtitle || undefined}
          badge={newArrivals?.badgeText || t('store.new')}
          count={newArrivals?.content?.product_count || 8}
        />
      )}

      <DoubleWaveDivider fillClass="fill-store-background" accentClass="fill-store-primary/5" />

      {/* 6. Promo Banners */}
      {promoBanners?.isEnabled !== false && (
        <PromoBannerSection banners={promoBanners?.content?.banners} />
      )}

      <TiltCurveDivider fillClass="fill-store-background" />

      {/* 7. Trending Products */}
      {trendingProducts?.isEnabled !== false && (
        <TrendingProductsSection count={trendingProducts?.content?.count || 4} />
      )}

      <ScallopDivider fillClass="fill-store-muted" />

      {/* 8. Best Sellers / Featured Products */}
      {bestSellers?.isEnabled !== false && (
        <section className="py-10 bg-store-muted">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
              <div>
                {bestSellers?.badgeText && (
                  <Badge className="bg-store-secondary/15 text-store-secondary border-0 text-xs uppercase tracking-wider mb-2">
                    {bestSellers.badgeText}
                  </Badge>
                )}
                <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground">
                  {bestSellers?.title || t('store.bestSellers')}
                </h2>
                {bestSellers?.subtitle && (
                  <p className="text-muted-foreground mt-1">{bestSellers.subtitle}</p>
                )}
              </div>
              <Button variant="outline" asChild>
                <Link to="/products">
                  {t('store.viewAll')} <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
            {productsLoading ? (
              <FeaturedProductsSkeleton />
            ) : products.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">{t('store.noProductsYet')}</p>
                <Button asChild className="mt-4">
                  <Link to="/products">{t('store.browseAllProducts')}</Link>
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                {products.slice(0, 8).map((product) => (
                  <FeaturedProductCard
                    key={product.id}
                    product={product}
                    isNew={isNewProduct(product.created_at)}
                  />
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      <ArrowDivider fillClass="fill-store-primary" />

      {/* 9. Flash Sale */}
      {flashSale?.isEnabled !== false && (
        <FlashSaleSection
          title={flashSale?.title || t('store.flashSale')}
          subtitle={flashSale?.subtitle || undefined}
          badge={flashSale?.badgeText || `⚡ ${t('store.flashSale')}`}
          endTime={flashSale?.content?.end_time || null}
          count={flashSale?.content?.product_count || 4}
        />
      )}

      <WaveDivider fillClass="fill-store-muted" flip />

      {/* 10. Testimonials */}
      {testimonials?.isEnabled !== false && (
        <TestimonialsSection
          title={testimonials?.title || t('store.whatCustomersSay')}
          subtitle={testimonials?.subtitle || undefined}
          testimonials={testimonials?.content?.testimonials}
        />
      )}

      <SlantDivider fillClass="fill-store-background" direction="left" />

      {/* 11. Recently Viewed */}
      {recentlyViewed?.isEnabled !== false && <RecentlyViewedCarousel />}

      {/* 12. Newsletter */}
      {newsletter?.isEnabled !== false && (
        <section className="relative py-12 md:py-14 overflow-hidden bg-store-background">
          <div className="container mx-auto px-4 relative z-10">
            <div className="relative max-w-4xl mx-auto rounded-3xl overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-store-primary via-store-highlight to-store-secondary" />
              <div className="absolute inset-0 opacity-[0.07]" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")" }} />
              <div className="absolute -top-20 -left-20 w-60 h-60 bg-white/10 rounded-full blur-3xl" />
              <div className="absolute -bottom-20 -right-20 w-60 h-60 bg-store-accent/15 rounded-full blur-3xl" />
              <div className="relative z-10 px-6 py-12 md:px-16 md:py-14 flex flex-col md:flex-row items-center gap-8">
                <div className="flex-1 text-center md:text-left">
                  <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm rounded-full px-3 py-1 mb-4 border border-white/20">
                    <Mail className="h-3.5 w-3.5 text-white" />
                    <span className="text-white/80 text-xs font-medium uppercase tracking-wider">Newsletter</span>
                  </div>
                  <h2 className="font-display text-2xl md:text-3xl font-bold text-white mb-2">
                    {newsletter?.title || "Subscribe Newsletter"}
                  </h2>
                  <p className="text-white/55 text-sm">Get exclusive deals, new arrivals & style tips delivered weekly.</p>
                </div>
                <div className="w-full md:w-auto md:min-w-[340px]">
                  <form
                    onSubmit={(e) => { e.preventDefault(); handleNewsletterSubmit(); }}
                    className="flex rounded-xl overflow-hidden bg-white/10 backdrop-blur-md border border-white/20 p-1.5"
                  >
                    <Input
                      type="email"
                      placeholder={newsletter?.content?.placeholder || t('store.enterYourEmail')}
                      className="flex-1 h-10 border-0 bg-transparent text-white placeholder:text-white/40 focus-visible:ring-0 focus-visible:ring-offset-0 pl-3 text-sm"
                      value={newsletterEmail}
                      onChange={(e) => setNewsletterEmail(e.target.value)}
                      disabled={newsletterLoading}
                    />
                    <Button
                      type="submit"
                      className="h-10 px-5 rounded-lg bg-white text-store-primary hover:bg-white/90 font-semibold text-sm shadow-lg transition-transform hover:scale-[1.02]"
                      disabled={newsletterLoading}
                    >
                      {newsletterLoading ? "..." : newsletter?.content?.button_text || t('store.subscribe')}
                    </Button>
                  </form>
                  <p className="text-white/30 text-[11px] mt-2.5 text-center md:text-left pl-1">Join 5,000+ subscribers · No spam · Unsubscribe anytime</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}
    </>
  );
}
