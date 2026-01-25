import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { CheckCircle2, XCircle, Clock, Copy, Check, Search, Trash2, MessageCircle, RefreshCw, Smartphone } from 'lucide-react';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface OrderWithUtr {
  id: string;
  created_at: string;
  status: string;
  total_amount: number;
  payment_id: string | null;
  payment_method: string | null;
  shipping_address: any;
  order_items: any[];
}

export default function UtrManagement() {
  const [orders, setOrders] = useState<OrderWithUtr[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterTab, setFilterTab] = useState('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedUtr, setCopiedUtr] = useState<string | null>(null);

  useEffect(() => { fetchOrders(); }, []);

  const fetchOrders = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .eq('payment_method', 'upi')
      .order('created_at', { ascending: false });
    
    setOrders(data || []);
    setLoading(false);
  };

  const getUtrFromPaymentId = (paymentId: string | null): string | null => {
    if (!paymentId) return null;
    if (paymentId.startsWith('UTR:')) {
      return paymentId.replace('UTR:', '');
    }
    return null;
  };

  const copyUtr = (utr: string) => {
    navigator.clipboard.writeText(utr);
    setCopiedUtr(utr);
    toast.success('UTR copied!');
    setTimeout(() => setCopiedUtr(null), 2000);
  };

  const formatPhoneForWhatsApp = (phone: string): string => {
    let cleaned = phone.replace(/\D/g, '');
    if (cleaned.startsWith('0')) {
      cleaned = '91' + cleaned.substring(1);
    } else if (!cleaned.startsWith('91') && cleaned.length === 10) {
      cleaned = '91' + cleaned;
    }
    return cleaned;
  };

  const sendWhatsAppNotification = (order: OrderWithUtr, isVerification: boolean, isRejection: boolean) => {
    const phone = order.shipping_address?.phone;
    if (!phone) {
      toast.error('Customer phone not available');
      return;
    }

    const formattedPhone = formatPhoneForWhatsApp(phone);
    const orderId = order.id.slice(0, 8).toUpperCase();
    const customerName = order.shipping_address?.fullName || 'Customer';
    const totalAmount = order.total_amount?.toLocaleString() || '0';

    let message = `🛍️ *LUXE Order Update*\n\nHello ${customerName}!\n\n*Order ID:* #${orderId}\n`;

    if (isVerification) {
      message += `*Status:* CONFIRMED\n\n✅ Your payment has been verified successfully! Your order is now confirmed and being processed.\n\n🎉 *Payment Confirmed!*\nYour order is now being prepared for shipping.\n\n`;
    } else if (isRejection) {
      message += `*Status:* CANCELLED\n\n❌ Unfortunately, we could not verify your payment. Your order has been cancelled. If you believe this is an error, please contact support.\n\n`;
    }

    message += `📦 *Order Total:* ₹${totalAmount}\n\nThank you for shopping with LUXE!`;

    const whatsappUrl = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
    toast.success('Opening WhatsApp...');
  };

  const verifyPayment = async (order: OrderWithUtr) => {
    const { error } = await supabase
      .from('orders')
      .update({ status: 'confirmed' })
      .eq('id', order.id);

    if (error) {
      toast.error('Failed to verify payment');
      return;
    }

    toast.success('Payment verified! Order confirmed.');
    sendWhatsAppNotification(order, true, false);
    fetchOrders();
  };

  const rejectPayment = async (order: OrderWithUtr) => {
    const { error } = await supabase
      .from('orders')
      .update({ status: 'cancelled' })
      .eq('id', order.id);

    if (error) {
      toast.error('Failed to reject payment');
      return;
    }

    toast.error('Payment rejected! Order cancelled.');
    sendWhatsAppNotification(order, false, true);
    fetchOrders();
  };

  const deleteUtr = async (order: OrderWithUtr) => {
    const { error } = await supabase
      .from('orders')
      .update({ payment_id: null })
      .eq('id', order.id);

    if (error) {
      toast.error('Failed to delete UTR');
      return;
    }

    toast.success('UTR deleted successfully');
    fetchOrders();
  };

  const markAsPending = async (order: OrderWithUtr) => {
    const { error } = await supabase
      .from('orders')
      .update({ status: 'awaiting_payment' })
      .eq('id', order.id);

    if (error) {
      toast.error('Failed to update status');
      return;
    }

    toast.success('Order marked as pending');
    fetchOrders();
  };

  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    awaiting_payment: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
    confirmed: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    shipped: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
    delivered: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  };

  // Filter orders based on tab and search
  const filteredOrders = orders.filter(order => {
    const utr = getUtrFromPaymentId(order.payment_id);
    
    // Filter by tab
    if (filterTab === 'pending') {
      if (order.status !== 'awaiting_payment') return false;
    } else if (filterTab === 'with_utr') {
      if (!utr) return false;
    } else if (filterTab === 'verified') {
      if (order.status !== 'confirmed' && order.status !== 'shipped' && order.status !== 'delivered') return false;
    } else if (filterTab === 'rejected') {
      if (order.status !== 'cancelled') return false;
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const orderId = order.id.toLowerCase();
      const utrStr = utr?.toLowerCase() || '';
      const customerName = order.shipping_address?.fullName?.toLowerCase() || '';
      const phone = order.shipping_address?.phone?.toLowerCase() || '';
      
      return orderId.includes(query) || utrStr.includes(query) || customerName.includes(query) || phone.includes(query);
    }

    return true;
  });

  // Count stats
  const pendingCount = orders.filter(o => o.status === 'awaiting_payment').length;
  const withUtrCount = orders.filter(o => getUtrFromPaymentId(o.payment_id)).length;
  const verifiedCount = orders.filter(o => ['confirmed', 'shipped', 'delivered'].includes(o.status)).length;
  const rejectedCount = orders.filter(o => o.status === 'cancelled').length;

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold flex items-center gap-2">
              <Smartphone className="h-8 w-8" />
              UTR Management
            </h1>
            <p className="text-muted-foreground mt-1">
              Verify, reject or manage UPI payment UTR numbers
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search UTR, order ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button variant="outline" size="icon" onClick={fetchOrders}>
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="p-4 border-orange-200 dark:border-orange-800">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900/30">
                <Clock className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{pendingCount}</p>
                <p className="text-xs text-muted-foreground">Pending Verification</p>
              </div>
            </div>
          </Card>
          <Card className="p-4 border-blue-200 dark:border-blue-800">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                <Smartphone className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{withUtrCount}</p>
                <p className="text-xs text-muted-foreground">With UTR</p>
              </div>
            </div>
          </Card>
          <Card className="p-4 border-green-200 dark:border-green-800">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{verifiedCount}</p>
                <p className="text-xs text-muted-foreground">Verified</p>
              </div>
            </div>
          </Card>
          <Card className="p-4 border-red-200 dark:border-red-800">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30">
                <XCircle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{rejectedCount}</p>
                <p className="text-xs text-muted-foreground">Rejected</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Tabs & Table */}
        <Tabs value={filterTab} onValueChange={setFilterTab}>
          <TabsList className="flex-wrap h-auto gap-1">
            <TabsTrigger value="pending" className="relative">
              Pending
              {pendingCount > 0 && (
                <span className="ml-1.5 bg-orange-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                  {pendingCount}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="with_utr">With UTR</TabsTrigger>
            <TabsTrigger value="verified">Verified</TabsTrigger>
            <TabsTrigger value="rejected">Rejected</TabsTrigger>
            <TabsTrigger value="all">All UPI Orders</TabsTrigger>
          </TabsList>

          <TabsContent value={filterTab} className="mt-4">
            {loading ? (
              <Card className="p-8">
                <div className="flex items-center justify-center">
                  <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              </Card>
            ) : filteredOrders.length === 0 ? (
              <Card className="p-8 text-center text-muted-foreground">
                No orders found in this category
              </Card>
            ) : (
              <Card>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order ID</TableHead>
                      <TableHead>UTR Number</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredOrders.map((order) => {
                      const utr = getUtrFromPaymentId(order.payment_id);
                      const isAwaitingPayment = order.status === 'awaiting_payment';

                      return (
                        <TableRow key={order.id} className={isAwaitingPayment ? 'bg-orange-50/50 dark:bg-orange-950/10' : ''}>
                          <TableCell className="font-mono text-sm">
                            #{order.id.slice(0, 8).toUpperCase()}
                          </TableCell>
                          <TableCell>
                            {utr ? (
                              <div className="flex items-center gap-2">
                                <code className="text-xs bg-secondary px-2 py-1 rounded font-mono">
                                  {utr}
                                </code>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0"
                                  onClick={() => copyUtr(utr)}
                                >
                                  {copiedUtr === utr ? (
                                    <Check className="h-3 w-3 text-green-500" />
                                  ) : (
                                    <Copy className="h-3 w-3" />
                                  )}
                                </Button>
                              </div>
                            ) : (
                              <span className="text-muted-foreground text-sm">No UTR</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium text-sm">{order.shipping_address?.fullName || 'N/A'}</p>
                              <p className="text-xs text-muted-foreground">{order.shipping_address?.phone || ''}</p>
                            </div>
                          </TableCell>
                          <TableCell className="font-medium">
                            ₹{order.total_amount?.toLocaleString()}
                          </TableCell>
                          <TableCell>
                            <Badge className={statusColors[order.status] || statusColors.pending}>
                              {order.status.replace('_', ' ')}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {new Date(order.created_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center justify-end gap-1">
                              {isAwaitingPayment ? (
                                <>
                                  <Button
                                    size="sm"
                                    variant="default"
                                    className="bg-green-600 hover:bg-green-700 h-8"
                                    onClick={() => verifyPayment(order)}
                                  >
                                    <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                                    Verify
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    className="h-8"
                                    onClick={() => rejectPayment(order)}
                                  >
                                    <XCircle className="h-3.5 w-3.5 mr-1" />
                                    Reject
                                  </Button>
                                </>
                              ) : (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-8"
                                  onClick={() => markAsPending(order)}
                                >
                                  <Clock className="h-3.5 w-3.5 mr-1" />
                                  Mark Pending
                                </Button>
                              )}
                              
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 text-green-600 hover:text-green-700"
                                onClick={() => {
                                  const phone = order.shipping_address?.phone;
                                  if (phone) {
                                    window.open(`https://wa.me/${formatPhoneForWhatsApp(phone)}`, '_blank');
                                  } else {
                                    toast.error('No phone number');
                                  }
                                }}
                              >
                                <MessageCircle className="h-3.5 w-3.5" />
                              </Button>

                              {utr && (
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="h-8 text-destructive hover:text-destructive"
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Delete UTR?</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        This will remove the UTR number from this order. The order status will remain unchanged.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                                      <AlertDialogAction
                                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                        onClick={() => deleteUtr(order)}
                                      >
                                        Delete UTR
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
