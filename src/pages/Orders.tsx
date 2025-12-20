import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Package, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Layout } from '@/components/layout/Layout';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface Order {
  id: string;
  total_amount: number;
  status: string;
  payment_method: string | null;
  created_at: string;
  order_items: {
    id: string;
    product_name: string;
    product_image: string | null;
    quantity: number;
    price: number;
  }[];
}

export default function Orders() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchOrders();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          id,
          total_amount,
          status,
          payment_method,
          created_at,
          order_items(id, product_name, product_image, quantity, price)
        `)
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusStyles: Record<string, string> = {
      pending: 'bg-warning/20 text-warning-foreground border-warning',
      confirmed: 'bg-accent/20 text-accent border-accent',
      shipped: 'bg-blue-100 text-blue-800 border-blue-300',
      delivered: 'bg-success/20 text-success border-success',
      cancelled: 'bg-destructive/20 text-destructive border-destructive',
    };

    return (
      <Badge variant="outline" className={statusStyles[status] || ''}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  if (!user) {
    return (
      <Layout>
        <div className="container py-16 text-center">
          <Package className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h1 className="font-display text-2xl font-bold mb-4">My Orders</h1>
          <p className="text-muted-foreground mb-6">Please login to view your orders</p>
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
          <h1 className="font-display text-3xl font-bold mb-8">My Orders</h1>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        </div>
      </Layout>
    );
  }

  if (orders.length === 0) {
    return (
      <Layout>
        <div className="container py-16 text-center">
          <Package className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h1 className="font-display text-2xl font-bold mb-4">No Orders Yet</h1>
          <p className="text-muted-foreground mb-6">Start shopping to see your orders here</p>
          <Button asChild>
            <Link to="/products">Browse Products</Link>
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container py-8">
        <h1 className="font-display text-3xl font-bold mb-8">My Orders</h1>

        <div className="space-y-4">
          {orders.map((order) => (
            <Card key={order.id} className="p-4 md:p-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                <div>
                  <p className="text-sm text-muted-foreground">
                    Order #{order.id.slice(0, 8).toUpperCase()}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(order.created_at).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {getStatusBadge(order.status)}
                  <span className="font-semibold">₹{order.total_amount.toLocaleString()}</span>
                </div>
              </div>

              <div className="flex items-center gap-4 overflow-x-auto pb-2">
                {order.order_items.slice(0, 4).map((item) => (
                  <div key={item.id} className="flex-shrink-0">
                    <div className="w-16 h-16 rounded-lg bg-secondary overflow-hidden">
                      <img
                        src={item.product_image || 'https://via.placeholder.com/64'}
                        alt={item.product_name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                ))}
                {order.order_items.length > 4 && (
                  <div className="flex-shrink-0 w-16 h-16 rounded-lg bg-secondary flex items-center justify-center">
                    <span className="text-sm font-medium">+{order.order_items.length - 4}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between mt-4 pt-4 border-t">
                <p className="text-sm text-muted-foreground">
                  {order.order_items.length} item{order.order_items.length > 1 ? 's' : ''}
                </p>
                <Button variant="ghost" size="sm">
                  View Details
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </Layout>
  );
}
