import { useState, useEffect } from "react";
import { Menu, LogOut, Settings, Store, Bell, Search, Command, ChevronDown, User, CheckCheck, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ThemeToggle } from "@/components/ThemeToggle";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useRealtimeNotifications } from "@/hooks/useRealtimeNotifications";

interface AccountHeaderProps {
  onMenuClick?: () => void;
  collapsed?: boolean;
  pageTitle?: string;
  pageDescription?: string;
}

export function AccountHeader({ onMenuClick, pageTitle = "My Account" }: AccountHeaderProps) {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useRealtimeNotifications();

  useEffect(() => {
    if (user) {
      supabase
        .from("profiles")
        .select("avatar_url")
        .eq("user_id", user.id)
        .single()
        .then(({ data }) => {
          if (data?.avatar_url) setAvatarUrl(data.avatar_url);
        });
    }
  }, [user]);

  const handleLogout = async () => {
    await signOut();
    toast({ title: "Signed Out", description: "You have been signed out successfully." });
    navigate("/");
  };

  const maskEmail = (email: string) => {
    const [local, domain] = email.split('@');
    if (!domain) return email;
    const visible = local.slice(0, 3);
    return `${visible}***@${domain}`;
  };

  const getInitials = () => {
    if (user?.user_metadata?.full_name) {
      return user.user_metadata.full_name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);
    }
    return user?.email?.slice(0, 2).toUpperCase() || "U";
  };

  const openCommandPalette = () => {
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: true }));
  };

  return (
    <header className="sticky top-0 z-30 flex h-14 sm:h-16 items-center justify-between border-b border-border bg-card px-3 sm:px-6">
      {/* Left side */}
      <div className="flex items-center gap-2 sm:gap-4">
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden h-9 w-9"
          onClick={onMenuClick}
        >
          <Menu className="h-5 w-5" />
        </Button>

        {/* Search bar with ⌘K hint */}
        <button
          onClick={openCommandPalette}
          className="relative hidden md:flex items-center gap-2 w-60 lg:w-80 rounded-md border border-input bg-background px-3 py-2 text-sm text-muted-foreground hover:bg-accent/50 transition-colors"
        >
          <Search className="h-4 w-4" />
          <span>Search...</span>
          <kbd className="ml-auto pointer-events-none hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground sm:flex">
            <Command className="h-3 w-3" />K
          </kbd>
        </button>

        {/* Mobile search */}
        <Button variant="ghost" size="icon" className="md:hidden h-9 w-9" onClick={openCommandPalette}>
          <Search className="h-5 w-5" />
        </Button>

        {/* Mobile title */}
        <h2 className="sm:hidden text-base font-semibold text-foreground leading-tight">{pageTitle}</h2>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-1 sm:gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/")}
          className="hidden md:flex items-center gap-2 text-muted-foreground hover:text-foreground"
        >
          <Store className="h-4 w-4" />
          <span className="text-sm">Store</span>
        </Button>

        {/* Notification dropdown — same as admin */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative h-9 w-9">
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-medium text-destructive-foreground">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80 sm:w-96">
            <div className="flex items-center justify-between px-3 py-2">
              <DropdownMenuLabel className="p-0">Notifications</DropdownMenuLabel>
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs gap-1"
                  onClick={(e) => { e.preventDefault(); markAllAsRead(); }}
                >
                  <CheckCheck className="h-3 w-3" />
                  Mark all read
                </Button>
              )}
            </div>
            <DropdownMenuSeparator />
            {notifications.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Bell className="h-8 w-8 mx-auto mb-2 opacity-40" />
                <p className="text-sm">No notifications</p>
              </div>
            ) : (
              <ScrollArea className="h-[320px]">
                {notifications.map((notif) => (
                  <DropdownMenuItem
                    key={notif.id}
                    className={cn(
                      "flex items-start gap-3 py-3 px-3 cursor-pointer",
                      !notif.is_read && "bg-primary/5"
                    )}
                    onClick={() => { if (!notif.is_read) markAsRead(notif.id); }}
                  >
                    <span className="text-lg shrink-0 mt-0.5">
                      {notif.type === "order" ? "📦" : notif.type === "promo" ? "🎉" : notif.type === "support" ? "💬" : "🔔"}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className={cn("text-sm truncate", !notif.is_read && "font-semibold")}>{notif.title}</p>
                        {!notif.is_read && <span className="h-2 w-2 rounded-full bg-primary shrink-0" />}
                      </div>
                      {notif.message && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{notif.message}</p>}
                      <p className="text-[10px] text-muted-foreground mt-1">
                        {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true })}
                      </p>
                    </div>
                  </DropdownMenuItem>
                ))}
              </ScrollArea>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        <ThemeToggle />

        {/* Profile — pill-shaped trigger matching admin */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2.5 rounded-full border border-border bg-muted/50 px-2 py-1.5 sm:px-3 transition-all hover:bg-accent hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1">
              <Avatar className="h-7 w-7 sm:h-8 sm:w-8 ring-2 ring-background">
                <AvatarImage src={avatarUrl || ""} />
                <AvatarFallback className="bg-primary/10 text-primary text-xs sm:text-sm font-semibold">
                  {getInitials()}
                </AvatarFallback>
              </Avatar>
              <div className="hidden text-left lg:block">
                <div className="flex items-center gap-1.5">
                  <p className="text-sm font-semibold text-foreground leading-tight">
                    {user?.user_metadata?.full_name || "Customer"}
                  </p>
                  <span className="inline-flex items-center rounded-md bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
                    Customer
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground leading-tight mt-0.5">
                  {maskEmail(user?.email || "user@ekta.com")}
                </p>
              </div>
              <ChevronDown className="hidden lg:block h-3.5 w-3.5 text-muted-foreground" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-auto min-w-64 p-0">
            {/* User info header */}
            <div className="flex items-center gap-3 p-3 bg-muted/30 border-b border-border">
              <Avatar className="h-10 w-10 ring-2 ring-background shadow-sm">
                <AvatarImage src={avatarUrl || ""} />
                <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                  {getInitials()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="text-sm font-semibold text-foreground">
                    {user?.user_metadata?.full_name || "Customer"}
                  </p>
                  <span className="inline-flex items-center rounded-md bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary shrink-0">
                    Customer
                  </span>
                </div>
                <p className="text-xs text-muted-foreground break-all">
                  {user?.email || "user@ekta.com"}
                </p>
              </div>
            </div>
            <div className="p-1">
              <DropdownMenuItem onClick={() => navigate("/myaccount/personal-info")} className="rounded-md py-2 cursor-pointer">
                <User className="mr-2 h-4 w-4 text-muted-foreground" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem asChild className="rounded-md py-2 cursor-pointer">
                <a href="/" target="_blank" rel="noopener noreferrer" className="flex w-full items-center">
                  <Store className="mr-2 h-4 w-4 text-muted-foreground" />
                  <span>Go to Store</span>
                </a>
              </DropdownMenuItem>
            </div>
            <div className="border-t border-border p-1.5">
              <DropdownMenuItem 
                onClick={handleLogout} 
                className="rounded-lg py-2.5 cursor-pointer text-destructive/80 bg-destructive/5 border border-destructive/10 hover:bg-destructive/15 hover:text-destructive hover:border-destructive/20 focus:bg-destructive/15 focus:text-destructive transition-all justify-center font-medium"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </DropdownMenuItem>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
