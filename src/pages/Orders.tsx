import React, { useState, useMemo } from "react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ReturnRequestsTab } from "@/components/admin/ReturnRequestsTab";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Search,
  MoreVertical,
  Eye,
  FileText,
  Truck,
  Package,
  Clock,
  CheckCircle2,
  XCircle,
  Download,
  CreditCard,
  ShoppingBag,
  Trash2,
  X,
  Send,
  ShieldCheck,
  Printer,
  Copy,
  RotateCcw,
  Tag,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useOrdersData, type Order, type OrderStatus } from "@/hooks/useOrdersData";
import { useOrderTags } from "@/hooks/useOrderTags";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { toast } from "sonner";
import { SendToCourierModal } from "@/components/orders/SendToCourierModal";
import { BulkSendToCourierModal } from "@/components/orders/BulkSendToCourierModal";
import { PaymentVerificationModal } from "@/components/orders/PaymentVerificationModal";
import { refundStatusConfig, type RefundStatus } from "@/components/orders/RefundProcessingModal";
import { MobileOrderCard } from "@/components/orders/MobileOrderCard";
import { MobileQuickStatusDrawer } from "@/components/orders/MobileQuickStatusDrawer";
import { DeleteConfirmModal } from "@/components/ui/DeleteConfirmModal";
import { OrderStatsCards } from "@/components/orders/OrderStatsCards";
import { OrderDetailDialog } from "@/components/orders/OrderDetailDialog";
import { generateInvoicePDF, generateBulkInvoicePDF, orderToInvoiceData } from "@/utils/generateInvoicePDF";
import { generatePackingSlip } from "@/utils/generatePackingSlip";
import { TablePagination } from "@/components/ui/table-pagination";
import { SortableTableHead } from "@/components/ui/sortable-table-head";
import { DataExport } from "@/components/ui/data-export";
import { usePagination } from "@/hooks/usePagination";
import { useSorting } from "@/hooks/useSorting";
import { useIsMobile } from "@/hooks/use-mobile";
import { formatPrice } from "@/lib/formatPrice";


const statusConfig: Record<OrderStatus, { label: string; color: string; icon: React.ElementType }> = {
  pending: { label: "Pending", color: "bg-warning/10 text-warning border-warning/20", icon: Clock },
  processing: { label: "Processing", color: "bg-accent/10 text-accent border-accent/20", icon: Package },
  shipped: { label: "Shipped", color: "bg-chart-5/10 text-chart-5 border-chart-5/20", icon: Truck },
  delivered: { label: "Delivered", color: "bg-success/10 text-success border-success/20", icon: CheckCircle2 },
  cancelled: { label: "Cancelled", color: "bg-destructive/10 text-destructive border-destructive/20", icon: XCircle },
};

const paymentStatusConfig: Record<string, { label: string; color: string }> = {
  pending: { label: "Pending", color: "bg-warning/10 text-warning border-warning/20" },
  paid: { label: "Paid", color: "bg-success/10 text-success border-success/20" },
  failed: { label: "Failed", color: "bg-destructive/10 text-destructive border-destructive/20" },
  refunded: { label: "Refunded", color: "bg-muted text-muted-foreground" },
};

const getShippingAddressString = (address: any): string => {
  if (!address) return 'N/A';
  if (typeof address === 'string') return address;
  if (typeof address === 'object') {
    const parts = [address.street, address.area, address.city].filter(Boolean);
    return parts.length > 0 ? parts.join(', ') : 'N/A';
  }
  return 'N/A';
};

