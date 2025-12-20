import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export default function AdminOrders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchOrders(); }, []);

  const fetchOrders = async () => {
    const { data } = await supabase.from('orders').select('*, order_items(*)').order('created_at', { ascending: false });
    setOrders(data || []);
    setLoading(false);
  };

  const updateStatus = async (id: string, status: string) => {
    await supabase.from('orders').update({ status }).eq('id', id);
    toast.success('Status updated');
    fetchOrders();
  };

  const statusColors: Record<string, string> = { pending: 'bg-yellow-100 text-yellow-800', confirmed: 'bg-blue-100 text-blue-800', shipped: 'bg-purple-100 text-purple-800', delivered: 'bg-green-100 text-green-800', cancelled: 'bg-red-100 text-red-800' };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <h1 className="font-display text-3xl font-bold">Orders</h1>
        {loading ? <div className="space-y-4">{[1,2,3].map(i => <div key={i} className="h-24 bg-muted animate-pulse rounded-lg" />)}</div> : orders.length === 0 ? <Card className="p-8 text-center text-muted-foreground">No orders yet</Card> : (
          <div className="space-y-4">
            {orders.map((order) => (
              <Card key={order.id} className="p-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <p className="font-medium">#{order.id.slice(0,8).toUpperCase()}</p>
                    <p className="text-sm text-muted-foreground">{new Date(order.created_at).toLocaleString()}</p>
                    <p className="text-sm">Items: {order.order_items?.length || 0} • ₹{order.total_amount.toLocaleString()}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge className={statusColors[order.status]}>{order.status}</Badge>
                    <Select value={order.status} onValueChange={(v) => updateStatus(order.id, v)}>
                      <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="confirmed">Confirmed</SelectItem>
                        <SelectItem value="shipped">Shipped</SelectItem>
                        <SelectItem value="delivered">Delivered</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
