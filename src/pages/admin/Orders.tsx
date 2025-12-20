import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { CheckCircle2, XCircle, Clock, CreditCard, Banknote, Smartphone, Eye, Copy, Check, Search, MessageCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';

export default function AdminOrders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [showOrderDialog, setShowOrderDialog] = useState(false);
  const [filterTab, setFilterTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedUtr, setCopiedUtr] = useState(false);

  useEffect(() => { fetchOrders(); }, []);

  const fetchOrders = async () => {
    const { data } = await supabase.from('orders').select('*, order_items(*)').order('created_at', { ascending: false });
    setOrders(data || []);
    setLoading(false);
  };

  const updateStatus = async (id: string, status: string, order?: any) => {
    await supabase.from('orders').update({ status }).eq('id', id);
    toast.success('Status updated');
    fetchOrders();
    
    // Offer to send WhatsApp notification
    if (order?.shipping_address?.phone) {
      const shouldNotify = window.confirm('Send WhatsApp notification to customer?');
      if (shouldNotify) {
        sendWhatsAppNotification(order, status);
      }
    }
  };

  const getStatusMessage = (status: string): string => {
    const messages: Record<string, string> = {
      pending: 'Your order has been received and is pending confirmation.',
      awaiting_payment: 'We are waiting for your payment confirmation.',
      confirmed: 'Great news! Your order has been confirmed and is being processed.',
      shipped: 'Your order has been shipped and is on the way!',
      delivered: 'Your order has been delivered. Thank you for shopping with us!',
      cancelled: 'Your order has been cancelled. If you have any questions, please contact us.',
    };
    return messages[status] || 'Your order status has been updated.';
  };

  const formatPhoneForWhatsApp = (phone: string): string => {
    // Remove all non-digit characters
    let cleaned = phone.replace(/\D/g, '');
    
    // If starts with 0, remove it and add 91 (India)
    if (cleaned.startsWith('0')) {
      cleaned = '91' + cleaned.substring(1);
    }
    // If doesn't start with country code, add 91 (India)
    else if (!cleaned.startsWith('91') && cleaned.length === 10) {
      cleaned = '91' + cleaned;
    }
    
    return cleaned;
  };

  const sendWhatsAppNotification = (order: any, status?: string) => {
    const phone = order.shipping_address?.phone;
    if (!phone) {
      toast.error('Customer phone number not available');
      return;
    }

    const formattedPhone = formatPhoneForWhatsApp(phone);
    const orderStatus = status || order.status;
    const orderId = order.id.slice(0, 8).toUpperCase();
    const customerName = order.shipping_address?.fullName || 'Customer';
    const totalAmount = order.total_amount?.toLocaleString() || '0';
    const itemCount = order.order_items?.length || 0;
    const statusMessage = getStatusMessage(orderStatus);

    // Create WhatsApp message
    const message = `🛍️ *LUXE Order Update*

Hello ${customerName}!

*Order ID:* #${orderId}
*Status:* ${orderStatus.replace('_', ' ').toUpperCase()}

${statusMessage}

📦 *Order Details:*
• Items: ${itemCount}
• Total: ₹${totalAmount}

${orderStatus === 'shipped' ? '🚚 Track your order in your account.' : ''}

Thank you for shopping with LUXE!
For any queries, reply to this message.`;

    // Open WhatsApp with pre-filled message
    const whatsappUrl = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
    
    toast.success('Opening WhatsApp...');
  };

  const verifyUpiPayment = async (orderId: string) => {
    await supabase.from('orders').update({ status: 'confirmed' }).eq('id', orderId);
    toast.success('Payment verified and order confirmed!');
    setShowOrderDialog(false);
    fetchOrders();
  };

  const rejectUpiPayment = async (orderId: string) => {
    await supabase.from('orders').update({ status: 'cancelled' }).eq('id', orderId);
    toast.error('Payment rejected and order cancelled');
    setShowOrderDialog(false);
    fetchOrders();
  };

  const copyUtr = (utr: string) => {
    navigator.clipboard.writeText(utr);
    setCopiedUtr(true);
    toast.success('UTR copied!');
    setTimeout(() => setCopiedUtr(false), 2000);
  };

  const getUtrFromPaymentId = (paymentId: string | null) => {
    if (!paymentId) return null;
    if (paymentId.startsWith('UTR:')) {
      return paymentId.replace('UTR:', '');
    }
    return null;
  };

  const statusColors: Record<string, string> = { 
    pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400', 
    awaiting_payment: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
    confirmed: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400', 
    shipped: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400', 
    delivered: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400', 
    cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' 
  };

  const paymentMethodIcons: Record<string, React.ReactNode> = {
    razorpay: <CreditCard className="h-4 w-4" />,
    upi: <Smartphone className="h-4 w-4" />,
    cod: <Banknote className="h-4 w-4" />,
  };

  // Filter orders
  const filteredOrders = orders.filter(order => {
    // Filter by tab
    if (filterTab === 'pending_upi') {
      if (order.status !== 'awaiting_payment' || order.payment_method !== 'upi') return false;
    } else if (filterTab === 'with_utr') {
      if (!getUtrFromPaymentId(order.payment_id)) return false;
    } else if (filterTab !== 'all') {
      if (order.status !== filterTab) return false;
    }

    // Filter by search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const orderId = order.id.toLowerCase();
      const utr = getUtrFromPaymentId(order.payment_id)?.toLowerCase() || '';
      const customerName = order.shipping_address?.fullName?.toLowerCase() || '';
      const phone = order.shipping_address?.phone?.toLowerCase() || '';
      
      return orderId.includes(query) || utr.includes(query) || customerName.includes(query) || phone.includes(query);
    }

    return true;
  });

  const pendingUpiCount = orders.filter(o => o.status === 'awaiting_payment' && o.payment_method === 'upi').length;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h1 className="font-display text-3xl font-bold">Orders</h1>
          
          {/* Search */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search orders, UTR..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {/* Filter Tabs */}
        <Tabs value={filterTab} onValueChange={setFilterTab}>
          <TabsList className="flex-wrap h-auto gap-1">
            <TabsTrigger value="all">All Orders</TabsTrigger>
            <TabsTrigger value="pending_upi" className="relative">
              Pending UPI
              {pendingUpiCount > 0 && (
                <span className="ml-1.5 bg-orange-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                  {pendingUpiCount}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="with_utr">With UTR</TabsTrigger>
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="confirmed">Confirmed</TabsTrigger>
            <TabsTrigger value="shipped">Shipped</TabsTrigger>
            <TabsTrigger value="delivered">Delivered</TabsTrigger>
          </TabsList>

          <TabsContent value={filterTab} className="mt-4">
            {loading ? (
              <div className="space-y-4">
                {[1,2,3].map(i => <div key={i} className="h-24 bg-muted animate-pulse rounded-lg" />)}
              </div>
            ) : filteredOrders.length === 0 ? (
              <Card className="p-8 text-center text-muted-foreground">
                No orders found
              </Card>
            ) : (
              <div className="space-y-4">
                {filteredOrders.map((order) => {
                  const utr = getUtrFromPaymentId(order.payment_id);
                  const isAwaitingPayment = order.status === 'awaiting_payment';
                  const isUpiOrder = order.payment_method === 'upi';

                  return (
                    <Card key={order.id} className={`p-4 ${isAwaitingPayment && isUpiOrder ? 'border-orange-500 border-2' : ''}`}>
                      <div className="flex flex-col gap-4">
                        {/* Header Row */}
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <p className="font-medium">#{order.id.slice(0,8).toUpperCase()}</p>
                              {paymentMethodIcons[order.payment_method] && (
                                <span className="text-muted-foreground flex items-center gap-1 text-sm">
                                  {paymentMethodIcons[order.payment_method]}
                                  {order.payment_method?.toUpperCase()}
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {new Date(order.created_at).toLocaleString()}
                            </p>
                            <p className="text-sm">
                              Items: {order.order_items?.length || 0} • ₹{order.total_amount.toLocaleString()}
                            </p>
                            {order.shipping_address && (
                              <p className="text-sm text-muted-foreground">
                                {order.shipping_address.fullName} • {order.shipping_address.phone}
                              </p>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge className={statusColors[order.status] || statusColors.pending}>
                              {order.status.replace('_', ' ')}
                            </Badge>
                            <Select value={order.status} onValueChange={(v) => updateStatus(order.id, v, order)}>
                              <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="pending">Pending</SelectItem>
                                <SelectItem value="awaiting_payment">Awaiting Payment</SelectItem>
                                <SelectItem value="confirmed">Confirmed</SelectItem>
                                <SelectItem value="shipped">Shipped</SelectItem>
                                <SelectItem value="delivered">Delivered</SelectItem>
                                <SelectItem value="cancelled">Cancelled</SelectItem>
                              </SelectContent>
                            </Select>
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="text-green-600 hover:text-green-700 hover:bg-green-50"
                              onClick={() => sendWhatsAppNotification(order)}
                              title="Send WhatsApp Update"
                            >
                              <MessageCircle className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => {
                                setSelectedOrder(order);
                                setShowOrderDialog(true);
                              }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>

                        {/* UTR Section for UPI Orders */}
                        {isUpiOrder && (
                          <div className={`p-3 rounded-lg ${isAwaitingPayment ? 'bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800' : 'bg-secondary/50'}`}>
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                              <div className="flex items-center gap-2">
                                {isAwaitingPayment ? (
                                  <Clock className="h-5 w-5 text-orange-500" />
                                ) : order.status === 'confirmed' || order.status === 'shipped' || order.status === 'delivered' ? (
                                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                                ) : (
                                  <XCircle className="h-5 w-5 text-red-500" />
                                )}
                                <div>
                                  <p className="text-sm font-medium">
                                    {isAwaitingPayment ? 'Payment Pending Verification' : 'UPI Payment'}
                                  </p>
                                  {utr ? (
                                    <div className="flex items-center gap-2 mt-1">
                                      <span className="text-xs text-muted-foreground">UTR:</span>
                                      <code className="text-xs bg-background px-2 py-0.5 rounded font-mono">
                                        {utr}
                                      </code>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-6 w-6 p-0"
                                        onClick={() => copyUtr(utr)}
                                      >
                                        {copiedUtr ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                                      </Button>
                                    </div>
                                  ) : (
                                    <p className="text-xs text-muted-foreground">No UTR provided</p>
                                  )}
                                </div>
                              </div>

                              {isAwaitingPayment && (
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    variant="default"
                                    className="bg-green-600 hover:bg-green-700"
                                    onClick={() => verifyUpiPayment(order.id)}
                                  >
                                    <CheckCircle2 className="h-4 w-4 mr-1" />
                                    Verify
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => rejectUpiPayment(order.id)}
                                  >
                                    <XCircle className="h-4 w-4 mr-1" />
                                    Reject
                                  </Button>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Order Detail Dialog */}
      <Dialog open={showOrderDialog} onOpenChange={setShowOrderDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Order Details</DialogTitle>
            <DialogDescription>
              Order #{selectedOrder?.id.slice(0,8).toUpperCase()}
            </DialogDescription>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-6">
              {/* Order Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge className={statusColors[selectedOrder.status]}>
                    {selectedOrder.status.replace('_', ' ')}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Payment Method</p>
                  <p className="font-medium flex items-center gap-2">
                    {paymentMethodIcons[selectedOrder.payment_method]}
                    {selectedOrder.payment_method?.toUpperCase() || 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Amount</p>
                  <p className="font-medium">₹{selectedOrder.total_amount.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Order Date</p>
                  <p className="font-medium">{new Date(selectedOrder.created_at).toLocaleString()}</p>
                </div>
              </div>

              {/* Payment ID / UTR */}
              {selectedOrder.payment_id && (
                <div className="p-4 bg-secondary/50 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">Payment Reference</p>
                  <div className="flex items-center gap-2">
                    <code className="font-mono text-sm bg-background px-3 py-1.5 rounded">
                      {selectedOrder.payment_id}
                    </code>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        navigator.clipboard.writeText(selectedOrder.payment_id);
                        toast.success('Copied!');
                      }}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}

              {/* Shipping Address */}
              {selectedOrder.shipping_address && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Shipping Address</p>
                  <div className="p-4 bg-secondary/50 rounded-lg space-y-1">
                    <p className="font-medium">{selectedOrder.shipping_address.fullName}</p>
                    <p className="text-sm">{selectedOrder.shipping_address.phone}</p>
                    <p className="text-sm">{selectedOrder.shipping_address.address}</p>
                    <p className="text-sm">
                      {selectedOrder.shipping_address.city}, {selectedOrder.shipping_address.state} - {selectedOrder.shipping_address.pincode}
                    </p>
                  </div>
                </div>
              )}

              {/* Order Items */}
              <div>
                <p className="text-sm text-muted-foreground mb-2">Order Items</p>
                <div className="space-y-2">
                  {selectedOrder.order_items?.map((item: any) => (
                    <div key={item.id} className="flex items-center gap-3 p-3 bg-secondary/50 rounded-lg">
                      {item.product_image && (
                        <img 
                          src={item.product_image} 
                          alt={item.product_name}
                          className="w-12 h-12 object-cover rounded"
                        />
                      )}
                      <div className="flex-1">
                        <p className="font-medium">{item.product_name}</p>
                        <p className="text-sm text-muted-foreground">
                          Qty: {item.quantity}
                          {item.size && ` • Size: ${item.size}`}
                          {item.color && ` • ${item.color}`}
                        </p>
                      </div>
                      <p className="font-medium">₹{(item.price * item.quantity).toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* WhatsApp Button */}
              <div className="pt-4 border-t">
                <Button
                  variant="outline"
                  className="w-full text-green-600 hover:text-green-700 hover:bg-green-50 border-green-200"
                  onClick={() => sendWhatsAppNotification(selectedOrder)}
                >
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Send WhatsApp Update
                </Button>
              </div>

              {/* Action Buttons for Pending UPI */}
              {selectedOrder.status === 'awaiting_payment' && selectedOrder.payment_method === 'upi' && (
                <div className="flex gap-3">
                  <Button
                    className="flex-1 bg-green-600 hover:bg-green-700"
                    onClick={() => verifyUpiPayment(selectedOrder.id)}
                  >
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Verify Payment
                  </Button>
                  <Button
                    variant="destructive"
                    className="flex-1"
                    onClick={() => rejectUpiPayment(selectedOrder.id)}
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Reject Payment
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
