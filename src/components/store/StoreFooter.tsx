import { Link } from "react-router-dom";
import { Facebook, Instagram, Twitter, Youtube, Mail, Phone, MapPin } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { usePageContent } from "@/hooks/useSiteContent";
import { useStoreSettingsCache } from "@/hooks/useStoreSettingsCache";
import { OptimizedImage } from "@/components/ui/optimized-image";

const defaultShopLinks = [
  { label: "All Products", href: "/products" },
  { label: "New Arrivals", href: "/products?filter=new" },
  { label: "Sale", href: "/products?filter=sale" },
];

const defaultHelpLinks = [
  { label: "Contact Us", href: "/contact" },
  { label: "Track Order", href: "/track-order" },
  { label: "FAQs", href: "/faq" },
  { label: "Shipping Info", href: "/shipping-info" },
  { label: "Returns & Exchange", href: "/returns" },
  { label: "Size Guide", href: "/size-guide" },
];

const paymentIcons = ["bKash", "Nagad", "Visa", "Mastercard", "COD"];

const defaultSocialIconMap: Record<string, React.ComponentType<any>> = {
  facebook: Facebook,
  instagram: Instagram,
  twitter: Twitter,
  youtube: Youtube,
};

function FooterHeading({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="font-display font-semibold text-[hsl(210,40%,98%)] mb-4 relative inline-block">
      {children}
      <span className="absolute -bottom-1 left-0 w-8 h-0.5 bg-store-accent rounded-full" />
    </h3>
  );
}

function SocialIcon({ href, label, logo, children }: { href: string; label: string; logo?: string; children?: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className="w-9 h-9 rounded-full bg-white/10 hover:bg-store-primary hover:shadow-[0_0_12px_hsl(var(--store-primary)/0.5)] flex items-center justify-center transition-all duration-300"
    >
      {logo ? (
        <img src={logo} alt={label} className="h-4 w-4 object-contain" />
      ) : (
        children
      )}
    </a>
  );
}

