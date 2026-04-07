import { useState } from "react";
import {
  LayoutDashboard, Package, Heart, ShoppingBag, Clock, MapPin, Shield,
  HelpCircle, LogOut, ChevronsLeft, ChevronsRight, Store, X,
  RotateCcw, Star, MessageCircle, ChevronDown, Bell, KeyRound, User, Settings, CreditCard,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { NavLink } from "@/components/NavLink";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { usePageContent } from "@/hooks/useSiteContent";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface AccountSidebarProps {
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  avatarUrl?: string | null;
  fullName?: string;
  email?: string;
  onCloseMobile?: () => void;
}

interface MenuItem {
  titleKey: string;
  url: string;
  icon: React.ElementType;
  end?: boolean;
  badge?: number;
}

interface MenuGroup {
  labelKey: string;
  groupKey: string;
  items: MenuItem[];
}

export function AccountSidebar({ collapsed = false, onToggleCollapse, onCloseMobile }: AccountSidebarProps) {
  const { signOut } = useAuth();
  const { t } = useLanguage();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const { data: headerContent } = usePageContent("header");
  const headerCont = (headerContent?.content as any) || {};
  const storeLogo = headerCont.store_logo || null;
  const storeName = headerCont.store_name || '';

  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    overview: true,
    orders: true,
    shopping: true,
    account: true,
    help: true,
  });

  const toggleGroup = (key: string) => {
    setOpenGroups(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleLogout = async () => {
    await signOut();
    toast({ title: "Signed Out", description: "You have been signed out successfully." });
    navigate("/");
  };

  const menuGroups: MenuGroup[] = [
    {
      labelKey: "account.overview",
      groupKey: "overview",
      items: [
        { titleKey: "account.dashboard", url: "/myaccount", icon: LayoutDashboard, end: true },
        
      ],
    },
    {
      labelKey: "account.orders",
      groupKey: "orders",
      items: [
        { titleKey: "account.myOrders", url: "/myaccount/orders", icon: Package },
        { titleKey: "account.returns", url: "/myaccount/returns", icon: RotateCcw },
      ],
    },
    {
      labelKey: "account.shopping",
      groupKey: "shopping",
      items: [
        { titleKey: "account.wishlist", url: "/myaccount/wishlist", icon: Heart },
        { titleKey: "account.shoppingLink", url: "/myaccount/shopping", icon: ShoppingBag },
        { titleKey: "account.recentlyViewed", url: "/myaccount/recently-viewed", icon: Clock },
        { titleKey: "account.myReviews", url: "/myaccount/reviews", icon: Star },
      ],
    },
    {
      labelKey: "account.settings",
      groupKey: "account",
      items: [
        { titleKey: "account.personalInfo", url: "/myaccount/personal-info", icon: User },
        { titleKey: "account.password", url: "/myaccount/password", icon: KeyRound },
        { titleKey: "account.addresses", url: "/myaccount/addresses", icon: MapPin },
        { titleKey: "account.security", url: "/myaccount/security", icon: Shield },
        
        { titleKey: "account.notificationPreferences", url: "/myaccount/notification-preferences", icon: Bell },
      ],
    },
    {
      labelKey: "account.help",
      groupKey: "help",
      items: [
        { titleKey: "account.support", url: "/myaccount/support", icon: HelpCircle },
        { titleKey: "account.liveChat", url: "/myaccount/chat", icon: MessageCircle },
      ],
    },
  ];

  const renderNavItem = (item: MenuItem) => {
    const title = t(item.titleKey);
    const showBadge = (item.badge || 0) > 0;

    const linkContent = (
      <NavLink
        key={item.url}
        to={item.url}
        end={item.end}
        className={cn(
          "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-muted transition-all hover:bg-sidebar-accent hover:text-sidebar-foreground relative",
          collapsed && "justify-center px-2"
        )}
        activeClassName="bg-sidebar-accent text-sidebar-foreground"
      >
        <item.icon className="h-5 w-5 shrink-0" />
        {!collapsed && <span>{title}</span>}
        {!collapsed && showBadge && (
          <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px] font-bold px-1">
            {item.badge}
          </span>
        )}
        {collapsed && showBadge && (
          <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-primary" />
        )}
      </NavLink>
    );

    if (collapsed) {
      return (
        <Tooltip key={item.url} delayDuration={0}>
          <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
          <TooltipContent side="right" className="font-medium">{title}</TooltipContent>
        </Tooltip>
      );
    }
    return linkContent;
  };

  return (
    <aside className="h-full w-full bg-sidebar border-r border-sidebar-border">
      <div className="flex h-full flex-col px-3 py-6">
        {/* Logo / Brand */}
        <div className={cn("mb-6 flex items-center gap-3 px-2 shrink-0", collapsed && "justify-center px-0")}>
          {storeLogo ? (
            <img src={storeLogo} alt={storeName} className="h-10 w-10 rounded-lg object-contain shrink-0" />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sidebar-primary shrink-0">
              <span className="font-display text-lg font-bold text-sidebar-primary-foreground">
                {storeName.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <h1 className="font-display text-lg font-bold text-sidebar-foreground">{storeName}</h1>
              <p className="text-xs text-sidebar-muted">My Account</p>
            </div>
          )}
          {onCloseMobile && !collapsed && (
            <Button variant="ghost" size="icon" className="lg:hidden h-8 w-8 text-sidebar-muted hover:text-sidebar-foreground" onClick={onCloseMobile}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Scrollable Navigation */}
        <nav className="flex-1 min-h-0 overflow-y-auto space-y-4 scrollbar-thin">
          {collapsed ? (
            <div className="space-y-1">
              {menuGroups.map((group, idx) => (
                <div key={group.groupKey}>
                  {idx > 0 && <div className="my-3 border-t border-sidebar-border" />}
                  {group.items.map(renderNavItem)}
                </div>
              ))}
            </div>
          ) : (
            menuGroups.map((group) => (
              <Collapsible
                key={group.groupKey}
                open={openGroups[group.groupKey]}
                onOpenChange={() => toggleGroup(group.groupKey)}
              >
                <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs font-semibold uppercase tracking-wider text-sidebar-muted hover:bg-sidebar-accent/50 transition-colors">
                  <span>{t(group.labelKey)}</span>
                  <ChevronDown className={cn(
                    "h-3.5 w-3.5 transition-transform",
                    openGroups[group.groupKey] && "rotate-180"
                  )} />
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-1 pt-1">
                  {group.items.map(renderNavItem)}
                </CollapsibleContent>
              </Collapsible>
            ))
          )}
        </nav>

        {/* Bottom Actions — always visible */}
        <div className="shrink-0 space-y-1 border-t border-sidebar-border pt-4 mt-2">
          {collapsed ? (
            <Tooltip delayDuration={0}>
              <TooltipTrigger asChild>
                <button onClick={handleLogout} className="flex w-full items-center justify-center rounded-lg px-2 py-2.5 text-sm font-medium text-destructive/80 bg-destructive/5 border border-destructive/10 hover:bg-destructive/15 hover:text-destructive hover:border-destructive/20 transition-all">
                  <LogOut className="h-5 w-5 shrink-0" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" className="font-medium">{t('account.signOut')}</TooltipContent>
            </Tooltip>
          ) : (
            <button onClick={handleLogout} className="flex w-full items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-destructive/80 bg-destructive/5 border border-destructive/10 hover:bg-destructive/15 hover:text-destructive hover:border-destructive/20 transition-all">
              <LogOut className="h-5 w-5" /><span>{t('account.signOut')}</span>
            </button>
          )}

          {onToggleCollapse && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleCollapse}
              className={cn(
                "w-full mt-2 text-sidebar-muted hover:text-sidebar-foreground hover:bg-sidebar-accent hidden lg:flex",
                collapsed ? "justify-center px-2" : "justify-start px-3 gap-3"
              )}
            >
              {collapsed ? <ChevronsRight className="h-4 w-4" /> : <><ChevronsLeft className="h-4 w-4" /><span className="text-xs">Collapse Sidebar</span></>}
            </Button>
          )}
        </div>
      </div>
    </aside>
  );
}
