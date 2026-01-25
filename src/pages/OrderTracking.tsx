import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { format, addDays, differenceInDays, isAfter } from 'date-fns';
import { 
  Package, 
  Truck, 
  CheckCircle2, 
  Clock, 
  MapPin, 
  Phone, 
  User,
  ArrowLeft,
  Copy,
  Check,
  XCircle,
  Calendar,
  Timer,
  Bell,
  RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Layout } from '@/components/layout/Layout';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useNotificationSound } from '@/hooks/useNotificationSound';

interface OrderItem {
  id: string;
  product_name: string;
  product_image: string | null;
  quantity: number;
  price: number;
  size: string | null;
  color: string | null;
}

interface ShippingAddress {
  fullName: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
}

interface Order {
  id: string;
  total_amount: number;
  status: string;
  payment_method: string | null;
  payment_id: string | null;
  created_at: string;
  updated_at: string;
  shipping_address: ShippingAddress | null;
  order_items: OrderItem[];
}

const ORDER_STATUSES = [
  { key: 'pending', label: 'Order Placed', icon: Clock, daysToAdd: 0 },
  { key: 'confirmed', label: 'Confirmed', icon: CheckCircle2, daysToAdd: 1 },
  { key: 'shipped', label: 'Shipped', icon: Truck, daysToAdd: 3 },
  { key: 'delivered', label: 'Delivered', icon: Package, daysToAdd: 5 },
];

// Delivery time estimates based on status
const DELIVERY_ESTIMATES = {
  pending: { min: 5, max: 7 },
  awaiting_payment: { min: 5, max: 7 },
  confirmed: { min: 4, max: 6 },
  shipped: { min: 2, max: 4 },
  delivered: { min: 0, max: 0 },
  cancelled: { min: 0, max: 0 },
};

const calculateDeliveryInfo = (order: Order) => {
  const orderDate = new Date(order.created_at);
  const today = new Date();
  
  if (order.status === 'delivered') {
    return {
      estimatedDate: null,
      dateRange: null,
      daysRemaining: 0,
      progress: 100,
      isDelivered: true,
      deliveredOn: new Date(order.updated_at),
    };
  }
  
  if (order.status === 'cancelled') {
    return {
      estimatedDate: null,
      dateRange: null,
      daysRemaining: 0,
      progress: 0,
      isDelivered: false,
      isCancelled: true,
    };
  }

  const estimates = DELIVERY_ESTIMATES[order.status as keyof typeof DELIVERY_ESTIMATES] || { min: 5, max: 7 };
  
  // Calculate based on when order was last updated (status changed)
  const statusDate = new Date(order.updated_at);
  const minDate = addDays(statusDate, estimates.min);
  const maxDate = addDays(statusDate, estimates.max);
  
  // Use the midpoint for estimated date
  const estimatedDate = addDays(statusDate, Math.ceil((estimates.min + estimates.max) / 2));
  
  // Calculate days remaining
  const daysRemaining = Math.max(0, differenceInDays(estimatedDate, today));
  
  // Calculate progress (from order date to estimated delivery)
  const totalDays = differenceInDays(estimatedDate, orderDate);
  const daysPassed = differenceInDays(today, orderDate);
  const progress = totalDays > 0 ? Math.min(100, Math.max(0, (daysPassed / totalDays) * 100)) : 0;
  
  return {
    estimatedDate,
    dateRange: { min: minDate, max: maxDate },
    daysRemaining,
    progress,
    isDelivered: false,
    isDelayed: isAfter(today, maxDate),
  };
};

