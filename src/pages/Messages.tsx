import { useState, useEffect } from "react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  MessageSquare, 
  Clock, 
  AlertCircle,
  Tag,
  Inbox,
  Bell,
  BellOff,
  Users,
  Timer,
  Star,
} from "lucide-react";
import { ContactMessagesTab } from "@/components/admin/ContactMessagesTab";
import { LiveChatTab } from "@/components/admin/LiveChatTab";
import { SupportTicketsTab } from "@/components/admin/SupportTicketsTab";
import { AgentWorkloadStats } from "@/components/admin/AgentWorkloadStats";
import { SLABreachAlert } from "@/components/admin/SLABreachAlert";
import { CSATDashboard } from "@/components/admin/CSATDashboard";
import { useContactMessages } from "@/hooks/useContactMessages";
import { useLiveChat } from "@/hooks/useLiveChat";
import { useSupportTickets } from "@/hooks/useSupportTickets";
import { useChatNotifications } from "@/hooks/useChatNotifications";
import { useTabNotifications } from "@/hooks/useTabNotifications";
import { useSLAConfig } from "@/hooks/useSLAConfig";
import { KnowledgeBaseSheet } from "@/components/admin/KnowledgeBasePanel";
import { toast } from "sonner";

export default function Messages() {
  const { unreadCount: contactUnreadCount } = useContactMessages();
  const { stats: liveChatStats, conversations } = useLiveChat();
  const { stats: ticketStats, tickets } = useSupportTickets();
  const { requestPermission, subscribeToNotifications, isSupported } = useChatNotifications();
  const [notificationsEnabled, setNotificationsEnabled] = useState(
    typeof Notification !== "undefined" && Notification.permission === "granted"
  );
  const [showAgentStats, setShowAgentStats] = useState(false);
  const { config: slaConfig } = useSLAConfig();

  const totalUnread = contactUnreadCount + liveChatStats.unreadMessages + ticketStats.open;
  
  // Use tab notifications hook
  useTabNotifications({ 
    unreadCount: totalUnread, 
    baseTitle: "Messages & Support" 
  });

  // Subscribe to realtime notifications when enabled
  useEffect(() => {
    if (notificationsEnabled) {
      const unsubscribe = subscribeToNotifications();
      return unsubscribe;
    }
  }, [notificationsEnabled, subscribeToNotifications]);

  const stats = {
    totalConversations: liveChatStats.total,
    openConversations: liveChatStats.open,
    totalTickets: ticketStats.total,
    pendingTickets: ticketStats.pending,
    unreadMessages: liveChatStats.unreadMessages,
    contactMessages: contactUnreadCount
  };

  const handleEnableNotifications = async () => {
    if (!isSupported) {
      toast.error("Your browser doesn't support notifications");
      return;
    }

    const granted = await requestPermission();
    if (granted) {
      setNotificationsEnabled(true);
      toast.success("Notifications enabled!");
    } else {
      toast.error("Notification permission denied");
    }
  };

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <AdminPageHeader
          title="Messages & Support"
          description="Manage customer inquiries and support tickets"
          actions={
          <div className="flex gap-2 flex-wrap mt-2 sm:mt-0">
            <KnowledgeBaseSheet />
            <Button
              variant={showAgentStats ? "default" : "outline"}
              size="sm"
              onClick={() => setShowAgentStats(!showAgentStats)}
            >
              <Users className="h-4 w-4 mr-2" />
              Agent Stats
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleEnableNotifications}
              disabled={notificationsEnabled}
            >
              {notificationsEnabled ? (
                <>
                  <Bell className="h-4 w-4 mr-2 text-success" />
                  Notifications On
                </>
              ) : (
                <>
                  <BellOff className="h-4 w-4 mr-2" />
                  Enable Notifications
                </>
              )}
            </Button>
          </div>
          }
        />

        {/* SLA Breach Alert */}
        <SLABreachAlert conversations={conversations} tickets={tickets} />

        {/* Agent Stats Section */}
        {showAgentStats && (
          <AgentWorkloadStats />
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-6">
          {[
            { label: "Total Conversations", value: stats.totalConversations.toString(), icon: MessageSquare, color: "primary" },
            { label: "Open Chats", value: stats.openConversations.toString(), icon: Inbox, color: "accent" },
            { label: "Total Tickets", value: stats.totalTickets.toString(), icon: Tag, color: "primary" },
            { label: "Pending Tickets", value: stats.pendingTickets.toString(), icon: Clock, color: "warning" },
            { label: "Unread Messages", value: stats.unreadMessages.toString(), icon: AlertCircle, color: "warning" },
            { label: "SLA Target", value: `${slaConfig.firstResponseMinutes}m`, icon: Timer, color: "accent" },
          ].map((card) => {
            const IconComp = card.icon;
            const bgMap: Record<string,string> = { primary: "bg-primary/10 text-primary", accent: "bg-accent/10 text-accent", success: "bg-success/10 text-success", warning: "bg-warning/10 text-warning" };
            const borderMap: Record<string,string> = { primary: "border-l-primary", accent: "border-l-accent", success: "border-l-success", warning: "border-l-warning" };
            const cardBgMap: Record<string,string> = { primary: "bg-primary/5 dark:bg-primary/10", accent: "bg-accent/5 dark:bg-accent/10", success: "bg-success/5 dark:bg-success/10", warning: "bg-warning/5 dark:bg-warning/10" };
            return (
              <div key={card.label} className={`group relative rounded-xl border border-border/50 p-3 sm:p-4 transition-all duration-300 hover:shadow-md hover:border-border hover:-translate-y-0.5 border-l-[3px] ${borderMap[card.color]} ${cardBgMap[card.color]} animate-fade-in`}>
                <div className="flex items-center gap-2">
                  <div className={`rounded-lg p-1.5 sm:p-2 ${bgMap[card.color]}`}>
                    <IconComp className="h-4 w-4" />
                  </div>
                </div>
                <div className="mt-2">
                  <h3 className="text-lg sm:text-xl font-bold text-foreground tracking-tight">{card.value}</h3>
                  <p className="mt-0.5 text-[10px] sm:text-[11px] text-muted-foreground font-medium uppercase tracking-wider truncate">{card.label}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Main Content */}
        <Tabs defaultValue="contact" className="space-y-4">
          <TabsList className="w-full sm:w-auto">
            <TabsTrigger value="contact" className="flex-1 sm:flex-none">
              Contact Messages
              {stats.contactMessages > 0 && (
                <Badge variant="destructive" className="ml-2 h-5 min-w-5 rounded-full p-0 flex items-center justify-center text-xs">
                  {stats.contactMessages}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="chat" className="flex-1 sm:flex-none">Live Chat</TabsTrigger>
            <TabsTrigger value="tickets" className="flex-1 sm:flex-none">
              Support Tickets
              {ticketStats.open > 0 && (
                <Badge variant="secondary" className="ml-2 h-5 min-w-5 rounded-full p-0 flex items-center justify-center text-xs">
                  {ticketStats.open}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="csat" className="flex-1 sm:flex-none">
              <Star className="h-3.5 w-3.5 mr-1" />
              CSAT
            </TabsTrigger>
          </TabsList>

          <TabsContent value="contact">
            <ContactMessagesTab />
          </TabsContent>

          <TabsContent value="chat" className="space-y-4">
            <LiveChatTab />
          </TabsContent>

          <TabsContent value="tickets" className="space-y-4">
            <SupportTicketsTab />
          </TabsContent>

          <TabsContent value="csat" className="space-y-4">
            <CSATDashboard />
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