export function StoreFooter() {
  const { data: settings } = useStoreSettingsCache();
  const { data: footerContent } = usePageContent("footer");
  const content = (footerContent?.content as any) || {};

  const { data: headerContent } = usePageContent("header");
  const headerCont = (headerContent?.content as any) || {};
  const storeName = headerCont.store_name || content.store_name || "";
  const storeLogo = headerCont.store_logo || null;
  const storeDescription = content.store_description || settings?.STORE_DESCRIPTION || "Quality products at affordable prices.";
  const storeEmail = content.store_email || settings?.STORE_EMAIL || "";
  const storePhone = content.store_phone || settings?.STORE_PHONE || "";

  const addressParts = [
    content.store_address || settings?.STORE_ADDRESS,
    content.store_city || settings?.STORE_CITY,
    content.store_postal_code || settings?.STORE_POSTAL_CODE,
  ].filter(Boolean);
  const storeAddress = addressParts.length > 0 ? addressParts.join(", ") : "";

  const socialLinksArr: { label: string; href: string; logo?: string }[] = content.social_links || [];
  const hasSocial = socialLinksArr.length > 0;

  const shopLinks = (content.shop_links?.length ? content.shop_links : null) || defaultShopLinks;
  const helpLinks = (content.help_links?.length ? content.help_links : null) || defaultHelpLinks;
  const copyrightText = content.copyright_text || "All rights reserved.";

  return (
    <footer className="bg-[hsl(222,47%,11%)] dark:bg-[hsl(224,30%,5%)] text-[hsl(210,40%,98%)]">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            {(storeLogo || storeName) && (
              <Link to="/" className="flex items-center gap-2 mb-4">
                {storeLogo && (
                  <OptimizedImage src={storeLogo} alt={storeName} className="w-10 h-10 rounded-full object-cover border-2 border-store-primary/20" />
                )}
                {storeName && (
                  <span className="font-display font-bold text-xl text-[hsl(210,40%,98%)]">{storeName}</span>
                )}
              </Link>
            )}
            <p className="text-[hsl(215,16%,60%)] text-sm mb-4">{storeDescription}</p>
            <div className="flex gap-3">
              {hasSocial ? (
                socialLinksArr.map((link, i) => {
                  const FallbackIcon = defaultSocialIconMap[link.label?.toLowerCase()] || Facebook;
                  return (
                    <SocialIcon key={i} href={link.href} label={link.label} logo={link.logo}>
                      <FallbackIcon className="h-4 w-4" />
                    </SocialIcon>
                  );
                })
              ) : (
                <>
                  <span className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center"><Facebook className="h-4 w-4 opacity-50" /></span>
                  <span className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center"><Instagram className="h-4 w-4 opacity-50" /></span>
                  <span className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center"><Twitter className="h-4 w-4 opacity-50" /></span>
                  <span className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center"><Youtube className="h-4 w-4 opacity-50" /></span>
                </>
              )}
            </div>
          </div>

          {/* Shop Links */}
          <div>
            <FooterHeading>Shop</FooterHeading>
            <ul className="space-y-2 text-sm mt-2">
              {shopLinks.map((link: any, i: number) => (
                <li key={i}>
                  <Link to={link.href || link.url || "#"} className="group text-[hsl(215,16%,60%)] hover:text-store-accent transition-colors inline-flex items-center gap-1">
                    <span className="w-0 group-hover:w-2 overflow-hidden transition-all duration-200 text-store-accent">→</span>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Help Links */}
          <div>
            <FooterHeading>Help Center</FooterHeading>
            <ul className="space-y-2 text-sm mt-2">
              {helpLinks.map((link: any, i: number) => (
                <li key={i}>
                  <Link to={link.href || link.url || "#"} className="group text-[hsl(215,16%,60%)] hover:text-store-accent transition-colors inline-flex items-center gap-1">
                    <span className="w-0 group-hover:w-2 overflow-hidden transition-all duration-200 text-store-accent">→</span>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <FooterHeading>Contact Us</FooterHeading>
            <ul className="space-y-3 text-sm mt-2">
              {storeAddress && (
                <li className="flex items-start gap-2 text-[hsl(215,16%,60%)]">
                  <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0 text-store-accent/60" aria-hidden="true" />
                  <span>{storeAddress}</span>
                </li>
              )}
              {storePhone && (
                <li className="flex items-center gap-2 text-[hsl(215,16%,60%)]">
                  <Phone className="h-4 w-4 flex-shrink-0 text-store-accent/60" aria-hidden="true" />
                  <span>{storePhone}</span>
                </li>
              )}
              {storeEmail && (
                <li className="flex items-center gap-2 text-[hsl(215,16%,60%)]">
                  <Mail className="h-4 w-4 flex-shrink-0 text-store-accent/60" aria-hidden="true" />
                  <span>{storeEmail}</span>
                </li>
              )}
            </ul>
          </div>
        </div>

        <Separator className="my-8 bg-white/10" />

        {/* Payment Methods */}
        <div className="flex flex-wrap items-center justify-center gap-3 mb-6">
          <span className="text-xs text-[hsl(215,16%,50%)] mr-2">We Accept:</span>
          {paymentIcons.map((name) => (
            <span key={name} className="px-3 py-1.5 rounded-md bg-white/5 border border-white/10 text-xs font-medium text-[hsl(210,40%,80%)]">
              {name}
            </span>
          ))}
        </div>

        {/* Bottom Bar */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-[hsl(215,16%,60%)]">
          <p>© {new Date().getFullYear()} {storeName}. {copyrightText}</p>
          <div className="flex items-center gap-6">
            <Link to="/privacy" className="hover:text-store-accent transition-colors">Privacy Policy</Link>
            <Link to="/terms" className="hover:text-store-accent transition-colors">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
