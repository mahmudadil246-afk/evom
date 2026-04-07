import React, { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Mail,
  FileText,
  ShoppingCart,
  Package,
  CheckCircle2,
  XCircle,
  ClipboardList,
  DollarSign,
  RotateCcw,
  UserCheck,
  RefreshCw,
  KeyRound,
  Send,
  Clock,
  Tag,
  TrendingDown,
  PackageCheck,
  Shield,
  AlertCircle,
  MessageSquareReply,
  Search,
  Eye,
  Copy,
  LayoutGrid,
} from "lucide-react";
import { EmailTemplateEditor } from "@/components/settings/EmailTemplateEditor";
import { CreateTemplateModal } from "@/components/settings/CreateTemplateModal";
import { type EmailTemplate } from "@/hooks/useEmailTemplates";
import { toast } from "sonner";

interface EmailTemplatesTabProps {
  templates: EmailTemplate[];
  loading: boolean;
  onUpdateTemplate: (template: EmailTemplate) => Promise<any>;
  onToggleTemplate: (id: string, active: boolean) => void;
  onCreateTemplate: (template: any) => Promise<any>;
  onDeleteTemplate: (id: string) => Promise<any>;
}

const templateCategoryMap: Record<string, string[]> = {
  order: ["order_confirmation", "shipping_notification", "delivery_confirmation", "order_cancelled", "order_status_update", "refund_confirmation", "return_request", "payment_verified", "new_order_admin", "payment_failed", "shipping_delayed", "tracking_updated"],
  auth: ["password_reset", "welcome_email", "email_verification_otp", "password_changed"],
  marketing: ["abandoned_cart", "review_request", "coupon_promo", "wishlist_price_drop", "back_in_stock", "new_review_admin", "review_approved", "low_rating_alert"],
  security: ["lockout_alert", "unlock_alert", "login_alert", "suspicious_login", "new_device_login", "two_factor_enabled", "two_factor_disabled", "session_terminated", "ip_blocked", "geo_blocked"],
  support: ["contact_reply"],
  inventory: ["low_stock_alert", "out_of_stock"],
  customers: ["new_customer_admin"],
  reports: ["daily_sales_report", "weekly_summary", "monthly_report"],
};

const categoryIcons: Record<string, Record<string, React.ElementType>> = {
  order: { order_confirmation: ShoppingCart, shipping_notification: Package, delivery_confirmation: CheckCircle2, order_cancelled: XCircle, order_status_update: ClipboardList, refund_confirmation: DollarSign, return_request: RotateCcw, payment_verified: CheckCircle2, new_order_admin: ShoppingCart, payment_failed: XCircle, shipping_delayed: Clock, tracking_updated: Package },
  auth: { password_reset: RefreshCw, welcome_email: UserCheck, email_verification_otp: KeyRound, password_changed: KeyRound },
  marketing: { abandoned_cart: Clock, review_request: Send, coupon_promo: Tag, wishlist_price_drop: TrendingDown, back_in_stock: PackageCheck, new_review_admin: Send, review_approved: CheckCircle2, low_rating_alert: AlertCircle },
  security: { lockout_alert: AlertCircle, unlock_alert: CheckCircle2, login_alert: Shield, suspicious_login: AlertCircle, new_device_login: Shield, two_factor_enabled: Shield, two_factor_disabled: AlertCircle, session_terminated: XCircle, ip_blocked: Shield, geo_blocked: AlertCircle },
  support: { contact_reply: MessageSquareReply },
  inventory: { low_stock_alert: TrendingDown, out_of_stock: XCircle },
  customers: { new_customer_admin: UserCheck },
  reports: { daily_sales_report: ClipboardList, weekly_summary: ClipboardList, monthly_report: ClipboardList },
};

const categories = [
  { key: "order", label: "Order & Shipping Templates", description: "Email templates for order lifecycle and shipping", icon: ShoppingCart },
  { key: "auth", label: "Authentication Templates", description: "Email templates for user authentication", icon: UserCheck },
  { key: "marketing", label: "Marketing & Reviews Templates", description: "Email templates for customer engagement and reviews", icon: Send },
  { key: "security", label: "Security Templates", description: "Email templates for security alerts", icon: Shield },
  { key: "inventory", label: "Inventory Templates", description: "Email templates for stock alerts", icon: Package },
  { key: "customers", label: "Customer Templates", description: "Email templates for customer notifications", icon: UserCheck },
  { key: "reports", label: "Report Templates", description: "Email templates for automated reports", icon: ClipboardList },
  { key: "support", label: "Support Templates", description: "Email templates for customer support", icon: MessageSquareReply },
];

