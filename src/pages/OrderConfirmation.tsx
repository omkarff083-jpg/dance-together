import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { CheckCircle, Package, Truck, ArrowRight, Home, ShoppingBag, MapPin, Phone, Mail, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Layout } from '@/components/layout/Layout';
import { supabase } from '@/integrations/supabase/client';

interface OrderDetails {
  id: string;
  total_amount: number;
  status: string;
  payment_method: string;
  shipping_address: {
    fullName: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    pincode: string;
  } | null;
  created_at: string;
  items: {
    product_name: string;
    quantity: number;
    price: number;
    product_image: string | null;
    size: string | null;
    color: string | null;
  }[];
}

export default function OrderConfirmation() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const orderId = searchParams.get('orderId');
  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orderId) {
      navigate('/');
      return;
    }
    fetchOrder();
  }, [orderId]);

  const fetchOrder = async () => {
    try {
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single();

      if (orderError) throw orderError;

      const { data: itemsData } = await supabase
        .from('order_items')
        .select('*')
        .eq('order_id', orderId);

      setOrder({
        ...orderData,
        shipping_address: orderData.shipping_address as OrderDetails['shipping_address'],
        items: itemsData || [],
      });
    } catch (error) {
      console.error('Error fetching order:', error);
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="container py-8 flex items-center justify-center min-h-[60vh]">
          <div className="animate-pulse text-center">
            <div className="h-16 w-16 bg-muted rounded-full mx-auto mb-4" />
            <div className="h-6 w-48 bg-muted rounded mx-auto" />
          </div>
        </div>
      </Layout>
    );
  }

  if (!order) {
    return (
      <Layout>
        <div className="container py-16 text-center">
          <h1 className="text-2xl font-bold mb-4">Order Not Found</h1>
          <Button asChild>
            <Link to="/">Go Home</Link>
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container px-4 py-6 md:py-8 pb-32 md:pb-8 max-w-2xl mx-auto">
        {/* Success Header */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 md:w-20 md:h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="h-8 w-8 md:h-10 md:w-10 text-green-600" />
          </div>
          <h1 className="text-xl md:text-2xl font-bold text-green-600 mb-1">Order Placed Successfully!</h1>
          <p className="text-sm text-muted-foreground">
            Thank you for your order
          </p>
        </div>

        {/* Order ID Card */}
        <Card className="p-4 mb-4 bg-primary/5 border-primary/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Order ID</p>
              <p className="font-mono font-semibold text-sm">{order.id.slice(0, 8).toUpperCase()}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Amount</p>
              <p className="font-bold text-lg text-primary">₹{order.total_amount.toLocaleString()}</p>
            </div>
          </div>
        </Card>

        {/* Order Status Timeline */}
        <Card className="p-4 mb-4">
          <h2 className="font-semibold text-sm mb-3">Order Status</h2>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 flex-1">
              <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
                <CheckCircle className="h-4 w-4 text-white" />
              </div>
              <div className="flex-1 h-1 bg-muted rounded">
                <div className="h-full w-1/4 bg-green-500 rounded" />
              </div>
              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                <Package className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="flex-1 h-1 bg-muted rounded" />
              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                <Truck className="h-4 w-4 text-muted-foreground" />
              </div>
            </div>
          </div>
          <div className="flex justify-between mt-2 text-xs text-muted-foreground">
            <span>Confirmed</span>
            <span>Processing</span>
            <span>Delivered</span>
          </div>
        </Card>

        {/* Items Summary */}
        <Card className="p-4 mb-4">
          <h2 className="font-semibold text-sm mb-3">Items ({order.items.length})</h2>
          <div className="space-y-3 max-h-40 overflow-y-auto">
            {order.items.map((item, index) => (
              <div key={index} className="flex gap-3">
                <div className="w-12 h-12 rounded bg-secondary overflow-hidden flex-shrink-0">
                  <img
                    src={item.product_image || 'https://via.placeholder.com/48'}
                    alt={item.product_name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{item.product_name}</p>
                  <p className="text-xs text-muted-foreground">
                    Qty: {item.quantity}
                    {item.size && ` • ${item.size}`}
                    {item.color && ` • ${item.color}`}
                  </p>
                </div>
                <p className="text-sm font-medium">₹{(item.price * item.quantity).toLocaleString()}</p>
              </div>
            ))}
          </div>
        </Card>

        {/* Delivery Address */}
        {order.shipping_address && (
          <Card className="p-4 mb-4">
            <h2 className="font-semibold text-sm mb-3 flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Delivery Address
            </h2>
            <div className="text-sm space-y-1">
              <p className="font-medium flex items-center gap-2">
                <User className="h-3 w-3 text-muted-foreground" />
                {order.shipping_address.fullName}
              </p>
              <p className="text-muted-foreground">{order.shipping_address.address}</p>
              <p className="text-muted-foreground">
                {order.shipping_address.city}, {order.shipping_address.state} - {order.shipping_address.pincode}
              </p>
              <div className="flex flex-wrap gap-4 pt-2 text-xs">
                <span className="flex items-center gap-1">
                  <Phone className="h-3 w-3" />
                  {order.shipping_address.phone}
                </span>
                <span className="flex items-center gap-1">
                  <Mail className="h-3 w-3" />
                  {order.shipping_address.email}
                </span>
              </div>
            </div>
          </Card>
        )}

        {/* Payment Info */}
        <Card className="p-4 mb-4">
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">Payment Method</span>
            <span className="font-medium uppercase">{order.payment_method || 'N/A'}</span>
          </div>
        </Card>

        {/* Fixed Bottom Actions for Mobile */}
        <div className="fixed bottom-14 left-0 right-0 p-4 bg-background border-t md:hidden">
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" asChild>
              <Link to={`/orders/${order.id}`}>
                <Package className="h-4 w-4 mr-2" />
                Track Order
              </Link>
            </Button>
            <Button className="flex-1" asChild>
              <Link to="/">
                <ShoppingBag className="h-4 w-4 mr-2" />
                Continue Shopping
              </Link>
            </Button>
          </div>
        </div>

        {/* Desktop Actions */}
        <div className="hidden md:flex gap-4 mt-6">
          <Button variant="outline" className="flex-1" asChild>
            <Link to={`/orders/${order.id}`}>
              <Package className="h-4 w-4 mr-2" />
              Track Order
            </Link>
          </Button>
          <Button className="flex-1" asChild>
            <Link to="/">
              <ShoppingBag className="h-4 w-4 mr-2" />
              Continue Shopping
            </Link>
          </Button>
        </div>
      </div>
    </Layout>
  );
}
