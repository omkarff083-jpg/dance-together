import { useState, useEffect } from 'react';
import { Package, FolderTree, ShoppingCart, DollarSign, TrendingUp, Users, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { supabase } from '@/integrations/supabase/client';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { Badge } from '@/components/ui/badge';

interface Stats {
  totalProducts: number;
  totalCategories: number;
  totalOrders: number;
  totalRevenue: number;
  pendingOrders: number;
  activeProducts: number;
  lowStockProducts: number;
}

interface OrdersByDay {
  date: string;
  orders: number;
  revenue: number;
}

interface OrdersByStatus {
  name: string;
  value: number;
  color: string;
}

interface TopProduct {
  name: string;
  sales: number;
  revenue: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({
    totalProducts: 0,
    totalCategories: 0,
    totalOrders: 0,
    totalRevenue: 0,
    pendingOrders: 0,
    activeProducts: 0,
    lowStockProducts: 0,
  });
  const [loading, setLoading] = useState(true);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [ordersByDay, setOrdersByDay] = useState<OrdersByDay[]>([]);
  const [ordersByStatus, setOrdersByStatus] = useState<OrdersByStatus[]>([]);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const [productsRes, categoriesRes, ordersRes, orderItemsRes] = await Promise.all([
        supabase.from('products').select('id, active, stock'),
        supabase.from('categories').select('id', { count: 'exact', head: true }),
        supabase.from('orders').select('id, total_amount, status, created_at'),
        supabase.from('order_items').select('product_name, quantity, price'),
      ]);

      const products = productsRes.data || [];
      const orders = ordersRes.data || [];
      const orderItems = orderItemsRes.data || [];
      
      const totalRevenue = orders.reduce((sum, order) => sum + (order.total_amount || 0), 0);
      const pendingOrders = orders.filter(order => order.status === 'pending').length;
      const confirmedOrders = orders.filter(order => order.status === 'confirmed').length;
      const deliveredOrders = orders.filter(order => order.status === 'delivered').length;
      const cancelledOrders = orders.filter(order => order.status === 'cancelled').length;

      setStats({
        totalProducts: products.length,
        totalCategories: categoriesRes.count || 0,
        totalOrders: orders.length,
        totalRevenue,
        pendingOrders,
        activeProducts: products.filter(p => p.active).length,
        lowStockProducts: products.filter(p => p.stock < 10).length,
      });

      // Orders by status for pie chart
      setOrdersByStatus([
        { name: 'Pending', value: pendingOrders, color: 'hsl(var(--chart-1))' },
        { name: 'Confirmed', value: confirmedOrders, color: 'hsl(var(--chart-2))' },
        { name: 'Delivered', value: deliveredOrders, color: 'hsl(var(--chart-3))' },
        { name: 'Cancelled', value: cancelledOrders, color: 'hsl(var(--chart-4))' },
      ].filter(s => s.value > 0));

      // Orders by day for area chart (last 7 days)
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (6 - i));
        return date.toISOString().split('T')[0];
      });

      const ordersByDayData = last7Days.map(date => {
        const dayOrders = orders.filter(o => o.created_at.startsWith(date));
        return {
          date: new Date(date).toLocaleDateString('en-US', { weekday: 'short' }),
          orders: dayOrders.length,
          revenue: dayOrders.reduce((sum, o) => sum + (o.total_amount || 0), 0),
        };
      });
      setOrdersByDay(ordersByDayData);

      // Top products by sales
      const productSales: Record<string, { sales: number; revenue: number }> = {};
      orderItems.forEach(item => {
        if (!productSales[item.product_name]) {
          productSales[item.product_name] = { sales: 0, revenue: 0 };
        }
        productSales[item.product_name].sales += item.quantity;
        productSales[item.product_name].revenue += item.price * item.quantity;
      });

      const topProductsData = Object.entries(productSales)
        .map(([name, data]) => ({ name, ...data }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5);
      setTopProducts(topProductsData);

      // Recent orders sorted by date
      setRecentOrders(orders.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      ).slice(0, 5));
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    { 
      title: 'Total Revenue', 
      value: `₹${stats.totalRevenue.toLocaleString()}`, 
      icon: DollarSign, 
      color: 'text-accent',
      bgColor: 'bg-accent/10',
      trend: '+12.5%',
      trendUp: true
    },
    { 
      title: 'Total Orders', 
      value: stats.totalOrders, 
      icon: ShoppingCart, 
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
      trend: '+8.2%',
      trendUp: true
    },
    { 
      title: 'Total Products', 
      value: stats.totalProducts, 
      icon: Package, 
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
      trend: `${stats.activeProducts} active`,
      trendUp: null
    },
    { 
      title: 'Pending Orders', 
      value: stats.pendingOrders, 
      icon: TrendingUp, 
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-500/10',
      trend: 'Needs attention',
      trendUp: stats.pendingOrders === 0
    },
    { 
      title: 'Low Stock', 
      value: stats.lowStockProducts, 
      icon: Package, 
      color: 'text-red-500',
      bgColor: 'bg-red-500/10',
      trend: 'Items < 10',
      trendUp: stats.lowStockProducts === 0
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500/20 text-yellow-700';
      case 'confirmed': return 'bg-blue-500/20 text-blue-700';
      case 'delivered': return 'bg-green-500/20 text-green-700';
      case 'cancelled': return 'bg-red-500/20 text-red-700';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div>
          <h1 className="font-display text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Overview of your store performance</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {statCards.map((stat) => (
            <Card key={stat.title} className="hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                  <stat.icon className={`h-4 w-4 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {loading ? (
                    <div className="h-8 w-16 bg-muted animate-pulse rounded" />
                  ) : (
                    stat.value
                  )}
                </div>
                <p className={`text-xs mt-1 flex items-center gap-1 ${
                  stat.trendUp === true ? 'text-green-600' : 
                  stat.trendUp === false ? 'text-red-600' : 'text-muted-foreground'
                }`}>
                  {stat.trendUp === true && <ArrowUpRight className="h-3 w-3" />}
                  {stat.trendUp === false && <ArrowDownRight className="h-3 w-3" />}
                  {stat.trend}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Revenue Chart */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Revenue Overview</CardTitle>
              <CardDescription>Daily revenue for the last 7 days</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="h-[300px] bg-muted animate-pulse rounded" />
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={ordersByDay}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--accent))" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="hsl(var(--accent))" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="date" className="text-xs" />
                    <YAxis className="text-xs" tickFormatter={(value) => `₹${value}`} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--popover))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                      formatter={(value: number) => [`₹${value.toLocaleString()}`, 'Revenue']}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="revenue" 
                      stroke="hsl(var(--accent))" 
                      fillOpacity={1} 
                      fill="url(#colorRevenue)" 
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Order Status Pie Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Order Status</CardTitle>
              <CardDescription>Distribution by status</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="h-[300px] bg-muted animate-pulse rounded" />
              ) : ordersByStatus.length === 0 ? (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  No orders yet
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={ordersByStatus}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {ordersByStatus.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--popover))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
              <div className="flex flex-wrap justify-center gap-4 mt-4">
                {ordersByStatus.map((status) => (
                  <div key={status.name} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: status.color }} />
                    <span className="text-sm text-muted-foreground">{status.name} ({status.value})</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Second Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Products */}
          <Card>
            <CardHeader>
              <CardTitle>Top Selling Products</CardTitle>
              <CardDescription>Products by revenue</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-12 bg-muted animate-pulse rounded" />
                  ))}
                </div>
              ) : topProducts.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No sales data yet</p>
              ) : (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={topProducts} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis type="number" tickFormatter={(value) => `₹${value}`} className="text-xs" />
                    <YAxis type="category" dataKey="name" width={100} className="text-xs" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--popover))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                      formatter={(value: number) => [`₹${value.toLocaleString()}`, 'Revenue']}
                    />
                    <Bar dataKey="revenue" fill="hsl(var(--accent))" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Recent Orders */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Orders</CardTitle>
              <CardDescription>Latest 5 orders</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-12 bg-muted animate-pulse rounded" />
                  ))}
                </div>
              ) : recentOrders.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No orders yet</p>
              ) : (
                <div className="space-y-4">
                  {recentOrders.map((order) => (
                    <div key={order.id} className="flex items-center justify-between py-3 border-b last:border-0">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
                          <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">#{order.id.slice(0, 8).toUpperCase()}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(order.created_at).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                      </div>
                      <div className="text-right flex items-center gap-3">
                        <Badge className={getStatusColor(order.status)}>
                          {order.status}
                        </Badge>
                        <p className="font-semibold">₹{order.total_amount.toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Orders Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Orders Trend</CardTitle>
            <CardDescription>Number of orders per day</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-[200px] bg-muted animate-pulse rounded" />
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={ordersByDay}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="date" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--popover))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Bar dataKey="orders" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
