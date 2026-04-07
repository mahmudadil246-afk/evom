import { useState, useEffect, useCallback } from "react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { format, subDays } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { 
  FileText, Download, Calendar as CalendarIcon, Clock, BarChart3, TrendingUp, Users, ShoppingCart,
  Package, DollarSign, Plus, Play, Trash2, Filter, Mail, RefreshCw, AlertCircle
} from "lucide-react";

// ─── Types ───
interface GeneratedReport {
  id: string;
  name: string;
  type: string;
  generatedAt: string;
  rowCount: number;
  status: 'ready' | 'generating' | 'failed';
  filePath?: string;
}

type ReportType = 'sales' | 'inventory' | 'customers' | 'orders' | 'products' | 'financial';

interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  type: ReportType;
}

interface ScheduledReport {
  id: string;
  name: string;
  report_type: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  next_run_at: string | null;
  last_run_at: string | null;
  recipients: string[];
  is_active: boolean;
}

// ─── Config ───
const reportTemplates: ReportTemplate[] = [
  { id: "sales", name: "Sales Report", description: "Revenue, orders & payment breakdown", icon: TrendingUp, type: "sales" },
  { id: "inventory", name: "Inventory Report", description: "Stock levels, categories & valuation", icon: Package, type: "inventory" },
  { id: "customers", name: "Customer Report", description: "Customer list with LTV & order stats", icon: Users, type: "customers" },
  { id: "orders", name: "Order Report", description: "All orders with items, status & totals", icon: ShoppingCart, type: "orders" },
  { id: "products", name: "Product Report", description: "Product catalog with pricing & stock", icon: BarChart3, type: "products" },
  { id: "financial", name: "Financial Report", description: "Revenue summary, refunds & discounts", icon: DollarSign, type: "financial" },
];

const typeConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  sales: { label: "Sales", color: "bg-green-100 text-green-800", icon: TrendingUp },
  inventory: { label: "Inventory", color: "bg-blue-100 text-blue-800", icon: Package },
  customers: { label: "Customer", color: "bg-purple-100 text-purple-800", icon: Users },
  orders: { label: "Order", color: "bg-orange-100 text-orange-800", icon: ShoppingCart },
  products: { label: "Product", color: "bg-pink-100 text-pink-800", icon: BarChart3 },
  financial: { label: "Financial", color: "bg-yellow-100 text-yellow-800", icon: DollarSign },
};