export function EmailTemplatesTab({
  templates,
  loading,
  onUpdateTemplate,
  onToggleTemplate,
  onCreateTemplate,
  onDeleteTemplate,
}: EmailTemplatesTabProps) {
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [templateEditorOpen, setTemplateEditorOpen] = useState(false);
  const [createTemplateOpen, setCreateTemplateOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [previewTemplate, setPreviewTemplate] = useState<EmailTemplate | null>(null);

  const activeCount = templates.filter(t => t.is_active).length;
  const inactiveCount = templates.filter(t => !t.is_active).length;

  const getTemplatesByCategory = (category: string) => {
    const slugs = templateCategoryMap[category];
    if (!slugs) {
      const allMappedSlugs = Object.values(templateCategoryMap).flat();
      return templates.filter((t) => !allMappedSlugs.includes(t.slug));
    }
    return templates.filter((t) => slugs.includes(t.slug));
  };

  const filteredTemplatesByCategory = useMemo(() => {
    if (!searchQuery.trim()) return null;
    const q = searchQuery.toLowerCase();
    return templates.filter(
      t => t.name.toLowerCase().includes(q) || t.subject.toLowerCase().includes(q) || t.slug.toLowerCase().includes(q)
    );
  }, [searchQuery, templates]);

  const handleDuplicate = async (template: EmailTemplate) => {
    const result = await onCreateTemplate({
      name: `${template.name} (Copy)`,
      slug: `${template.slug}_copy_${Date.now()}`,
      subject: template.subject,
      body_html: template.body_html,
      body_text: template.body_text,
      variables: template.variables,
      is_active: false,
    });
    if (result) {
      toast.success("Template duplicated successfully");
    }
  };

  const renderTemplateList = (categoryKey: string, templateList: EmailTemplate[]) => (
    <div className="space-y-3">
      {templateList.map((template) => {
        const Icon = categoryIcons[categoryKey]?.[template.slug] || Mail;
        return (
          <div key={template.id} className="flex items-center justify-between rounded-lg border border-border p-4 hover:bg-muted/30 transition-colors">
            <div className="flex items-center gap-4 min-w-0 flex-1">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted shrink-0">
                <Icon className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium truncate">{template.name}</p>
                  {template.is_active ? (
                    <Badge variant="default" className="text-[10px] px-1.5 py-0 shrink-0">Active</Badge>
                  ) : (
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0 shrink-0">Inactive</Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground line-clamp-1">{template.subject}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0 ml-4">
              <span className="text-xs text-muted-foreground hidden lg:block">
                {new Date(template.updated_at).toLocaleDateString()}
              </span>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setPreviewTemplate(template)} title="Preview">
                <Eye className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDuplicate(template)} title="Duplicate">
                <Copy className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={() => { setEditingTemplate(template); setTemplateEditorOpen(true); }}>
                Edit
              </Button>
              <Switch checked={template.is_active} onCheckedChange={(checked) => onToggleTemplate(template.id, checked)} />
            </div>
          </div>
        );
      })}
    </div>
  );

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Loading email templates...
        </CardContent>
      </Card>
    );
  }

  const customTemplates = getTemplatesByCategory("custom");

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Mail className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{templates.length}</p>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Total</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-success/10">
              <CheckCircle2 className="h-5 w-5 text-success" />
            </div>
            <div>
              <p className="text-2xl font-bold">{activeCount}</p>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Active</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-muted">
              <XCircle className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-2xl font-bold">{inactiveCount}</p>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Inactive</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-accent/10">
              <LayoutGrid className="h-5 w-5 text-accent" />
            </div>
            <div>
              <p className="text-2xl font-bold">{categories.length}</p>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Categories</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Search & Create */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search templates by name, subject or slug..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button onClick={() => setCreateTemplateOpen(true)} className="gap-2 shrink-0">
          <FileText className="h-4 w-4" />
          Create Template
        </Button>
      </div>

      {/* Search Results or Category View */}
      {filteredTemplatesByCategory ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Search className="h-5 w-5 text-accent" />
              Search Results
              <Badge variant="secondary">{filteredTemplatesByCategory.length} found</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filteredTemplatesByCategory.length > 0 ? (
              renderTemplateList("custom", filteredTemplatesByCategory)
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">No templates match your search</p>
            )}
          </CardContent>
        </Card>
      ) : (
        <>
          {categories.map((cat) => {
            const catTemplates = getTemplatesByCategory(cat.key);
            if (catTemplates.length === 0) return null;
            return (
              <Card key={cat.key}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <cat.icon className="h-5 w-5 text-accent" />
                    {cat.label}
                    <Badge variant="secondary" className="ml-auto">
                      {catTemplates.filter(t => t.is_active).length}/{catTemplates.length} active
                    </Badge>
                  </CardTitle>
                  <CardDescription>{cat.description}</CardDescription>
                </CardHeader>
                <CardContent>{renderTemplateList(cat.key, catTemplates)}</CardContent>
              </Card>
            );
          })}

          {customTemplates.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-accent" />
                  Custom Templates
                  <Badge variant="secondary" className="ml-auto">
                    {customTemplates.filter(t => t.is_active).length}/{customTemplates.length} active
                  </Badge>
                </CardTitle>
                <CardDescription>Your custom email templates</CardDescription>
              </CardHeader>
              <CardContent>{renderTemplateList("custom", customTemplates)}</CardContent>
            </Card>
          )}
        </>
      )}

      {/* Preview Dialog */}
      <Dialog open={!!previewTemplate} onOpenChange={(open) => !open && setPreviewTemplate(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              {previewTemplate?.name}
            </DialogTitle>
          </DialogHeader>
          {previewTemplate?.body_html ? (
            <div className="border rounded-lg p-4 bg-background">
              <p className="text-sm font-medium mb-2 text-muted-foreground">Subject: {previewTemplate.subject}</p>
              <div className="border-t pt-4" dangerouslySetInnerHTML={{ __html: previewTemplate.body_html }} />
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p>No HTML content available for this template</p>
              {previewTemplate?.body_text && (
                <pre className="mt-4 text-left text-sm whitespace-pre-wrap border rounded-lg p-4">{previewTemplate.body_text}</pre>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <EmailTemplateEditor
        template={editingTemplate}
        open={templateEditorOpen}
        onOpenChange={setTemplateEditorOpen}
        onSave={onUpdateTemplate}
        onDelete={onDeleteTemplate}
      />

      <CreateTemplateModal
        open={createTemplateOpen}
        onOpenChange={setCreateTemplateOpen}
        onSave={onCreateTemplate}
      />
    </div>
  );
}
