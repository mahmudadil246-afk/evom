import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { SEOHead } from "@/components/SEOHead";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Send, MessageCircle, Plus, Paperclip, FileText, XCircle, Download, Smile } from "lucide-react";
import { DelayedLoader } from "@/components/ui/DelayedLoader";
import { ChatSkeleton } from "@/components/skeletons";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { format } from "date-fns";
import EmojiPicker from "emoji-picker-react";
import { motion } from "framer-motion";

const statusConfig: Record<string, { label: string; className: string }> = {
  open: { label: "Open", className: "bg-emerald-500/15 text-emerald-600 border-emerald-500/20" },
  pending: { label: "Pending", className: "bg-amber-500/15 text-amber-600 border-amber-500/20" },
  resolved: { label: "Resolved", className: "bg-blue-500/15 text-blue-600 border-blue-500/20" },
  closed: { label: "Closed", className: "bg-muted text-muted-foreground border-border" },
};

export default function AccountChat() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [conversations, setConversations] = useState<any[]>([]);
  const [activeConv, setActiveConv] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMsg, setNewMsg] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [agentTyping, setAgentTyping] = useState(false);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const typingChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isTypingRef = useRef(false);

  const activeConversation = conversations.find(c => c.id === activeConv);
  const isClosed = activeConversation?.status === "closed";

  const fetchConversations = async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from("live_chat_conversations").select("*").eq("user_id", user.id).order("updated_at", { ascending: false });
    setConversations(data || []);
    setLoading(false);
  };

  const fetchMessages = async (convId: string) => {
    const { data } = await supabase
      .from("live_chat_messages").select("*").eq("conversation_id", convId).order("created_at", { ascending: true });
    setMessages(data || []);
    setTimeout(() => scrollRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
  };

  useEffect(() => { fetchConversations(); }, [user]);

  useEffect(() => {
    if (!activeConv) return;
    fetchMessages(activeConv);
    const msgChannel = supabase
      .channel(`chat-${activeConv}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "live_chat_messages", filter: `conversation_id=eq.${activeConv}` }, () => { fetchMessages(activeConv); })
      .subscribe();
    const typingChannel = supabase.channel(`typing-${activeConv}`, { config: { presence: { key: `customer-${user?.id}` } } });
    typingChannel
      .on("presence", { event: "sync" }, () => {
        const state = typingChannel.presenceState();
        const typing = Object.entries(state).find(([key, value]) => {
          const presences = value as unknown as Array<{ isTyping: boolean; sender: string }>;
          return key.startsWith("agent-") && presences.some(p => p.isTyping);
        });
        setAgentTyping(!!typing);
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await typingChannel.track({ name: user?.user_metadata?.full_name || "Customer", isTyping: false, sender: "customer" });
        }
      });
    typingChannelRef.current = typingChannel;
    return () => {
      supabase.removeChannel(msgChannel);
      supabase.removeChannel(typingChannel);
      typingChannelRef.current = null;
    };
  }, [activeConv]);

  const broadcastTyping = useCallback(async (typing: boolean) => {
    if (!typingChannelRef.current) return;
    if (typing === isTypingRef.current) return;
    isTypingRef.current = typing;
    await typingChannelRef.current.track({ name: user?.user_metadata?.full_name || "Customer", isTyping: typing, sender: "customer" });
  }, [user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMsg(e.target.value);
    broadcastTyping(true);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => broadcastTyping(false), 3000);
  };

  const startNewChat = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("live_chat_conversations")
      .insert({ user_id: user.id, customer_name: user.user_metadata?.full_name || user.email, customer_email: user.email, status: "open", subject: t('account.newSupportChat') })
      .select().single();
    if (data) { setActiveConv(data.id); fetchConversations(); }
  };

  const sendMessage = async (content?: string, attachments?: any[]) => {
    const msgContent = content || newMsg.trim();
    if (!msgContent || !activeConv || isClosed) return;
    setSending(true);
    broadcastTyping(false);
    const { error } = await supabase.from("live_chat_messages").insert({
      conversation_id: activeConv, content: msgContent, sender_type: "customer", sender_id: user!.id,
      sender_name: user!.user_metadata?.full_name || user!.email,
      attachments: attachments ? JSON.parse(JSON.stringify(attachments)) : null,
    });
    if (!error) setNewMsg("");
    else toast.error(t('account.failedToSend'));
    setSending(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeConv) return;
    if (file.size > 10 * 1024 * 1024) { toast.error("File size must be under 10MB"); return; }
    setUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;
      const filePath = `${activeConv}/${fileName}`;
      const { error: uploadError } = await supabase.storage.from("chat-attachments").upload(filePath, file);
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from("chat-attachments").getPublicUrl(filePath);
      await sendMessage(`📎 ${file.name}`, [{ url: publicUrl, name: file.name, type: file.type, size: file.size }]);
    } catch (err) {
      console.error("Upload error:", err);
      toast.error("ফাইল আপলোড করতে সমস্যা হয়েছে");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const closeConversation = async () => {
    if (!activeConv) return;
    const { error } = await supabase.from("live_chat_conversations").update({ status: "closed" }).eq("id", activeConv);
    if (!error) { toast.success("চ্যাট বন্ধ করা হয়েছে"); fetchConversations(); }
  };

  const onEmojiClick = (emojiData: any) => {
    setNewMsg(prev => prev + emojiData.emoji);
    setEmojiOpen(false);
    inputRef.current?.focus();
  };

  const renderAttachments = (m: any) => {
    const attachments = m.attachments as any[] | null;
    if (!attachments?.length) return null;
    return (
      <div className="mt-1.5 space-y-1.5">
        {attachments.map((att: any, i: number) => {
          if (att.type?.startsWith("image/")) {
            return (
              <a key={i} href={att.url} target="_blank" rel="noopener noreferrer">
                <img src={att.url} alt={att.name} className="max-w-[200px] rounded-lg border border-border/50" />
              </a>
            );
          }
          return (
            <a key={i} href={att.url} target="_blank" rel="noopener noreferrer"
              className={cn("flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs", m.sender_type === "customer" ? "bg-primary-foreground/10" : "bg-background/50")}>
              <FileText className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate max-w-[140px]">{att.name}</span>
              <Download className="h-3 w-3 shrink-0 ml-auto" />
            </a>
          );
        })}
      </div>
    );
  };

  const StatusBadge = ({ status }: { status: string }) => {
    const config = statusConfig[status] || statusConfig.open;
    return <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0 h-4 font-medium", config.className)}>{config.label}</Badge>;
  };

  if (loading) return <DelayedLoader><ChatSkeleton /></DelayedLoader>;

  return (
    <>
    <SEOHead title="Chat" noIndex />
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, ease: "easeOut" }}
      className="grid grid-cols-1 md:grid-cols-3 gap-4 h-[calc(100vh-14rem)]">
      <Card className="md:col-span-1 flex flex-col">
        <CardHeader className="pb-2 flex-row items-center justify-between">
          <CardTitle className="text-sm">{t('account.chats')}</CardTitle>
          <Button size="sm" variant="ghost" onClick={startNewChat}><Plus className="h-4 w-4" /></Button>
        </CardHeader>
        <ScrollArea className="flex-1">
          <div className="px-3 pb-3 space-y-1">
            {conversations.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-6">{t('account.noConversations')}</p>
            ) : conversations.map((c) => (
              <button key={c.id} onClick={() => setActiveConv(c.id)}
                className={cn("w-full text-left px-3 py-2.5 rounded-lg transition-colors text-sm", activeConv === c.id ? "bg-primary text-primary-foreground" : "hover:bg-accent")}>
                <div className="flex items-center justify-between gap-2">
                  <p className="font-medium truncate flex-1">{c.subject || t('account.supportChat')}</p>
                  <StatusBadge status={c.status} />
                </div>
                <p className={cn("text-xs mt-0.5", activeConv === c.id ? "text-primary-foreground/70" : "text-muted-foreground")}>
                  {format(new Date(c.updated_at), "MMM dd, HH:mm")}
                </p>
              </button>
            ))}
          </div>
        </ScrollArea>
      </Card>

      <Card className="md:col-span-2 flex flex-col">
        {activeConv && activeConversation ? (
          <>
            <div className="border-b border-border px-4 py-2.5 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 min-w-0">
                <p className="font-medium text-sm truncate">{activeConversation.subject || t('account.supportChat')}</p>
                <StatusBadge status={activeConversation.status} />
              </div>
              {!isClosed && (
                <Button size="sm" variant="ghost" onClick={closeConversation} className="text-muted-foreground hover:text-destructive shrink-0">
                  <XCircle className="h-4 w-4 mr-1" /><span className="text-xs">Close</span>
                </Button>
              )}
            </div>
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-3">
                {messages.map((m) => (
                  <div key={m.id} className={cn("flex", m.sender_type === "customer" ? "justify-end" : "justify-start")}>
                    <div className={cn("max-w-[75%] rounded-xl px-3.5 py-2.5 text-sm",
                      m.sender_type === "customer" ? "bg-primary text-primary-foreground" : "bg-muted text-foreground")}>
                      <p>{m.content}</p>
                      {renderAttachments(m)}
                      <p className={cn("text-[10px] mt-1", m.sender_type === "customer" ? "text-primary-foreground/60" : "text-muted-foreground")}>
                        {format(new Date(m.created_at), "HH:mm")}
                      </p>
                    </div>
                  </div>
                ))}
                {agentTyping && (
                  <div className="flex justify-start">
                    <div className="bg-muted rounded-xl px-4 py-2.5 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-foreground/40 animate-bounce" style={{ animationDelay: "0ms" }} />
                      <span className="w-1.5 h-1.5 rounded-full bg-foreground/40 animate-bounce" style={{ animationDelay: "150ms" }} />
                      <span className="w-1.5 h-1.5 rounded-full bg-foreground/40 animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                  </div>
                )}
                <div ref={scrollRef} />
              </div>
            </ScrollArea>
            {isClosed ? (
              <div className="border-t border-border p-3 text-center text-xs text-muted-foreground">
                এই চ্যাট বন্ধ করা হয়েছে। নতুন চ্যাট শুরু করতে + বাটনে ক্লিক করুন।
              </div>
            ) : (
              <div className="border-t border-border p-3 flex gap-2">
                <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileUpload} accept="image/*,.pdf,.doc,.docx,.txt,.zip" />
                <Button variant="ghost" size="icon" onClick={() => fileInputRef.current?.click()} disabled={uploading} className="shrink-0">
                  {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Paperclip className="h-4 w-4" />}
                </Button>
                <Popover open={emojiOpen} onOpenChange={setEmojiOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="ghost" size="icon" className="shrink-0"><Smile className="h-4 w-4" /></Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 border-0" side="top" align="start">
                    <EmojiPicker onEmojiClick={onEmojiClick} width={300} height={350} />
                  </PopoverContent>
                </Popover>
                <Input ref={inputRef} value={newMsg} onChange={handleInputChange} placeholder={t('account.typeMessage')}
                  onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()} />
                <Button onClick={() => sendMessage()} disabled={sending || !newMsg.trim()} size="icon">
                  {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </Button>
              </div>
            )}
          </>
        ) : (
          <CardContent className="flex-1 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
                <MessageCircle className="h-8 w-8 text-primary" />
              </div>
              <p className="text-sm font-medium">{t('account.selectOrStartChat')}</p>
            </div>
          </CardContent>
        )}
      </Card>
    </motion.div>
    </>
  );
}