// ─── CSV Helper ───
function arrayToCSV(headers: string[], rows: string[][]): Blob {
  const escape = (v: string) => {
    if (v.includes(",") || v.includes('"') || v.includes("\n")) return `"${v.replace(/"/g, '""')}"`;
    return v;
  };
  const content = [headers.join(","), ...rows.map(r => r.map(escape).join(","))].join("\n");
  return new Blob(["\ufeff" + content], { type: "text/csv;charset=utf-8;" });
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Data Fetchers ───
async function fetchSalesReport(from: Date, to: Date) {
  const { data, error } = await supabase.from("orders")
    .select("order_number, status, payment_status, payment_method, subtotal, discount_amount, shipping_cost, total_amount, created_at")
    .gte("created_at", from.toISOString()).lte("created_at", to.toISOString()).is("deleted_at", null).order("created_at", { ascending: false });
  if (error) throw error;
  const headers = ["Order#", "Status", "Payment Status", "Payment Method", "Subtotal", "Discount", "Shipping", "Total", "Date"];
  const rows = (data || []).map(o => [o.order_number, o.status, o.payment_status || "", o.payment_method || "", String(o.subtotal), String(o.discount_amount || 0), String(o.shipping_cost || 0), String(o.total_amount), format(new Date(o.created_at), "yyyy-MM-dd HH:mm")]);
  return { headers, rows };
}

async function fetchInventoryReport() {
  const { data, error } = await supabase.from("products")
    .select("name, sku, category, price, compare_at_price, quantity, is_active").is("deleted_at", null).order("name");
  if (error) throw error;
  const headers = ["Name", "SKU", "Category", "Price", "Compare At", "Stock", "Active"];
  const rows = (data || []).map(p => [p.name, p.sku || "", p.category || "", String(p.price), String(p.compare_at_price || ""), String(p.quantity ?? 0), p.is_active ? "Yes" : "No"]);
  return { headers, rows };
}

async function fetchCustomerReport() {
  const { data, error } = await supabase.from("customers")
    .select("full_name, email, phone, status, total_orders, total_spent, created_at").order("created_at", { ascending: false });
  if (error) throw error;
  const headers = ["Name", "Email", "Phone", "Status", "Total Orders", "Total Spent", "Joined"];
  const rows = (data || []).map(c => [c.full_name, c.email || "", c.phone || "", c.status || "", String(c.total_orders || 0), String(c.total_spent || 0), format(new Date(c.created_at), "yyyy-MM-dd")]);
  return { headers, rows };
}

async function fetchOrderReport(from: Date, to: Date) {
  const { data, error } = await supabase.from("orders")
    .select("order_number, status, payment_status, payment_method, total_amount, shipping_cost, discount_amount, notes, tracking_number, created_at")
    .gte("created_at", from.toISOString()).lte("created_at", to.toISOString()).is("deleted_at", null).order("created_at", { ascending: false });
  if (error) throw error;
  const headers = ["Order#", "Status", "Payment", "Method", "Total", "Shipping", "Discount", "Tracking", "Notes", "Date"];
  const rows = (data || []).map(o => [o.order_number, o.status, o.payment_status || "", o.payment_method || "", String(o.total_amount), String(o.shipping_cost || 0), String(o.discount_amount || 0), o.tracking_number || "", o.notes || "", format(new Date(o.created_at), "yyyy-MM-dd HH:mm")]);
  return { headers, rows };
}

async function fetchProductReport() {
  const { data, error } = await supabase.from("products")
    .select("name, sku, category, price, compare_at_price, quantity, is_active, is_featured, created_at").is("deleted_at", null).order("name");
  if (error) throw error;
  const headers = ["Name", "SKU", "Category", "Price", "Compare At", "Stock", "Active", "Featured", "Created"];
  const rows = (data || []).map(p => [p.name, p.sku || "", p.category || "", String(p.price), String(p.compare_at_price || ""), String(p.quantity ?? 0), p.is_active ? "Yes" : "No", p.is_featured ? "Yes" : "No", format(new Date(p.created_at), "yyyy-MM-dd")]);
  return { headers, rows };
}

async function fetchFinancialReport(from: Date, to: Date) {
  const { data, error } = await supabase.from("orders")
    .select("order_number, subtotal, discount_amount, shipping_cost, total_amount, refund_amount, refund_status, payment_method, status, created_at")
    .gte("created_at", from.toISOString()).lte("created_at", to.toISOString()).is("deleted_at", null).order("created_at", { ascending: false });
  if (error) throw error;
  const headers = ["Order#", "Subtotal", "Discount", "Shipping", "Total", "Refund", "Refund Status", "Payment Method", "Status", "Date"];
  const rows = (data || []).map(o => [o.order_number, String(o.subtotal), String(o.discount_amount || 0), String(o.shipping_cost || 0), String(o.total_amount), String(o.refund_amount || 0), o.refund_status || "", o.payment_method || "", o.status, format(new Date(o.created_at), "yyyy-MM-dd")]);
  return { headers, rows };
}

// ─── Component ───
export default function Reports() {
  const [reports, setReports] = useState<GeneratedReport[]>([]);
  const [scheduledReports, setScheduledReports] = useState<ScheduledReport[]>([]);
  const [builderOpen, setBuilderOpen] = useState(false);
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<ReportTemplate | null>(null);
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: subDays(new Date(), 30), to: new Date()
  });
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [dbStats, setDbStats] = useState({ orders: 0, products: 0, customers: 0 });
  const [loadingReports, setLoadingReports] = useState(true);

  const [newSchedule, setNewSchedule] = useState({
    name: "", type: "", frequency: "daily" as ScheduledReport['frequency'], recipients: ""
  });

  // Fetch real stats + persisted reports + schedules
  useEffect(() => {
    const fetchAll = async () => {
      const [o, p, c, reportsRes, schedulesRes] = await Promise.all([
        supabase.from("orders").select("id", { count: "exact", head: true }).is("deleted_at", null),
        supabase.from("products").select("id", { count: "exact", head: true }).is("deleted_at", null),
        supabase.from("customers").select("id", { count: "exact", head: true }),
        supabase.from("generated_reports").select("*").order("created_at", { ascending: false }).limit(50),
        supabase.from("scheduled_reports").select("*").order("created_at", { ascending: false }),
      ]);
      setDbStats({ orders: o.count || 0, products: p.count || 0, customers: c.count || 0 });
      
      if (reportsRes.data) {
        setReports(reportsRes.data.map((r: any) => ({
          id: r.id,
          name: r.name,
          type: r.report_type,
          generatedAt: format(new Date(r.created_at), 'yyyy-MM-dd HH:mm'),
          rowCount: r.row_count,
          status: r.status as 'ready' | 'generating' | 'failed',
          filePath: r.file_path,
        })));
      }

      if (schedulesRes.data) {
        setScheduledReports(schedulesRes.data.map((s: any) => ({
          id: s.id,
          name: s.name,
          report_type: s.report_type,
          frequency: s.frequency,
          next_run_at: s.next_run_at,
          last_run_at: s.last_run_at,
          recipients: s.recipients || [],
          is_active: s.is_active,
        })));
      }
      setLoadingReports(false);
    };
    fetchAll();
  }, []);

  const filteredReports = reports.filter(r => typeFilter === "all" || r.type === typeFilter);

  // Generate real report → persist to DB + storage
  const handleGenerateReport = useCallback(async () => {
    if (!selectedTemplate) return;
    const from = dateRange.from || subDays(new Date(), 30);
    const to = dateRange.to || new Date();
    const reportName = `${selectedTemplate.name} - ${format(new Date(), 'dd MMM yyyy')}`;

    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { toast.error("Please log in"); return; }

    // Insert placeholder in DB
    const { data: insertedReport, error: insertErr } = await supabase.from("generated_reports").insert({
      user_id: user.id,
      name: reportName,
      report_type: selectedTemplate.type,
      status: "generating",
      date_from: from.toISOString(),
      date_to: to.toISOString(),
    } as any).select().single();

    if (insertErr || !insertedReport) {
      toast.error("Failed to create report record");
      return;
    }

    const reportId = (insertedReport as any).id;
    setReports(prev => [{ id: reportId, name: reportName, type: selectedTemplate.type, generatedAt: format(new Date(), 'yyyy-MM-dd HH:mm'), rowCount: 0, status: 'generating' }, ...prev]);
    setBuilderOpen(false);
    setSelectedTemplate(null);

    try {
      let result: { headers: string[]; rows: string[][] };
      switch (selectedTemplate.type) {
        case 'sales': result = await fetchSalesReport(from, to); break;
        case 'inventory': result = await fetchInventoryReport(); break;
        case 'customers': result = await fetchCustomerReport(); break;
        case 'orders': result = await fetchOrderReport(from, to); break;
        case 'products': result = await fetchProductReport(); break;
        case 'financial': result = await fetchFinancialReport(from, to); break;
        default: throw new Error("Unknown report type");
      }

      const blob = arrayToCSV(result.headers, result.rows);
      const fileName = `manual/${reportId}/${selectedTemplate.type}_${Date.now()}.csv`;

      // Upload to storage
      const { error: uploadErr } = await supabase.storage.from("reports").upload(fileName, blob, { contentType: "text/csv", upsert: true });
      if (uploadErr) throw uploadErr;

      // Update DB record
      await supabase.from("generated_reports").update({
        status: "ready",
        row_count: result.rows.length,
        file_path: fileName,
        file_size: blob.size,
      } as any).eq("id", reportId);

      setReports(prev => prev.map(r => r.id === reportId ? { ...r, status: 'ready' as const, rowCount: result.rows.length, filePath: fileName } : r));
      toast.success(`Report generated with ${result.rows.length} rows`);
    } catch (err: any) {
      await supabase.from("generated_reports").update({ status: "failed" } as any).eq("id", reportId);
      setReports(prev => prev.map(r => r.id === reportId ? { ...r, status: 'failed' as const } : r));
      toast.error(err.message || "Failed to generate report");
    }
  }, [selectedTemplate, dateRange]);

  // Download from storage
  const handleDownload = async (report: GeneratedReport) => {
    if (!report.filePath) { toast.error("No file available"); return; }
    const { data, error } = await supabase.storage.from("reports").download(report.filePath);
    if (error || !data) { toast.error("Failed to download file"); return; }
    const filename = `${report.name.replace(/\s+/g, '_')}.csv`;
    downloadBlob(data, filename);
    toast.success(`Downloaded ${filename}`);
  };

  // Create schedule → persist to DB
  const handleCreateSchedule = async () => {
    if (!newSchedule.name || !newSchedule.type || !newSchedule.recipients) {
      toast.error("Please fill in all required fields"); return;
    }
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { toast.error("Please log in"); return; }

    const nextRun = new Date();
    if (newSchedule.frequency === "daily") nextRun.setDate(nextRun.getDate() + 1);
    else if (newSchedule.frequency === "weekly") nextRun.setDate(nextRun.getDate() + 7);
    else nextRun.setMonth(nextRun.getMonth() + 1);

    const recipientsList = newSchedule.recipients.split(',').map(e => e.trim()).filter(Boolean);

    const { data: inserted, error } = await supabase.from("scheduled_reports").insert({
      user_id: user.id,
      name: newSchedule.name,
      report_type: newSchedule.type,
      frequency: newSchedule.frequency,
      recipients: recipientsList,
      is_active: true,
      next_run_at: nextRun.toISOString(),
    } as any).select().single();

    if (error || !inserted) {
      toast.error("Failed to create schedule");
      return;
    }

    const s = inserted as any;
    setScheduledReports(prev => [{
      id: s.id, name: s.name, report_type: s.report_type,
      frequency: s.frequency, next_run_at: s.next_run_at, last_run_at: s.last_run_at,
      recipients: s.recipients || [], is_active: s.is_active,
    }, ...prev]);
    setNewSchedule({ name: "", type: "", frequency: "daily", recipients: "" });
    setScheduleDialogOpen(false);
    toast.success("Schedule created successfully");
  };

  const toggleSchedule = async (id: string) => {
    const schedule = scheduledReports.find(s => s.id === id);
    if (!schedule) return;
    const newActive = !schedule.is_active;
    await supabase.from("scheduled_reports").update({ is_active: newActive } as any).eq("id", id);
    setScheduledReports(s => s.map(r => r.id === id ? { ...r, is_active: newActive } : r));
  };

  const deleteSchedule = async (id: string) => {
    await supabase.from("scheduled_reports").delete().eq("id", id);
    setScheduledReports(s => s.filter(r => r.id !== id));
    toast.success("Schedule deleted");
  };

  const generatingCount = reports.filter(r => r.status === 'generating').length;

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <AdminPageHeader
          title="Reports"
          description="Generate and download business reports from real data"
          actions={
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setScheduleDialogOpen(true)}>
                <Clock className="h-4 w-4 mr-2" />
                Create Schedule
              </Button>
              <Button onClick={() => setBuilderOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                New Report
              </Button>
            </div>
          }
        />

        {/* Stats */}
        <div className="grid gap-3 sm:gap-4 grid-cols-2 md:grid-cols-4">
          {[
            { label: "Total Orders", value: dbStats.orders.toString(), icon: ShoppingCart, color: "primary" },
            { label: "Total Products", value: dbStats.products.toString(), icon: Package, color: "success" },
            { label: "Total Customers", value: dbStats.customers.toString(), icon: Users, color: "accent" },
            { label: "Generating Now", value: generatingCount.toString(), icon: RefreshCw, color: "warning" },
          ].map((card) => {
            const IconComp = card.icon;
            const bgMap: Record<string,string> = { primary: "bg-primary/10 text-primary", accent: "bg-accent/10 text-accent", success: "bg-success/10 text-success", warning: "bg-warning/10 text-warning" };
            const borderMap: Record<string,string> = { primary: "border-l-primary", accent: "border-l-accent", success: "border-l-success", warning: "border-l-warning" };
            const cardBgMap: Record<string,string> = { primary: "bg-primary/5 dark:bg-primary/10", accent: "bg-accent/5 dark:bg-accent/10", success: "bg-success/5 dark:bg-success/10", warning: "bg-warning/5 dark:bg-warning/10" };
            return (
              <div key={card.label} className={`group relative rounded-xl border border-border/50 p-4 sm:p-5 transition-all duration-300 hover:shadow-md hover:border-border hover:-translate-y-0.5 border-l-[3px] ${borderMap[card.color]} ${cardBgMap[card.color]} animate-fade-in`}>
                <div className="flex items-center gap-3">
                  <div className={`rounded-lg p-2 ${bgMap[card.color]}`}>
                    <IconComp className="h-4 w-4 sm:h-5 sm:w-5" />
                  </div>
                </div>
                <div className="mt-3">
                  <h3 className="text-lg sm:text-xl font-bold text-foreground truncate tracking-tight">{card.value}</h3>
                  <p className="mt-0.5 text-[11px] sm:text-xs text-muted-foreground font-medium uppercase tracking-wider truncate">{card.label}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Main Content */}
        <Tabs defaultValue="reports" className="space-y-4">
          <TabsList>
            <TabsTrigger value="reports">Generated Reports</TabsTrigger>
            <TabsTrigger value="templates">Templates</TabsTrigger>
            <TabsTrigger value="scheduled">Scheduled</TabsTrigger>
          </TabsList>

          {/* Reports List */}
          <TabsContent value="reports" className="space-y-4">
            <div className="flex gap-4 items-center">
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[200px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Type Filter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Reports</SelectItem>
                  <SelectItem value="sales">Sales</SelectItem>
                  <SelectItem value="inventory">Inventory</SelectItem>
                  <SelectItem value="customers">Customer</SelectItem>
                  <SelectItem value="orders">Order</SelectItem>
                  <SelectItem value="products">Product</SelectItem>
                  <SelectItem value="financial">Financial</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {loadingReports ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <RefreshCw className="h-8 w-8 text-muted-foreground/50 mx-auto mb-3 animate-spin" />
                  <p className="text-muted-foreground">Loading reports...</p>
                </CardContent>
              </Card>
            ) : filteredReports.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <FileText className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
                  <p className="text-muted-foreground">No reports generated yet. Click "New Report" to create one.</p>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Report Name</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Rows</TableHead>
                        <TableHead>Generated</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredReports.map((report) => {
                        const type = typeConfig[report.type] || typeConfig.sales;
                        const TypeIcon = type.icon;
                        return (
                          <TableRow key={report.id}>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <TypeIcon className="h-4 w-4 text-muted-foreground" />
                                <span className="font-medium">{report.name}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge className={type.color} variant="secondary">{type.label}</Badge>
                            </TableCell>
                            <TableCell>{report.status === 'ready' ? report.rowCount : '—'}</TableCell>
                            <TableCell>{report.generatedAt}</TableCell>
                            <TableCell>
                              {report.status === 'ready' ? (
                                <Badge className="bg-green-100 text-green-800">Ready</Badge>
                              ) : report.status === 'generating' ? (
                                <Badge className="bg-blue-100 text-blue-800">
                                  <RefreshCw className="h-3 w-3 mr-1 animate-spin" />Generating
                                </Badge>
                              ) : (
                                <Badge className="bg-red-100 text-red-800">Failed</Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button variant="ghost" size="icon" disabled={report.status !== 'ready'} onClick={() => handleDownload(report)}>
                                <Download className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Templates */}
          <TabsContent value="templates" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {reportTemplates.map((template) => {
                const TemplateIcon = template.icon;
                return (
                  <Card key={template.id} className="cursor-pointer hover:border-primary transition-colors" onClick={() => {
                    setSelectedTemplate(template);
                    setBuilderOpen(true);
                  }}>
                    <CardHeader>
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-full bg-primary/10">
                          <TemplateIcon className="h-5 w-5 text-primary" />
                        </div>
                        <CardTitle className="text-lg">{template.name}</CardTitle>
                      </div>
                      <CardDescription>{template.description}</CardDescription>
                    </CardHeader>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          {/* Scheduled Reports */}
          <TabsContent value="scheduled" className="space-y-4">
            <Card className="border-dashed">
              <CardContent className="py-6">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-warning mt-0.5" />
                  <div>
                    <p className="font-medium text-sm">Email delivery requires configuration</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Go to Settings → Alerts & Email API to configure Resend or Gmail SMTP. 
                      Schedules will auto-deliver reports via email once configured.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-4">
              {scheduledReports.map((schedule) => (
                <Card key={schedule.id} className={!schedule.is_active ? "opacity-60" : ""}>
                  <CardContent className="pt-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <div className={`p-2 rounded-full ${schedule.is_active ? 'bg-green-100' : 'bg-muted'}`}>
                          <Clock className={`h-4 w-4 ${schedule.is_active ? 'text-green-600' : 'text-muted-foreground'}`} />
                        </div>
                        <div>
                          <h3 className="font-semibold">{schedule.name}</h3>
                          <div className="flex flex-wrap items-center gap-2 mt-1">
                            <Badge variant="outline">{schedule.frequency}</Badge>
                            <Badge variant="outline" className="capitalize">{schedule.report_type}</Badge>
                            {schedule.next_run_at && (
                              <span className="text-sm text-muted-foreground">Next: {format(new Date(schedule.next_run_at), 'dd MMM yyyy HH:mm')}</span>
                            )}
                            {schedule.last_run_at && (
                              <span className="text-sm text-muted-foreground">Last: {format(new Date(schedule.last_run_at), 'dd MMM yyyy')}</span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                            <Mail className="h-3 w-3" />
                            {schedule.recipients.join(", ")}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch checked={schedule.is_active} onCheckedChange={() => toggleSchedule(schedule.id)} />
                        <Button variant="ghost" size="icon" onClick={() => deleteSchedule(schedule.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {scheduledReports.length === 0 && (
                <p className="text-center text-muted-foreground py-8">No scheduled reports. Click "Create Schedule" to add one.</p>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Report Builder Dialog */}
      <Dialog open={builderOpen} onOpenChange={setBuilderOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Generate Report</DialogTitle>
            <DialogDescription>Select a report type and date range, then generate a CSV download.</DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Report Type</Label>
              <Select value={selectedTemplate?.id || ""} onValueChange={(v) => setSelectedTemplate(reportTemplates.find(t => t.id === v) || null)}>
                <SelectTrigger><SelectValue placeholder="Select a report" /></SelectTrigger>
                <SelectContent>
                  {reportTemplates.map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {selectedTemplate && ['sales', 'orders', 'financial'].includes(selectedTemplate.type) && (
              <div className="space-y-2">
                <Label>Date Range</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="justify-start text-left font-normal">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dateRange.from ? format(dateRange.from, 'dd/MM/yyyy') : 'Start Date'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar mode="single" selected={dateRange.from} onSelect={(d) => setDateRange(prev => ({ ...prev, from: d }))} />
                    </PopoverContent>
                  </Popover>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="justify-start text-left font-normal">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dateRange.to ? format(dateRange.to, 'dd/MM/yyyy') : 'End Date'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar mode="single" selected={dateRange.to} onSelect={(d) => setDateRange(prev => ({ ...prev, to: d }))} />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            )}

            {selectedTemplate && (
              <p className="text-sm text-muted-foreground">{selectedTemplate.description}. Output format: CSV</p>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setBuilderOpen(false)}>Cancel</Button>
            <Button onClick={handleGenerateReport} disabled={!selectedTemplate}>
              <Play className="h-4 w-4 mr-2" />Generate Report
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Schedule Dialog */}
      <Dialog open={scheduleDialogOpen} onOpenChange={setScheduleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Scheduled Report</DialogTitle>
            <DialogDescription>Schedule automatic report generation & email delivery</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Report Name</Label>
              <Input placeholder="e.g., Daily Sales Summary" value={newSchedule.name} onChange={(e) => setNewSchedule({ ...newSchedule, name: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Report Type</Label>
                <Select value={newSchedule.type} onValueChange={(v) => setNewSchedule({ ...newSchedule, type: v })}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sales">Sales</SelectItem>
                    <SelectItem value="inventory">Inventory</SelectItem>
                    <SelectItem value="customers">Customer</SelectItem>
                    <SelectItem value="orders">Order</SelectItem>
                    <SelectItem value="products">Product</SelectItem>
                    <SelectItem value="financial">Financial</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Frequency</Label>
                <Select value={newSchedule.frequency} onValueChange={(v) => setNewSchedule({ ...newSchedule, frequency: v as any })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Email Recipients (comma separated)</Label>
              <Input placeholder="email1@example.com, email2@example.com" value={newSchedule.recipients} onChange={(e) => setNewSchedule({ ...newSchedule, recipients: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setScheduleDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateSchedule}>Create Schedule</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
