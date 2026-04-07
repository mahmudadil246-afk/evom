import { useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ShoppingBag, Search, Menu, User, Heart, LogOut, LayoutDashboard, X } from "lucide-react";

import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { useWishlist } from "@/contexts/WishlistContext";
import { CartDrawer } from "./CartDrawer";
import { ThemeToggle } from "@/components/ThemeToggle";

import { MegaMenuNav, MobileMegaMenu, useDynamicCategories } from "./MegaMenuNav";
import { usePageContent, useSiteContent } from "@/hooks/useSiteContent";
import { useStoreSettingsCache } from "@/hooks/useStoreSettingsCache";
import { OptimizedImage } from "@/components/ui/optimized-image";
import { SearchSuggestions } from "./SearchSuggestions";

export function StoreHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchCategory, setSearchCategory] = useState("all");
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const { data: settings } = useStoreSettingsCache();
  const { data: headerContent } = usePageContent("header");
  const { section: getAnnouncementSection } = useSiteContent("homepage");
  const { itemCount, setIsOpen: setCartOpen } = useCart();
  const { itemCount: wishlistCount } = useWishlist();
  const { user, role, signOut } = useAuth();
  const navigate = useNavigate();
  const { navCategories } = useDynamicCategories();
  const { t } = useLanguage();

  const headerCont = (headerContent?.content as any) || {};
  const storeName = headerCont.store_name || "";
  const storeLogo = headerCont.store_logo || null;

  // Announcement Bar from Content Manager (homepage > announcement section)
  const announcementSection = getAnnouncementSection("announcement");
  const announcementEnabled = announcementSection?.isEnabled ?? false;
  const announcementText = announcementSection?.title || "";
  const announcementLink = announcementSection?.content?.link || "";
  const announcementLinkText = announcementSection?.content?.link_text || "";

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const handleSearch = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!searchQuery.trim()) return;
    const params = new URLSearchParams({ search: searchQuery.trim() });
    if (searchCategory && searchCategory !== "all") {
      params.set("category", searchCategory);
    }
    navigate(`/products?${params.toString()}`);
  };

  return (
    <header className="sticky top-0 z-50 bg-store-card/95 backdrop-blur-md border-b border-store-muted">
      {/* Top Banner — Announcement Bar from Content Manager */}
      {announcementEnabled && announcementText && !bannerDismissed && (
        <div className="bg-gradient-to-r from-store-primary via-store-secondary to-store-accent text-store-primary-foreground py-2 text-center text-sm font-medium relative">
          {announcementLink ? (
            <Link to={announcementLink} className="hover:underline">
              {announcementText}
            </Link>
          ) : (
            <span>{announcementText}</span>
          )}
          <button
            onClick={() => setBannerDismissed(true)}
            className="absolute right-3 top-1/2 -translate-y-1/2 hover:opacity-70 transition-opacity"
            aria-label="Close banner"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <div className="container mx-auto px-4">
        {/* Main Row: Logo — Search — Icons */}
        <div className="flex items-center justify-between h-16 md:h-20 gap-3">
          {/* Mobile Menu */}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild className="lg:hidden">
              <Button variant="ghost" size="icon" className="shrink-0" aria-label="Open menu">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-80 overflow-y-auto">
              <div className="mt-6 mb-4">
                <Link to="/" onClick={() => setMobileMenuOpen(false)}>
                  <span className="font-display font-bold text-xl bg-gradient-to-r from-store-primary to-store-secondary bg-clip-text text-transparent">
                    {storeName}
                  </span>
                </Link>
              </div>
              <MobileMegaMenu onClose={() => setMobileMenuOpen(false)} />
            </SheetContent>
          </Sheet>

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 shrink-0">
            {storeLogo && (
              <OptimizedImage
                src={storeLogo}
                alt={storeName}
                className="h-10 w-10 md:h-12 md:w-12 rounded-full object-cover border-2 border-store-primary/20"
              />
            )}
            {storeName && (
              <span className="hidden sm:inline font-display font-bold text-xl md:text-2xl bg-gradient-to-r from-store-primary to-store-secondary bg-clip-text text-transparent">
                {storeName}
              </span>
            )}
          </Link>

          {/* Center Search Bar — Desktop */}
          <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-2xl mx-4 relative">
            <div className="flex w-full rounded-full border-2 border-store-primary/30 overflow-hidden bg-background shadow-sm hover:shadow-md hover:border-store-primary/50 transition-all">
              <Input
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setSearchFocused(true)}
                className="flex-1 border-0 focus-visible:ring-0 focus-visible:ring-offset-0 rounded-none bg-transparent pl-5"
              />
              <Select value={searchCategory} onValueChange={setSearchCategory}>
                <SelectTrigger className="w-[160px] border-0 border-l border-store-muted/40 rounded-none focus:ring-0 focus:ring-offset-0 bg-store-muted/20 text-sm">
                  <SelectValue placeholder={t('store.allCategories')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('store.allCategories')}</SelectItem>
                  {navCategories.map((cat) => (
                    <SelectItem key={cat.slug} value={cat.slug}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                type="submit"
                size="icon"
                className="rounded-none rounded-r-full bg-store-primary hover:bg-store-primary/90 text-store-primary-foreground shrink-0 w-12"
              >
                <Search className="h-5 w-5" />
                <span className="sr-only">Search</span>
              </Button>
            </div>
            <SearchSuggestions
              query={searchQuery}
              visible={searchFocused}
              onClose={() => setSearchFocused(false)}
              onSelect={(q) => {
                const params = new URLSearchParams({ search: q });
                navigate(`/products?${params.toString()}`);
              }}
            />
          </form>

          {/* Actions */}
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            <ThemeToggle />

            {/* Mobile Search */}
            <Button variant="ghost" size="icon" className="md:hidden" onClick={() => navigate('/products')} aria-label="Search products">
              <Search className="h-5 w-5" />
            </Button>

            {/* Wishlist */}
            <Button variant="ghost" size="icon" className="hidden md:flex relative" onClick={() => navigate('/wishlist')} aria-label="Wishlist">
              <Heart className="h-5 w-5" />
              {wishlistCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-store-primary text-store-primary-foreground text-xs font-bold rounded-full flex items-center justify-center">
                  {wishlistCount > 99 ? '99+' : wishlistCount}
                </span>
              )}
            </Button>

            {/* Account */}
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" aria-label="Account menu">
                    <User className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  {(role === 'admin' || role === 'manager' || role === 'support') && (
                    <>
                      <DropdownMenuItem onClick={() => navigate(
                        role === 'admin' ? '/admin/dashboard' :
                        role === 'manager' ? '/manager/dashboard' : '/support/dashboard'
                      )}>
                        <LayoutDashboard className="mr-2 h-4 w-4" />
                        {t('store.dashboard')}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                    </>
                  )}
                  <DropdownMenuItem onClick={() => navigate('/myaccount')}>
                    <User className="mr-2 h-4 w-4" />
                    {t('store.myAccount')}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/myaccount/orders')}>
                    <ShoppingBag className="mr-2 h-4 w-4" />
                    {t('store.myOrders')}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
                    <LogOut className="mr-2 h-4 w-4" />
                    {t('logout')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button variant="ghost" size="icon" onClick={() => navigate('/login')} aria-label="Sign in">
                <User className="h-5 w-5" />
              </Button>
            )}

            {/* Cart */}
            <Button variant="ghost" size="icon" className="relative" onClick={() => setCartOpen(true)} aria-label="Shopping cart">
              <ShoppingBag className="h-5 w-5" />
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-store-secondary text-store-primary-foreground text-xs font-bold rounded-full flex items-center justify-center">
                  {itemCount > 99 ? '99+' : itemCount}
                </span>
              )}
            </Button>
          </div>
        </div>

        {/* Second Row: MegaMenu Nav — Desktop */}
        <div className="hidden lg:block border-t border-store-muted/50">
          <MegaMenuNav />
        </div>
      </div>

      {/* Mobile Search Bar */}
      <div className="md:hidden px-4 pb-3">
        <form onSubmit={handleSearch} className="flex rounded-lg border border-store-muted overflow-hidden bg-background">
          <Input
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            className="flex-1 border-0 focus-visible:ring-0 focus-visible:ring-offset-0 rounded-none h-9 text-sm"
          />
          <Button
            type="submit"
            size="icon"
            className="rounded-none bg-store-primary hover:bg-store-primary/90 text-store-primary-foreground shrink-0 h-9 w-9"
          >
            <Search className="h-4 w-4" />
          </Button>
        </form>
      </div>

      <CartDrawer />
    </header>
  );
}
