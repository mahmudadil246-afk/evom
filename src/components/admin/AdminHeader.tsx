import { useState, useEffect } from "react";
import { Search, Menu, LogOut, User, ExternalLink, Command, ChevronDown } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ThemeToggle } from "@/components/ThemeToggle";
import { NotificationCenter } from "@/components/admin/NotificationCenter";
import { AgentAvailabilityToggle } from "@/components/admin/AgentAvailabilityToggle";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface AdminHeaderProps {
  onMenuClick?: () => void;
  collapsed?: boolean;
}

export function AdminHeader({ onMenuClick, collapsed }: AdminHeaderProps) {
  const { t } = useLanguage();
  const { user, signOut, role } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  
  const basePath = role === 'admin' ? '/admin' : role === 'manager' ? '/manager' : '/support';

  useEffect(() => {
    if (user) {
      fetchAvatar();
    }
  }, [user]);

  const fetchAvatar = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('profiles')
      .select('avatar_url')
      .eq('user_id', user.id)
      .single();
    if (data?.avatar_url) {
      setAvatarUrl(data.avatar_url);
    }
  };

  const handleLogout = async () => {
    await signOut();
    toast({
      title: t('logout'),
      description: 'You have been logged out successfully.',
    });
    navigate('/login');
  };

  const openCommandPalette = () => {
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: true }));
  };

  const maskEmail = (email: string) => {
    const [local, domain] = email.split('@');
    if (!domain) return email;
    const visible = local.slice(0, 3);
    return `${visible}***@${domain}`;
  };

  const getInitials = () => {
    if (user?.user_metadata?.full_name) {
      return user.user_metadata.full_name
        .split(' ')
        .map((n: string) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    return user?.email?.slice(0, 2).toUpperCase() || 'AD';
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
          <span>{t('header.search')}</span>
          <kbd className="ml-auto pointer-events-none hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground sm:flex">
            <Command className="h-3 w-3" />K
          </kbd>
        </button>
        {/* Mobile search button */}
        <Button variant="ghost" size="icon" className="md:hidden h-9 w-9" onClick={openCommandPalette}>
          <Search className="h-5 w-5" />
        </Button>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-1 sm:gap-2">
        {(role === 'support' || role === 'manager' || role === 'admin') && (
          <AgentAvailabilityToggle />
        )}
        <ThemeToggle />
        <NotificationCenter />

        {/* Profile */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2.5 rounded-full border border-border bg-muted/50 px-2 py-1.5 sm:px-3 transition-all hover:bg-accent hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1">
              <Avatar className="h-7 w-7 sm:h-8 sm:w-8 ring-2 ring-background">
                <AvatarImage src={avatarUrl || ''} />
                <AvatarFallback className="bg-primary/10 text-primary text-xs sm:text-sm font-semibold">
                  {getInitials()}
                </AvatarFallback>
              </Avatar>
              <div className="hidden text-left lg:block">
                <div className="flex items-center gap-1.5">
                  <p className="text-sm font-semibold text-foreground leading-tight">
                    {user?.user_metadata?.full_name || 'Admin'}
                  </p>
                  <span className="inline-flex items-center rounded-md bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary capitalize">
                    {role || 'admin'}
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground leading-tight mt-0.5">
                  {maskEmail(user?.email || 'admin@ekta.com')}
                </p>
              </div>
              <ChevronDown className="hidden lg:block h-3.5 w-3.5 text-muted-foreground" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-auto min-w-64 p-0">
            {/* User info header */}
            <div className="flex items-center gap-3 p-3 bg-muted/30 border-b border-border">
              <Avatar className="h-10 w-10 ring-2 ring-background shadow-sm">
                <AvatarImage src={avatarUrl || ''} />
                <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                  {getInitials()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="text-sm font-semibold text-foreground">
                    {user?.user_metadata?.full_name || 'Admin'}
                  </p>
                  <span className="inline-flex items-center rounded-md bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary capitalize shrink-0">
                    {role || 'admin'}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground break-all">
                  {user?.email || 'admin@ekta.com'}
                </p>
              </div>
            </div>
            <div className="p-1">
              <DropdownMenuItem onClick={() => navigate(`${basePath}/account-settings/personal-info`)} className="rounded-md py-2 cursor-pointer">
                <User className="mr-2 h-4 w-4 text-muted-foreground" />
                {t('header.profile')}
              </DropdownMenuItem>
              <DropdownMenuItem asChild className="rounded-md py-2 cursor-pointer">
                <a href="/" target="_blank" rel="noopener noreferrer" className="flex w-full items-center">
                  <ExternalLink className="mr-2 h-4 w-4 text-muted-foreground" />
                  <span>Visit Store</span>
                </a>
              </DropdownMenuItem>
            </div>
            <div className="border-t border-border p-1.5">
              <DropdownMenuItem 
                onClick={handleLogout} 
                className="rounded-lg py-2.5 cursor-pointer text-destructive/80 bg-destructive/5 border border-destructive/10 hover:bg-destructive/15 hover:text-destructive hover:border-destructive/20 focus:bg-destructive/15 focus:text-destructive transition-all justify-center font-medium"
              >
                <LogOut className="mr-2 h-4 w-4" />
                {t('nav.logout')}
              </DropdownMenuItem>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
