import { useState, useEffect, forwardRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { usePaperflyCourier, PaperflyParcel } from "@/hooks/usePaperflyCourier";
import { useShipmentsData } from "@/hooks/useShipmentsData";
import { Loader2, Package, RefreshCw, Search, Send, Truck, Clock, CheckCircle, RotateCcw } from "lucide-react";
import { formatPrice } from "@/lib/formatPrice";

interface PaperflyTabProps {
  pendingOrders: any[];
}

const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  pending: { label: "Pending", color: "bg-yellow-100 text-yellow-800", icon: Clock },
  picked_up: { label: "Picked Up", color: "bg-blue-100 text-blue-800", icon: Package },
  in_transit: { label: "In Transit", color: "bg-purple-100 text-purple-800", icon: Truck },
  out_for_delivery: { label: "Out for Delivery", color: "bg-indigo-100 text-indigo-800", icon: Truck },
  delivered: { label: "Delivered", color: "bg-green-100 text-green-800", icon: CheckCircle },
  returned: { label: "Returned", color: "bg-red-100 text-red-800", icon: RotateCcw },
  cancelled: { label: "Cancelled", color: "bg-gray-100 text-gray-800", icon: Package },
};

export const PaperflyTab = forwardRef<HTMLDivElement, PaperflyTabProps>(function PaperflyTab({ pendingOrders }, ref) {
  const paperfly = usePaperflyCourier();
  const { loading: shipmentsLoading, addShipment, getShipmentsByCourier, refetch } = useShipmentsData();

  const [trackingSearch, setTrackingSearch] = useState("");
  const [trackingResult, setTrackingResult] = useState<any>(null);
  const [sendDialogOpen, setSendDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [connectionStatus, setConnectionStatus] = useState<'unknown' | 'connected' | 'error'>('unknown');

  const paperflyShipments = getShipmentsByCourier('paperfly');

  useEffect(() => {
    checkConnection();
  }, []);

  const checkConnection = async () => {
    try {
      await paperfly.testConnection();
      setConnectionStatus('connected');
    } catch {
      setConnectionStatus('error');
    }
  };

  const handleTrack = async () => {
    if (!trackingSearch.trim()) {
      toast.error('Please enter a tracking code');
      return;
    }
    try {
      const result = await paperfly.trackParcel(trackingSearch);
      setTrackingResult(result?.data || result);
    } catch (error) {
      console.error('Tracking error:', error);
    }
  };

  const handleSendToPaperfly = async () => {
    if (!selectedOrder) return;
    try {
      const shippingAddress = typeof selectedOrder.shipping_address === 'string'
        ? selectedOrder.shipping_address
        : `${selectedOrder.shipping_address?.street || ''}, ${selectedOrder.shipping_address?.city || ''}`;

      const parcel: PaperflyParcel = {
        customer_name: selectedOrder.customer_name,
        customer_mobile: selectedOrder.customer_phone,
        customer_address: shippingAddress,
        customer_invoice: selectedOrder.order_number,
        cash_collection: selectedOrder.payment_method === 'cod' ? selectedOrder.total : 0,
        special_instruction: selectedOrder.notes || '',
        parcel_weight: 0.5,
      };

      const result = await paperfly.createParcel(parcel);
      const trackingCode = result?.tracking_code || result?.data?.tracking_code;

      if (trackingCode) {
        await addShipment({
          order_id: selectedOrder.id,
          courier: 'paperfly',
          tracking_number: trackingCode,
          status: 'pending',
          courier_response: {
            recipient_name: selectedOrder.customer_name,
            recipient_phone: selectedOrder.customer_phone,
            recipient_address: shippingAddress,
            cod_amount: selectedOrder.payment_method === 'cod' ? selectedOrder.total : 0,
          },
        });
        toast.success(`Sent to Paperfly. Tracking: ${trackingCode}`);
        setSendDialogOpen(false);
        setSelectedOrder(null);
      }
    } catch (error) {
      console.error('Error sending to Paperfly:', error);
    }
  };

  const openSendDialog = (order: any) => {
    const existingShipment = paperflyShipments.find(s => s.order_id === order.id);
    if (existingShipment) {
      toast.error(`Already sent. Tracking: ${existingShipment.tracking_number}`);
      return;
    }
    setSelectedOrder(order);
    setSendDialogOpen(true);
  };

  if (connectionStatus === 'error') {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="font-semibold mb-2">Paperfly Not Connected</h3>
          <p className="text-sm text-muted-foreground mb-4">Configure Paperfly in Settings &gt; Integrations</p>
          <Button variant="outline" onClick={checkConnection}>
            <RefreshCw className="h-4 w-4 mr-2" />Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div ref={ref} className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Truck className="h-5 w-5 text-blue-500" />
          Paperfly Courier
        </h2>
        <div className="flex items-center gap-2">
          <Badge variant={connectionStatus === 'connected' ? 'default' : 'secondary'}>
            {connectionStatus === 'connected' ? '✓ Connected' : 'Checking...'}
          </Badge>
          <Button variant="outline" onClick={checkConnection} disabled={paperfly.loading}>
            {paperfly.loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
            Refresh
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Search className="h-5 w-5" />Quick Tracking
            </CardTitle>
            <CardDescription>Search by Paperfly tracking code</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Enter tracking code"
                value={trackingSearch}
                onChange={(e) => setTrackingSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleTrack()}
              />
              <Button onClick={handleTrack} disabled={paperfly.loading}>
                {paperfly.loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              </Button>
            </div>
            {trackingResult && (
              <div className="p-4 rounded-lg bg-muted space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Status:</span>
                  <Badge>{trackingResult.status || 'Unknown'}</Badge>
                </div>
                {trackingResult.tracking_code && (
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Tracking:</span>
                    <span className="font-mono text-sm">{trackingResult.tracking_code}</span>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Send className="h-5 w-5" />Pending for Shipping
            </CardTitle>
            <CardDescription>{pendingOrders.length} orders waiting to be shipped</CardDescription>
          </CardHeader>
          <CardContent>
            {pendingOrders.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No pending orders</p>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {pendingOrders.slice(0, 5).map((order) => {
                  const alreadySent = paperflyShipments.some(s => s.order_id === order.id);
                  return (
                    <div key={order.id} className="flex items-center justify-between p-3 rounded-lg border">
                      <div>
                        <p className="font-medium text-sm">{order.order_number}</p>
                        <p className="text-xs text-muted-foreground">{order.customer_name}</p>
                      </div>
                      {alreadySent ? (
                        <Badge variant="secondary">Sent</Badge>
                      ) : (
                        <Button size="sm" onClick={() => openSendDialog(order)}>
                          <Send className="h-3 w-3 mr-1" />Send
                        </Button>
                      )}
                    </div>
                  );
                })}
                {pendingOrders.length > 5 && (
                  <p className="text-xs text-muted-foreground text-center">+{pendingOrders.length - 5} more orders</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Shipment History</CardTitle>
              <CardDescription>All orders sent to Paperfly</CardDescription>
            </div>
            <Button variant="outline" onClick={() => refetch()} disabled={shipmentsLoading}>
              <RefreshCw className="h-4 w-4 mr-2" />Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tracking Code</TableHead>
                <TableHead>Order Number</TableHead>
                <TableHead>Recipient</TableHead>
                <TableHead>COD</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Sent Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paperflyShipments.map((shipment) => {
                const status = statusConfig[shipment.status] || statusConfig.pending;
                const StatusIcon = status.icon;
                return (
                  <TableRow key={shipment.id}>
                    <TableCell className="font-mono text-sm">{shipment.tracking_number || '-'}</TableCell>
                    <TableCell className="font-mono text-sm">{shipment.order_number || '-'}</TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium text-sm">{shipment.recipient_name || '-'}</p>
                        <p className="text-xs text-muted-foreground">{shipment.recipient_phone || '-'}</p>
                      </div>
                    </TableCell>
                    <TableCell>{formatPrice((shipment.cod_amount || 0))}</TableCell>
                    <TableCell>
                      <Badge className={status.color}>
                        <StatusIcon className="h-3 w-3 mr-1" />{status.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(shipment.sent_at || shipment.created_at).toLocaleDateString('en-US')}
                    </TableCell>
                  </TableRow>
                );
              })}
              {paperflyShipments.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    {shipmentsLoading ? <Loader2 className="h-5 w-5 animate-spin mx-auto" /> : 'No shipments found'}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={sendDialogOpen} onOpenChange={setSendDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />Send to Paperfly
            </DialogTitle>
            <DialogDescription>Order: {selectedOrder?.order_number}</DialogDescription>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-muted space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Customer:</span>
                  <span>{selectedOrder.customer_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Phone:</span>
                  <span>{selectedOrder.customer_phone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">COD Amount:</span>
                  <span className="font-medium">
                    {selectedOrder.payment_method === 'cod' ? `${formatPrice(selectedOrder.total)}` : 'Already Paid'}
                  </span>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setSendDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleSendToPaperfly} disabled={paperfly.loading}>
                  {paperfly.loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
                  Confirm & Send
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
});
