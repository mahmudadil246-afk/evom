
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AutoReplySettings } from "@/components/settings/AutoReplySettings";
import { CannedResponsesSettings } from "@/components/settings/CannedResponsesSettings";
import { Bot, MessageSquare, Clock } from "lucide-react";
import { SLASettings } from "@/components/settings/SLASettings";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";

export default function ManagerSettings() {
  return (
    <>
      <div className="space-y-6">
        <AdminPageHeader
          title="Settings"
          description="Manage auto-reply, quick replies, and SLA configuration"
        />

        <Tabs defaultValue="auto-reply" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 lg:w-auto">
            <TabsTrigger value="auto-reply" className="gap-2">
              <Bot className="h-4 w-4 hidden sm:block" />
              Auto-Reply
            </TabsTrigger>
            <TabsTrigger value="canned" className="gap-2">
              <MessageSquare className="h-4 w-4 hidden sm:block" />
              Quick Replies
            </TabsTrigger>
            <TabsTrigger value="sla" className="gap-2">
              <Clock className="h-4 w-4 hidden sm:block" />
              SLA Config
            </TabsTrigger>
          </TabsList>

          <TabsContent value="auto-reply">
            <AutoReplySettings />
          </TabsContent>

          <TabsContent value="canned">
            <CannedResponsesSettings />
          </TabsContent>

          <TabsContent value="sla">
            <SLASettings />
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