export default function OrderTracking() {
  const { orderId } = useParams<{ orderId: string }>();
  const { user } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [statusHistory, setStatusHistory] = useState<{ status: string; time: Date }[]>([]);
  const [showUpdateAnimation, setShowUpdateAnimation] = useState(false);
  const { playNotification } = useNotificationSound();
  const previousStatus = useRef<string | null>(null);

  useEffect(() => {
    if (user && orderId) {
      fetchOrder();
      
      // Set up realtime subscription for order updates
      const channel = supabase
        .channel('order-tracking')
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'orders',
            filter: `id=eq.${orderId}`,
          },
          (payload) => {
            const newStatus = (payload.new as any).status;
            
            // Check if status actually changed
            if (previousStatus.current && previousStatus.current !== newStatus) {
              // Play notification sound
              playNotification();
              
              // Show update animation
              setShowUpdateAnimation(true);
              setTimeout(() => setShowUpdateAnimation(false), 3000);
              
              // Add to status history
              setStatusHistory(prev => [
                { status: newStatus, time: new Date() },
                ...prev
              ]);
              
              // Show toast with status-specific message
              const statusMessages: Record<string, string> = {
                confirmed: '🎉 Your order has been confirmed!',
                shipped: '🚚 Your order is on the way!',
                delivered: '📦 Your order has been delivered!',
                cancelled: '❌ Your order has been cancelled',
              };
              toast.success(statusMessages[newStatus] || 'Order status updated!');
            }
            
            previousStatus.current = newStatus;
            setOrder((prev) => prev ? { ...prev, ...payload.new } : null);
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    } else {
      setLoading(false);
    }
  }, [user, orderId, playNotification]);

  const fetchOrder = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          id,
          total_amount,
          status,
          payment_method,
          payment_id,
          created_at,
          updated_at,
          shipping_address,
          order_items(id, product_name, product_image, quantity, price, size, color)
        `)
        .eq('id', orderId!)
        .eq('user_id', user!.id)
        .maybeSingle();

      if (error) throw error;
      
      if (data) {
        // Parse shipping_address if needed
        let parsedAddress: ShippingAddress | null = null;
        if (data.shipping_address) {
          if (typeof data.shipping_address === 'string') {
            parsedAddress = JSON.parse(data.shipping_address);
          } else {
            parsedAddress = data.shipping_address as unknown as ShippingAddress;
          }
        }
        
        // Initialize previous status for comparison
        previousStatus.current = data.status;
        
        // Initialize status history
        setStatusHistory([{ status: data.status, time: new Date(data.updated_at) }]);
        
        setOrder({
          id: data.id,
          total_amount: data.total_amount,
          status: data.status,
          payment_method: data.payment_method,
          payment_id: data.payment_id,
          created_at: data.created_at,
          updated_at: data.updated_at,
          shipping_address: parsedAddress,
          order_items: data.order_items,
        });
      }
    } catch (error) {
      console.error('Error fetching order:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyOrderId = () => {
    if (order) {
      navigator.clipboard.writeText(order.id);
      setCopied(true);
      toast.success('Order ID copied!');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const getStatusIndex = (status: string) => {
    if (status === 'cancelled' || status === 'awaiting_payment') return -1;
    return ORDER_STATUSES.findIndex((s) => s.key === status);
  };

  const getStatusBadge = (status: string) => {
    const statusStyles: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      awaiting_payment: 'bg-orange-100 text-orange-800 border-orange-300',
      confirmed: 'bg-blue-100 text-blue-800 border-blue-300',
      shipped: 'bg-purple-100 text-purple-800 border-purple-300',
      delivered: 'bg-green-100 text-green-800 border-green-300',
      cancelled: 'bg-red-100 text-red-800 border-red-300',
    };

    const statusLabels: Record<string, string> = {
      pending: 'Pending',
      awaiting_payment: 'Awaiting Payment',
      confirmed: 'Confirmed',
      shipped: 'Shipped',
      delivered: 'Delivered',
      cancelled: 'Cancelled',
    };

    return (
      <Badge variant="outline" className={statusStyles[status] || ''}>
        {statusLabels[status] || status}
      </Badge>
    );
  };

  if (!user) {
    return (
      <Layout>
        <div className="container py-16 text-center">
          <Package className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h1 className="font-display text-2xl font-bold mb-4">Track Your Order</h1>
          <p className="text-muted-foreground mb-6">Please login to track your orders</p>
          <Button asChild>
            <Link to="/auth">Login</Link>
          </Button>
        </div>
      </Layout>
    );
  }

  if (loading) {
    return (
      <Layout>
        <div className="container py-8">
          <div className="h-8 w-48 bg-muted animate-pulse rounded mb-8" />
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <div className="h-48 bg-muted animate-pulse rounded-lg" />
              <div className="h-64 bg-muted animate-pulse rounded-lg" />
            </div>
            <div className="h-80 bg-muted animate-pulse rounded-lg" />
          </div>
        </div>
      </Layout>
    );
  }

  if (!order) {
    return (
      <Layout>
        <div className="container py-16 text-center">
          <Package className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h1 className="font-display text-2xl font-bold mb-4">Order Not Found</h1>
          <p className="text-muted-foreground mb-6">We couldn't find this order</p>
          <Button asChild>
            <Link to="/orders">View All Orders</Link>
          </Button>
        </div>
      </Layout>
    );
  }

  const currentStatusIndex = getStatusIndex(order.status);
  const isCancelled = order.status === 'cancelled';
  const deliveryInfo = calculateDeliveryInfo(order);

  return (
    <Layout>
      <div className="container py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/orders">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="font-display text-2xl md:text-3xl font-bold">Track Order</h1>
              {showUpdateAnimation && (
                <span className="flex items-center gap-1 text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full animate-pulse">
                  <Bell className="h-3 w-3" />
                  Updated!
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-sm text-muted-foreground">Order ID:</span>
              <code className="text-sm bg-secondary px-2 py-0.5 rounded">
                {order.id.slice(0, 8).toUpperCase()}
              </code>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={copyOrderId}>
                {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-6 w-6" 
                onClick={fetchOrder}
                title="Refresh"
              >
                <RefreshCw className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {/* Live Status Update Banner */}
            {showUpdateAnimation && (
              <Card className="p-4 bg-green-50 border-green-200 animate-scale-in">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center animate-pulse">
                    <Bell className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="font-medium text-green-700">Status Updated!</p>
                    <p className="text-sm text-green-600">Your order status has been updated just now.</p>
                  </div>
                </div>
              </Card>
            )}

            {/* Order Status Timeline */}
            <Card className={`p-6 ${showUpdateAnimation ? 'ring-2 ring-green-400 ring-opacity-50' : ''}`}>
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-semibold text-lg">Order Status</h2>
                {getStatusBadge(order.status)}
              </div>

              {isCancelled ? (
                <div className="flex items-center gap-4 p-4 bg-destructive/10 rounded-lg">
                  <XCircle className="h-10 w-10 text-destructive" />
                  <div>
                    <p className="font-medium text-destructive">Order Cancelled</p>
                    <p className="text-sm text-muted-foreground">
                      This order has been cancelled
                    </p>
                  </div>
                </div>
              ) : (
                <div className="relative">
                  {/* Timeline */}
                  <div className="flex justify-between relative">
                    {ORDER_STATUSES.map((status, index) => {
                      const isCompleted = index <= currentStatusIndex;
                      const isCurrent = index === currentStatusIndex;
                      const Icon = status.icon;

                      return (
                        <div
                          key={status.key}
                          className="flex flex-col items-center relative z-10"
                        >
                          <div
                            className={`w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center transition-all ${
                              isCompleted
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted text-muted-foreground'
                            } ${isCurrent ? 'ring-4 ring-primary/20' : ''}`}
                          >
                            <Icon className="h-5 w-5 md:h-6 md:w-6" />
                          </div>
                          <span
                            className={`text-xs md:text-sm mt-2 text-center ${
                              isCompleted ? 'font-medium' : 'text-muted-foreground'
                            }`}
                          >
                            {status.label}
                          </span>
                        </div>
                      );
                    })}

                    {/* Progress Line */}
                    <div className="absolute top-5 md:top-6 left-0 right-0 h-1 bg-muted -z-0">
                      <div
                        className="h-full bg-primary transition-all duration-500"
                        style={{
                          width: `${(currentStatusIndex / (ORDER_STATUSES.length - 1)) * 100}%`,
                        }}
                      />
                    </div>
                  </div>

                  {/* Status Message */}
                  <div className="mt-8 p-4 bg-secondary rounded-lg">
                    <p className="text-sm">
                      {order.status === 'pending' && 'Your order has been placed and is being processed.'}
                      {order.status === 'awaiting_payment' && 'Waiting for payment confirmation.'}
                      {order.status === 'confirmed' && 'Your order has been confirmed and is being prepared.'}
                      {order.status === 'shipped' && 'Your order is on its way! Track the delivery for updates.'}
                      {order.status === 'delivered' && 'Your order has been delivered. Enjoy your purchase!'}
                    </p>
                  </div>
                </div>
              )}
            </Card>

            {/* Estimated Delivery Card */}
            {!isCancelled && (
              <Card className="p-6 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Calendar className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    {deliveryInfo.isDelivered ? (
                      <>
                        <h3 className="font-semibold text-lg text-green-600">Delivered!</h3>
                        <p className="text-sm text-muted-foreground">
                          Your order was delivered on{' '}
                          <span className="font-medium text-foreground">
                            {format(deliveryInfo.deliveredOn!, 'EEEE, dd MMMM yyyy')}
                          </span>
                        </p>
                      </>
                    ) : (
                      <>
                        <h3 className="font-semibold text-lg">Estimated Delivery</h3>
                        {deliveryInfo.dateRange && (
                          <div className="mt-2">
                            <p className="text-2xl font-bold text-primary">
                              {format(deliveryInfo.estimatedDate!, 'dd MMM')} - {format(deliveryInfo.dateRange.max, 'dd MMM')}
                            </p>
                            <p className="text-sm text-muted-foreground mt-1">
                              {format(deliveryInfo.dateRange.min, 'EEEE')} to {format(deliveryInfo.dateRange.max, 'EEEE')}
                            </p>
                          </div>
                        )}
                        
                        {/* Delivery Progress */}
                        <div className="mt-4 space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Delivery Progress</span>
                            <span className="font-medium">{Math.round(deliveryInfo.progress)}%</span>
                          </div>
                          <Progress value={deliveryInfo.progress} className="h-2" />
                        </div>

                        {/* Days Remaining */}
                        <div className="mt-4 flex items-center gap-2">
                          <Timer className="h-4 w-4 text-muted-foreground" />
                          {deliveryInfo.isDelayed ? (
                            <span className="text-sm text-orange-600 font-medium">
                              Delivery may be delayed. We apologize for the inconvenience.
                            </span>
                          ) : deliveryInfo.daysRemaining === 0 ? (
                            <span className="text-sm text-green-600 font-medium">
                              Arriving today!
                            </span>
                          ) : deliveryInfo.daysRemaining === 1 ? (
                            <span className="text-sm font-medium">
                              Arriving tomorrow
                            </span>
                          ) : (
                            <span className="text-sm text-muted-foreground">
                              Arriving in <span className="font-medium text-foreground">{deliveryInfo.daysRemaining} days</span>
                            </span>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </Card>
            )}

            {/* Order Items */}
            <Card className="p-6">
              <h2 className="font-semibold text-lg mb-4">Order Items</h2>
              <div className="space-y-4">
                {order.order_items.map((item) => (
                  <div key={item.id} className="flex gap-4">
                    <div className="w-20 h-20 rounded-lg bg-secondary overflow-hidden flex-shrink-0">
                      <img
                        src={item.product_image || 'https://via.placeholder.com/80'}
                        alt={item.product_name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{item.product_name}</p>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {item.size && (
                          <span className="text-xs bg-secondary px-2 py-0.5 rounded">
                            Size: {item.size}
                          </span>
                        )}
                        {item.color && (
                          <span className="text-xs bg-secondary px-2 py-0.5 rounded">
                            Color: {item.color}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-sm text-muted-foreground">Qty: {item.quantity}</span>
                        <span className="font-medium">₹{(item.price * item.quantity).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Order Details Sidebar */}
          <div className="space-y-6">
            {/* Shipping Address */}
            {order.shipping_address && (
              <Card className="p-6">
                <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Shipping Address
                </h2>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span>{order.shipping_address.fullName}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{order.shipping_address.phone}</span>
                  </div>
                  <Separator className="my-2" />
                  <p>{order.shipping_address.address}</p>
                  <p>
                    {order.shipping_address.city}, {order.shipping_address.state} - {order.shipping_address.pincode}
                  </p>
                </div>
              </Card>
            )}

            {/* Order Summary */}
            <Card className="p-6">
              <h2 className="font-semibold text-lg mb-4">Order Summary</h2>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Order Date</span>
                  <span>
                    {new Date(order.created_at).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Payment Method</span>
                  <span className="capitalize">{order.payment_method || 'N/A'}</span>
                </div>
                {order.payment_id && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Payment ID</span>
                    <span className="font-mono text-xs">{order.payment_id.slice(0, 12)}...</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Items ({order.order_items.length})</span>
                  <span>
                    ₹{order.order_items.reduce((sum, item) => sum + item.price * item.quantity, 0).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Shipping</span>
                  <span>{order.total_amount >= 999 ? 'Free' : '₹99'}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-semibold text-base">
                  <span>Total</span>
                  <span>₹{order.total_amount.toLocaleString()}</span>
                </div>
              </div>
            </Card>

            {/* Help */}
            <Card className="p-6 bg-secondary/50">
              <h3 className="font-medium mb-2">Need Help?</h3>
              <p className="text-sm text-muted-foreground mb-4">
                If you have any questions about your order, please contact our support team.
              </p>
              <Button variant="outline" size="sm" className="w-full">
                Contact Support
              </Button>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}