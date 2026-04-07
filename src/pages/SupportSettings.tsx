
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CannedResponsesSettings } from "@/components/settings/CannedResponsesSettings";
import { MessageSquare, Bell } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { toast } from "sonner";

function NotificationPreferences() {
  const [prefs, setPrefs] = useState({
    newTicket: true,
    chatAssigned: true,
    chatTransfer: true,
    slaWarning: true,
    soundEnabled: true,
  });

  const toggle = (key: keyof typeof prefs) => {
    setPrefs(prev => ({ ...prev, [key]: !prev[key] }));
    toast.success("Preference updated");
  };

  const items = [
    { key: "newTicket" as const, label: "New ticket assigned", desc: "Get notified when a new ticket is assigned to you" },
    { key: "chatAssigned" as const, label: "Chat assigned", desc: "Notification when a live chat is assigned to you" },
    { key: "chatTransfer" as const, label: "Chat transfer", desc: "Alert when a chat is transferred to you" },
    { key: "slaWarning" as const, label: "SLA breach warning", desc: "Warning before SLA deadline approaches" },
    { key: "soundEnabled" as const, label: "Sound notifications", desc: "Play sound for incoming messages" },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notification Preferences</CardTitle>
        <CardDescription>Choose which notifications you want to receive</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {items.map(({ key, label, desc }) => (
          <div key={key} className="flex items-center justify-between gap-4 py-2">
            <div>
              <Label className="font-medium">{label}</Label>
              <p className="text-sm text-muted-foreground">{desc}</p>
            </div>
            <Switch checked={prefs[key]} onCheckedChange={() => toggle(key)} />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export default function SupportSettings() {
  return (
    <>
      <div className="space-y-6">
        <AdminPageHeader
          title="Settings"
          description="Manage your notifications and quick replies"
        />

        <Tabs defaultValue="notifications" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 lg:w-auto">
            <TabsTrigger value="notifications" className="gap-2">
              <Bell className="h-4 w-4 hidden sm:block" />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="canned" className="gap-2">
              <MessageSquare className="h-4 w-4 hidden sm:block" />
              Quick Replies
            </TabsTrigger>
          </TabsList>

          <TabsContent value="notifications">
            <NotificationPreferences />
          </TabsContent>

          <TabsContent value="canned">
            <CannedResponsesSettings />
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