export default function Orders() {
  const { orders, stats, isLoading, updateStatus, updatePaymentStatus, verifyPayment, deleteOrder, isVerifying } = useOrdersData();
  const { updateTags } = useOrderTags();
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedOrderIds, setSelectedOrderIds] = useState<Set<string>>(new Set());
  const [courierModalOpen, setCourierModalOpen] = useState(false);
  const [courierOrder, setCourierOrder] = useState<Order | null>(null);
  const [bulkCourierModalOpen, setBulkCourierModalOpen] = useState(false);
  const [verificationModalOpen, setVerificationModalOpen] = useState(false);
  const [verificationOrder, setVerificationOrder] = useState<Order | null>(null);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [quickStatusOrder, setQuickStatusOrder] = useState<Order | null>(null);
  const [quickStatusOpen, setQuickStatusOpen] = useState(false);
  

  const openCourierModal = (order: Order) => { setCourierOrder(order); setCourierModalOpen(true); };
  const openBulkCourierModal = () => { setBulkCourierModalOpen(true); };
  const openVerificationModal = (order: Order) => { setVerificationOrder(order); setVerificationModalOpen(true); };

  const handleTagsChange = (orderId: string, tags: string[]) => { updateTags({ orderId, tags }); };

  const handleVerifyPayment = (orderId: string, status: 'paid' | 'failed', notes: string) => {
    verifyPayment({ orderId, paymentStatus: status, notes });
    setVerificationModalOpen(false);
    setVerificationOrder(null);
  };

  const filteredOrders = useMemo(() => {
    let result = [...orders];
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(o =>
        o.order_number.toLowerCase().includes(query) ||
        o.customer_name.toLowerCase().includes(query) ||
        o.customer_email.toLowerCase().includes(query) ||
        o.customer_phone.includes(query)
      );
    }
    if (statusFilter !== "all") {
      result = result.filter(o => o.status === statusFilter);
    }
    return result;
  }, [orders, searchQuery, statusFilter]);

  const { sortedData: sortedOrders, sortKey, sortDirection, handleSort } = useSorting(filteredOrders);
  const { paginatedData: paginatedOrders, currentPage, pageSize, totalPages, totalItems, goToPage, changePageSize } = usePagination(sortedOrders, { initialPageSize: 10 });

  const exportColumns = [
    { key: "order_number" as const, header: "Order #" },
    { key: "customer_name" as const, header: "Customer" },
    { key: "customer_email" as const, header: "Email" },
    { key: "customer_phone" as const, header: "Phone" },
    { key: "total" as const, header: "Total" },
    { key: "status" as const, header: "Status" },
    { key: "payment_status" as const, header: "Payment Status" },
    { key: "payment_method" as const, header: "Payment Method" },
    { key: "created_at" as const, header: "Date" },
  ];

  const handleUpdateStatus = (orderId: string, newStatus: OrderStatus) => { updateStatus({ orderId, status: newStatus }); };
  const handleUpdatePaymentStatus = (orderId: string, paymentStatus: string) => { updatePaymentStatus({ orderId, paymentStatus }); };

  const viewDetails = (order: Order) => { setSelectedOrder(order); setDetailsOpen(true); };

  const generateInvoice = (order: Order) => {
    const invoiceData = orderToInvoiceData({
      order_number: order.order_number, created_at: order.created_at, customer_name: order.customer_name,
      customer_email: order.customer_email, customer_phone: order.customer_phone, shipping_address: order.shipping_address,
      items: order.items, subtotal: order.subtotal, shipping_cost: order.shipping_cost, discount: order.discount,
      total: order.total, payment_method: order.payment_method, payment_status: order.payment_status,
    });
    generateInvoicePDF(invoiceData);
  };

  const handlePrintPackingSlip = (order: Order) => {
    generatePackingSlip({
      order_number: order.order_number, created_at: order.created_at, customer_name: order.customer_name,
      customer_phone: order.customer_phone, shipping_address: getShippingAddressString(order.shipping_address),
      items: order.items.map(item => ({ product_name: item.product_name, quantity: item.quantity, unit_price: item.unit_price })),
      notes: order.notes,
    });
    toast.success('Packing slip downloaded');
  };

  const handleDuplicateOrder = async (order: Order) => {
    try {
      const newOrderNumber = `ORD-${Date.now().toString(36).toUpperCase()}`;
      const { data: newOrder, error: orderError } = await supabase
        .from('orders' as any)
        .insert({
          order_number: newOrderNumber, customer_id: order.customer_id, user_id: order.user_id,
          shipping_address: order.shipping_address, subtotal: order.subtotal, shipping_cost: order.shipping_cost,
          discount_amount: order.discount, total_amount: order.total, status: 'pending',
          payment_method: order.payment_method, payment_status: 'pending',
          notes: order.notes ? `[Duplicated from ${order.order_number}] ${order.notes}` : `Duplicated from ${order.order_number}`,
        })
        .select('id').single();
      if (orderError) throw orderError;
      if (order.items.length > 0 && newOrder) {
        const newItems = order.items.map(item => ({
          order_id: (newOrder as any).id, product_id: item.product_id, product_name: item.product_name,
          unit_price: item.unit_price, quantity: item.quantity, total_price: item.total_price,
        }));
        const { error: itemsError } = await supabase.from('order_items' as any).insert(newItems);
        if (itemsError) throw itemsError;
      }
      toast.success(`Order duplicated as ${newOrderNumber}`);
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
    } catch (error: any) {
      toast.error(`Failed to duplicate order: ${error.message}`);
    }
  };

  const formatDate = (dateString: string) => {
    try { return format(new Date(dateString), 'MMM dd, yyyy HH:mm'); } catch { return dateString; }
  };

  // Bulk selection
  const toggleSelectOrder = (orderId: string) => {
    setSelectedOrderIds(prev => { const s = new Set(prev); s.has(orderId) ? s.delete(orderId) : s.add(orderId); return s; });
  };
  const toggleSelectAll = () => {
    setSelectedOrderIds(selectedOrderIds.size === filteredOrders.length ? new Set() : new Set(filteredOrders.map(o => o.id)));
  };
  const clearSelection = () => { setSelectedOrderIds(new Set()); };
  const selectedOrders = useMemo(() => orders.filter(o => selectedOrderIds.has(o.id)), [orders, selectedOrderIds]);

  // Bulk actions
  const handleBulkStatusUpdate = (newStatus: OrderStatus) => {
    selectedOrderIds.forEach(orderId => updateStatus({ orderId, status: newStatus }));
    toast.success(`${selectedOrderIds.size} orders status updated to ${statusConfig[newStatus].label}`);
    clearSelection();
  };
  const handleBulkPaymentUpdate = (paymentStatus: string) => {
    selectedOrderIds.forEach(orderId => updatePaymentStatus({ orderId, paymentStatus }));
    toast.success(`${selectedOrderIds.size} orders payment updated to ${paymentStatusConfig[paymentStatus].label}`);
    clearSelection();
  };
  const handleBulkInvoiceDownload = () => { selectedOrders.forEach(o => generateInvoice(o)); toast.success(`${selectedOrders.length} invoices downloaded`); };
  const handleBulkInvoicePrint = () => {
    const invoicesData = selectedOrders.map(order => orderToInvoiceData({
      order_number: order.order_number, created_at: order.created_at, customer_name: order.customer_name,
      customer_email: order.customer_email, customer_phone: order.customer_phone, shipping_address: order.shipping_address,
      items: order.items, subtotal: order.subtotal, shipping_cost: order.shipping_cost, discount: order.discount,
      total: order.total, payment_method: order.payment_method, payment_status: order.payment_status,
    }));
    generateBulkInvoicePDF(invoicesData);
    toast.success(`${selectedOrders.length} invoices combined into one PDF`);
  };
  const handleBulkDelete = () => {
    selectedOrderIds.forEach(orderId => deleteOrder(orderId));
    toast.success(`${selectedOrderIds.size} orders moved to trash`);
    clearSelection();
    setBulkDeleteOpen(false);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div><Skeleton className="h-8 w-32 mb-2" /><Skeleton className="h-4 w-48" /></div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-24" />)}</div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        <AdminPageHeader
          title="Orders"
          description={`Manage and track customer orders (${orders.length} total)`}
        />

        <Tabs defaultValue="orders" className="space-y-6">
          <TabsList>
            <TabsTrigger value="orders">All Orders</TabsTrigger>
            <TabsTrigger value="returns">Return/Refund Requests</TabsTrigger>
          </TabsList>

          <TabsContent value="returns"><ReturnRequestsTab /></TabsContent>

          <TabsContent value="orders" className="space-y-6">
            <OrderStatsCards stats={stats} />

            {/* Filters & Export */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center flex-1">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input placeholder="Search orders, customers..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-44 bg-card"><SelectValue placeholder="Filter by status" /></SelectTrigger>
                  <SelectContent className="bg-popover">
                    <SelectItem value="all">All Status</SelectItem>
                    {Object.entries(statusConfig).map(([key, config]) => <SelectItem key={key} value={key}>{config.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <DataExport data={sortedOrders} filename={`orders-${format(new Date(), 'yyyy-MM-dd')}`} columns={exportColumns} />
            </div>

            {/* Bulk Actions Bar */}
            {selectedOrderIds.size > 0 && (
              <Card className="border-primary/50 bg-primary/5">
                <CardContent className="p-3">
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="font-medium">{selectedOrderIds.size} selected</Badge>
                      <Button variant="ghost" size="sm" onClick={clearSelection} className="h-7 px-2"><X className="h-4 w-4" /></Button>
                    </div>
                    <Separator orientation="vertical" className="h-6" />
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild><Button variant="outline" size="sm" className="h-8"><Package className="mr-2 h-4 w-4" />Update Status</Button></DropdownMenuTrigger>
                      <DropdownMenuContent className="bg-popover">
                        {Object.entries(statusConfig).map(([key, config]) => <DropdownMenuItem key={key} onClick={() => handleBulkStatusUpdate(key as OrderStatus)}><config.icon className="mr-2 h-4 w-4" />{config.label}</DropdownMenuItem>)}
                      </DropdownMenuContent>
                    </DropdownMenu>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild><Button variant="outline" size="sm" className="h-8"><CreditCard className="mr-2 h-4 w-4" />Update Payment</Button></DropdownMenuTrigger>
                      <DropdownMenuContent className="bg-popover">
                        {Object.entries(paymentStatusConfig).map(([key, config]) => <DropdownMenuItem key={key} onClick={() => handleBulkPaymentUpdate(key)}>{config.label}</DropdownMenuItem>)}
                      </DropdownMenuContent>
                    </DropdownMenu>
                    <Button variant="outline" size="sm" className="h-8" onClick={handleBulkInvoiceDownload}><Download className="mr-2 h-4 w-4" />Download Invoices</Button>
                    <Button variant="outline" size="sm" className="h-8" onClick={handleBulkInvoicePrint}><Printer className="mr-2 h-4 w-4" />Print All Invoices</Button>
                    <Button variant="outline" size="sm" className="h-8" onClick={openBulkCourierModal}><Send className="mr-2 h-4 w-4" />Send to Courier</Button>
                    <Button variant="outline" size="sm" className="h-8 text-destructive hover:text-destructive" onClick={() => setBulkDeleteOpen(true)}><Trash2 className="mr-2 h-4 w-4" />Move to Trash</Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Orders Table */}
            {isMobile ? (
              <div className="space-y-3">
                {paginatedOrders.length === 0 ? (
                  <Card><CardContent className="flex flex-col items-center gap-2 py-12"><ShoppingBag className="h-8 w-8 text-muted-foreground" /><p className="text-muted-foreground">No orders found</p></CardContent></Card>
                ) : (
                  paginatedOrders.map((order) => (
                    <MobileOrderCard key={order.id} order={order} onViewDetails={viewDetails} onUpdateStatus={handleUpdateStatus} onGenerateInvoice={generateInvoice} onPrintPackingSlip={handlePrintPackingSlip} onSendToCourier={openCourierModal} onVerifyPayment={openVerificationModal} onDuplicate={handleDuplicateOrder} onDelete={(orderId) => deleteOrder(orderId)} />
                  ))
                )}
                {totalItems > 0 && <TablePagination currentPage={currentPage} totalPages={totalPages} pageSize={pageSize} totalItems={totalItems} onPageChange={goToPage} onPageSizeChange={changePageSize} />}
              </div>
            ) : (
              <Card>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="w-12"><Checkbox checked={paginatedOrders.length > 0 && selectedOrderIds.size === paginatedOrders.length} onCheckedChange={toggleSelectAll} aria-label="Select all" /></TableHead>
                        <SortableTableHead sortKey="order_number" currentSortKey={sortKey} currentDirection={sortDirection} onSort={handleSort}>Order</SortableTableHead>
                        <SortableTableHead sortKey="customer_name" currentSortKey={sortKey} currentDirection={sortDirection} onSort={handleSort}>Customer</SortableTableHead>
                        <TableHead>Items</TableHead>
                        <SortableTableHead sortKey="total" currentSortKey={sortKey} currentDirection={sortDirection} onSort={handleSort} className="text-right">Total</SortableTableHead>
                        <SortableTableHead sortKey="payment_status" currentSortKey={sortKey} currentDirection={sortDirection} onSort={handleSort}>Payment</SortableTableHead>
                        <SortableTableHead sortKey="status" currentSortKey={sortKey} currentDirection={sortDirection} onSort={handleSort}>Status</SortableTableHead>
                        <SortableTableHead sortKey="created_at" currentSortKey={sortKey} currentDirection={sortDirection} onSort={handleSort}>Date</SortableTableHead>
                        <TableHead className="w-12"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedOrders.length === 0 ? (
                        <TableRow><TableCell colSpan={9} className="h-32 text-center"><div className="flex flex-col items-center gap-2"><ShoppingBag className="h-8 w-8 text-muted-foreground" /><p className="text-muted-foreground">No orders found</p></div></TableCell></TableRow>
                      ) : (
                        paginatedOrders.map((order) => {
                          const StatusIcon = statusConfig[order.status]?.icon || Clock;
                          const statusStyle = statusConfig[order.status]?.color || statusConfig.pending.color;
                          const statusLabel = statusConfig[order.status]?.label || order.status;
                          const isSelected = selectedOrderIds.has(order.id);
                          return (
                            <TableRow key={order.id} className={cn(isSelected && "bg-primary/5")}>
                              <TableCell><Checkbox checked={isSelected} onCheckedChange={() => toggleSelectOrder(order.id)} aria-label={`Select order ${order.order_number}`} /></TableCell>
                              <TableCell><p className="font-medium text-foreground">{order.order_number}</p></TableCell>
                              <TableCell><div><p className="font-medium text-foreground">{order.customer_name}</p><p className="text-xs text-muted-foreground">{order.customer_phone || order.customer_email}</p></div></TableCell>
                              <TableCell><span className="text-sm text-muted-foreground">{order.items.length} item{order.items.length !== 1 ? 's' : ''}</span></TableCell>
                              <TableCell className="text-right font-medium">{formatPrice(order.total)}</TableCell>
                              <TableCell>
                                <div className="flex flex-col gap-1">
                                  <div className="flex items-center gap-1">
                                    <span className="text-xs text-muted-foreground">{order.payment_method}</span>
                                    {order.payment_verified_at && <span title="Verified"><ShieldCheck className="h-3 w-3 text-success" /></span>}
                                  </div>
                                  <Select value={order.payment_status} onValueChange={(value) => handleUpdatePaymentStatus(order.id, value)}>
                                    <SelectTrigger className={cn("h-7 w-24 text-xs border", paymentStatusConfig[order.payment_status]?.color)}><SelectValue /></SelectTrigger>
                                    <SelectContent className="bg-popover">{Object.entries(paymentStatusConfig).map(([key, config]) => <SelectItem key={key} value={key}>{config.label}</SelectItem>)}</SelectContent>
                                  </Select>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex flex-col gap-1">
                                  <Badge variant="outline" className={cn("gap-1", statusStyle)}><StatusIcon className="h-3 w-3" />{statusLabel}</Badge>
                                  {order.refund_status !== 'none' && (
                                    <Badge variant="outline" className={cn("text-[10px] gap-0.5", refundStatusConfig[order.refund_status as RefundStatus]?.color)}><RotateCcw className="h-2.5 w-2.5" />{refundStatusConfig[order.refund_status as RefundStatus]?.label}</Badge>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className="text-sm text-muted-foreground">
                                <div className="flex flex-col gap-1">
                                  <span>{formatDate(order.created_at)}</span>
                                  {order.tags && order.tags.length > 0 && (
                                    <div className="flex gap-0.5 flex-wrap">
                                      {order.tags.slice(0, 2).map(tag => <Badge key={tag} variant="outline" className="text-[10px] px-1 py-0">{tag}</Badge>)}
                                      {order.tags.length > 2 && <Badge variant="outline" className="text-[10px] px-1 py-0">+{order.tags.length - 2}</Badge>}
                                    </div>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="h-4 w-4" /></Button></DropdownMenuTrigger>
                                  <DropdownMenuContent align="end" className="w-48 bg-popover">
                                    <DropdownMenuItem onClick={() => viewDetails(order)}><Eye className="mr-2 h-4 w-4" />View Details</DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => generateInvoice(order)}><FileText className="mr-2 h-4 w-4" />Download Invoice</DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handlePrintPackingSlip(order)}><Printer className="mr-2 h-4 w-4" />Print Packing Slip</DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => openCourierModal(order)}><Send className="mr-2 h-4 w-4" />Send to Courier</DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => openVerificationModal(order)} className="text-primary"><ShieldCheck className="mr-2 h-4 w-4" />Verify Payment</DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleDuplicateOrder(order)}><Copy className="mr-2 h-4 w-4" />Duplicate Order</DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem disabled className="text-xs text-muted-foreground">Update Status</DropdownMenuItem>
                                    {Object.entries(statusConfig).map(([key, config]) => (
                                      <DropdownMenuItem key={key} onClick={() => handleUpdateStatus(order.id, key as OrderStatus)} disabled={order.status === key} className="pl-6"><config.icon className="mr-2 h-3 w-3" />{config.label}</DropdownMenuItem>
                                    ))}
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={() => deleteOrder(order.id)} className="text-destructive focus:text-destructive"><Trash2 className="mr-2 h-4 w-4" />Move to Trash</DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </TableCell>
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                  {totalItems > 0 && <TablePagination currentPage={currentPage} totalPages={totalPages} pageSize={pageSize} totalItems={totalItems} onPageChange={goToPage} onPageSizeChange={changePageSize} />}
                </CardContent>
              </Card>
            )
            }
          </TabsContent>
        </Tabs>

        {/* Order Details Modal */}
        <OrderDetailDialog
          open={detailsOpen}
          onOpenChange={setDetailsOpen}
          order={selectedOrder}
          onGenerateInvoice={generateInvoice}
          onPrintPackingSlip={handlePrintPackingSlip}
          onDuplicateOrder={handleDuplicateOrder}
          onUpdatePaymentStatus={handleUpdatePaymentStatus}
          onTagsChange={handleTagsChange}
        />

        {/* Courier Modals */}
        <SendToCourierModal
          open={courierModalOpen} onOpenChange={setCourierModalOpen}
          order={courierOrder ? { id: courierOrder.id, order_number: courierOrder.order_number, customer_name: courierOrder.customer_name, customer_phone: courierOrder.customer_phone, customer_email: courierOrder.customer_email, shipping_address: courierOrder.shipping_address, total: courierOrder.total, items: courierOrder.items.map(item => ({ product_name: item.product_name, quantity: item.quantity })) } : null}
          onSuccess={() => { handleUpdateStatus(courierOrder!.id, 'shipped'); }}
        />
        <BulkSendToCourierModal
          open={bulkCourierModalOpen} onOpenChange={setBulkCourierModalOpen}
          orders={selectedOrders.map(order => ({ id: order.id, order_number: order.order_number, customer_name: order.customer_name, customer_phone: order.customer_phone, customer_email: order.customer_email, shipping_address: order.shipping_address, total: order.total, items: order.items.map(item => ({ product_name: item.product_name, quantity: item.quantity })) }))}
          onSuccess={(successfulIds) => { successfulIds.forEach(id => handleUpdateStatus(id, 'shipped')); clearSelection(); }}
        />
        <PaymentVerificationModal
          open={verificationModalOpen} onOpenChange={setVerificationModalOpen}
          order={verificationOrder ? { id: verificationOrder.id, order_number: verificationOrder.order_number, customer_name: verificationOrder.customer_name, customer_phone: verificationOrder.customer_phone, payment_method: verificationOrder.payment_method, payment_status: verificationOrder.payment_status, total: verificationOrder.total, notes: verificationOrder.notes, created_at: verificationOrder.created_at, payment_verified_at: verificationOrder.payment_verified_at, payment_verification_notes: verificationOrder.payment_verification_notes } : null}
          onVerify={handleVerifyPayment} isVerifying={isVerifying}
        />
        <DeleteConfirmModal open={bulkDeleteOpen} onOpenChange={setBulkDeleteOpen} onConfirm={handleBulkDelete} title="Move to Trash" description={`${selectedOrderIds.size} orders will be moved to trash. You can restore them later from Global Trash.`} />
        <MobileQuickStatusDrawer open={quickStatusOpen} onOpenChange={setQuickStatusOpen} order={quickStatusOrder} onUpdateStatus={handleUpdateStatus} />
      </div>
    </>
  );
}
