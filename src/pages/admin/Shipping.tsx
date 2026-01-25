import { useState, useEffect } from 'react';
import { Loader2, Truck, Package, CreditCard, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

interface ShippingSettings {
  shipping_enabled: boolean;
  shipping_charge: number;
  free_shipping_threshold: number;
  razorpay_shipping_charge: number;
  upi_shipping_charge: number;
  razorpay_upi_shipping_charge: number;
  paytm_shipping_charge: number;
  cashfree_shipping_charge: number;
  bharatpay_shipping_charge: number;
  payyou_shipping_charge: number;
  phonepe_shipping_charge: number;
  cod_shipping_charge: number;
}

interface Product {
  id: string;
  name: string;
  price: number;
  shipping_charge: number | null;
  images: string[];
}

export default function AdminShipping() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [productSearch, setProductSearch] = useState('');
  const [editingProduct, setEditingProduct] = useState<string | null>(null);
  const [productShippingValue, setProductShippingValue] = useState('');

  const [settings, setSettings] = useState<ShippingSettings>({
    shipping_enabled: true,
    shipping_charge: 99,
    free_shipping_threshold: 999,
    razorpay_shipping_charge: 0,
    upi_shipping_charge: 0,
    razorpay_upi_shipping_charge: 0,
    paytm_shipping_charge: 0,
    cashfree_shipping_charge: 0,
    bharatpay_shipping_charge: 0,
    payyou_shipping_charge: 0,
    phonepe_shipping_charge: 0,
    cod_shipping_charge: 0,
  });

  useEffect(() => {
    fetchSettings();
    fetchProducts();
  }, []);

  const fetchSettings = async () => {
    const { data } = await supabase.from('payment_settings').select('*').limit(1).maybeSingle();
    if (data) {
      setSettings({
        shipping_enabled: (data as any).shipping_enabled ?? true,
        shipping_charge: (data as any).shipping_charge ?? 99,
        free_shipping_threshold: (data as any).free_shipping_threshold ?? 999,
        razorpay_shipping_charge: (data as any).razorpay_shipping_charge ?? 0,
        upi_shipping_charge: (data as any).upi_shipping_charge ?? 0,
        razorpay_upi_shipping_charge: (data as any).razorpay_upi_shipping_charge ?? 0,
        paytm_shipping_charge: (data as any).paytm_shipping_charge ?? 0,
        cashfree_shipping_charge: (data as any).cashfree_shipping_charge ?? 0,
        bharatpay_shipping_charge: (data as any).bharatpay_shipping_charge ?? 0,
        payyou_shipping_charge: (data as any).payyou_shipping_charge ?? 0,
        phonepe_shipping_charge: (data as any).phonepe_shipping_charge ?? 0,
        cod_shipping_charge: (data as any).cod_shipping_charge ?? 0,
      });
    }
    setLoading(false);
  };

  const fetchProducts = async () => {
    const { data } = await supabase
      .from('products')
      .select('id, name, price, shipping_charge, images')
      .order('name');
    if (data) {
      setProducts(data as Product[]);
    }
  };

  const updateSetting = <K extends keyof ShippingSettings>(key: K, value: ShippingSettings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      const { data: existing } = await supabase.from('payment_settings').select('id').limit(1).maybeSingle();

      const settingsData = {
        shipping_enabled: settings.shipping_enabled,
        shipping_charge: settings.shipping_charge,
        free_shipping_threshold: settings.free_shipping_threshold,
        razorpay_shipping_charge: settings.razorpay_shipping_charge,
        upi_shipping_charge: settings.upi_shipping_charge,
        razorpay_upi_shipping_charge: settings.razorpay_upi_shipping_charge,
        paytm_shipping_charge: settings.paytm_shipping_charge,
        cashfree_shipping_charge: settings.cashfree_shipping_charge,
        bharatpay_shipping_charge: settings.bharatpay_shipping_charge,
        payyou_shipping_charge: settings.payyou_shipping_charge,
        phonepe_shipping_charge: settings.phonepe_shipping_charge,
        cod_shipping_charge: settings.cod_shipping_charge,
      };

      if (existing) {
        await supabase.from('payment_settings').update(settingsData as any).eq('id', existing.id);
      } else {
        await supabase.from('payment_settings').insert(settingsData as any);
      }
      toast.success('Shipping settings saved successfully!');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const updateProductShipping = async (productId: string, charge: number | null) => {
    try {
      await supabase
        .from('products')
        .update({ shipping_charge: charge } as any)
        .eq('id', productId);
      
      setProducts(prev => prev.map(p => 
        p.id === productId ? { ...p, shipping_charge: charge } : p
      ));
      setEditingProduct(null);
      toast.success('Product shipping charge updated!');
    } catch (error) {
      toast.error('Failed to update product shipping');
    }
  };

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(productSearch.toLowerCase())
  );

  const gatewayItems = [
    { key: 'razorpay_shipping_charge', name: 'Razorpay', icon: '💳' },
    { key: 'upi_shipping_charge', name: 'UPI (Direct)', icon: '📱' },
    { key: 'razorpay_upi_shipping_charge', name: 'Razorpay UPI', icon: '🔵' },
    { key: 'paytm_shipping_charge', name: 'Paytm', icon: '💙' },
    { key: 'cashfree_shipping_charge', name: 'Cashfree', icon: '💚' },
    { key: 'bharatpay_shipping_charge', name: 'BharatPay', icon: '🇮🇳' },
    { key: 'payyou_shipping_charge', name: 'PayYou', icon: '💜' },
    { key: 'phonepe_shipping_charge', name: 'PhonePe', icon: '💜' },
    { key: 'cod_shipping_charge', name: 'Cash on Delivery', icon: '💵' },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-3xl font-bold flex items-center gap-3">
              <Truck className="h-8 w-8" />
              Shipping Settings
            </h1>
            <p className="text-muted-foreground mt-1">
              Control shipping charges globally, per gateway, and per product
            </p>
          </div>
          <Badge variant={settings.shipping_enabled ? 'default' : 'secondary'}>
            {settings.shipping_enabled ? '🟢 Shipping Enabled' : '🔴 Shipping Disabled'}
          </Badge>
        </div>

        {loading ? (
          <div className="h-96 bg-muted animate-pulse rounded-lg" />
        ) : (
          <div className="space-y-6">
            <Tabs defaultValue="global" className="w-full">
              <TabsList className="grid grid-cols-3 w-full max-w-lg">
                <TabsTrigger value="global" className="flex items-center gap-2">
                  <Truck className="h-4 w-4" />
                  Global
                </TabsTrigger>
                <TabsTrigger value="gateway" className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  Per Gateway
                </TabsTrigger>
                <TabsTrigger value="product" className="flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Per Product
                </TabsTrigger>
              </TabsList>

              {/* Global Shipping Settings */}
              <TabsContent value="global">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <Truck className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <CardTitle>Global Shipping Settings</CardTitle>
                          <CardDescription>Default shipping charges for all orders</CardDescription>
                        </div>
                      </div>
                      <Switch
                        checked={settings.shipping_enabled}
                        onCheckedChange={(v) => updateSetting('shipping_enabled', v)}
                      />
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="shipping-charge">Default Shipping Charge (₹)</Label>
                        <Input
                          id="shipping-charge"
                          type="number"
                          value={settings.shipping_charge}
                          onChange={(e) => updateSetting('shipping_charge', parseFloat(e.target.value) || 0)}
                          placeholder="99"
                          disabled={!settings.shipping_enabled}
                        />
                        <p className="text-xs text-muted-foreground">
                          यह charge सभी orders पर apply होगा
                        </p>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="free-threshold">Free Shipping Above (₹)</Label>
                        <Input
                          id="free-threshold"
                          type="number"
                          value={settings.free_shipping_threshold}
                          onChange={(e) => updateSetting('free_shipping_threshold', parseFloat(e.target.value) || 0)}
                          placeholder="999"
                          disabled={!settings.shipping_enabled}
                        />
                        <p className="text-xs text-muted-foreground">
                          इस amount से ऊपर orders पर shipping free होगी (0 = disabled)
                        </p>
                      </div>
                    </div>

                    {!settings.shipping_enabled && (
                      <div className="p-3 bg-muted rounded-md">
                        <p className="text-sm text-muted-foreground">
                          🚫 Shipping is disabled. No shipping charges will be applied.
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Per Gateway Shipping */}
              <TabsContent value="gateway">
                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <CreditCard className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <CardTitle>Per Gateway Shipping Charges</CardTitle>
                        <CardDescription>
                          Additional shipping charge per payment gateway (0 = use global)
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {gatewayItems.map((gateway) => (
                        <div key={gateway.key} className="space-y-2 p-4 border rounded-lg">
                          <Label htmlFor={gateway.key} className="flex items-center gap-2">
                            <span>{gateway.icon}</span>
                            {gateway.name}
                          </Label>
                          <Input
                            id={gateway.key}
                            type="number"
                            value={settings[gateway.key as keyof ShippingSettings] as number}
                            onChange={(e) => updateSetting(
                              gateway.key as keyof ShippingSettings, 
                              parseFloat(e.target.value) || 0
                            )}
                            placeholder="0"
                            disabled={!settings.shipping_enabled}
                          />
                          <p className="text-xs text-muted-foreground">
                            Additional ₹{settings[gateway.key as keyof ShippingSettings] || 0}
                          </p>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 p-3 bg-muted rounded-md">
                      <p className="text-sm text-muted-foreground">
                        💡 Per gateway charge global shipping charge के ऊपर add होगा। 
                        Example: Global ₹{settings.shipping_charge} + COD ₹{settings.cod_shipping_charge} = ₹{settings.shipping_charge + settings.cod_shipping_charge}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Per Product Shipping */}
              <TabsContent value="product">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-100 rounded-lg">
                          <Package className="h-6 w-6 text-green-600" />
                        </div>
                        <div>
                          <CardTitle>Per Product Shipping Charges</CardTitle>
                          <CardDescription>
                            Set custom shipping for specific products (overrides global)
                          </CardDescription>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Input
                      placeholder="Search products..."
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                    />
                    
                    <div className="rounded-md border max-h-[400px] overflow-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Product</TableHead>
                            <TableHead>Price</TableHead>
                            <TableHead>Shipping Charge</TableHead>
                            <TableHead>Action</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredProducts.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                                No products found
                              </TableCell>
                            </TableRow>
                          ) : (
                            filteredProducts.map((product) => (
                              <TableRow key={product.id}>
                                <TableCell>
                                  <div className="flex items-center gap-3">
                                    {product.images?.[0] && (
                                      <img
                                        src={product.images[0]}
                                        alt={product.name}
                                        className="w-10 h-10 object-cover rounded"
                                      />
                                    )}
                                    <span className="font-medium truncate max-w-[200px]">
                                      {product.name}
                                    </span>
                                  </div>
                                </TableCell>
                                <TableCell>₹{product.price}</TableCell>
                                <TableCell>
                                  {editingProduct === product.id ? (
                                    <Input
                                      type="number"
                                      value={productShippingValue}
                                      onChange={(e) => setProductShippingValue(e.target.value)}
                                      placeholder="Leave empty for global"
                                      className="w-32"
                                      autoFocus
                                    />
                                  ) : (
                                    <Badge variant={product.shipping_charge !== null ? 'default' : 'secondary'}>
                                      {product.shipping_charge !== null 
                                        ? `₹${product.shipping_charge}` 
                                        : 'Global (₹' + settings.shipping_charge + ')'}
                                    </Badge>
                                  )}
                                </TableCell>
                                <TableCell>
                                  {editingProduct === product.id ? (
                                    <div className="flex gap-2">
                                      <Button
                                        size="sm"
                                        onClick={() => updateProductShipping(
                                          product.id,
                                          productShippingValue === '' ? null : parseFloat(productShippingValue)
                                        )}
                                      >
                                        <Save className="h-4 w-4" />
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => setEditingProduct(null)}
                                      >
                                        Cancel
                                      </Button>
                                    </div>
                                  ) : (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => {
                                        setEditingProduct(product.id);
                                        setProductShippingValue(
                                          product.shipping_charge !== null 
                                            ? product.shipping_charge.toString() 
                                            : ''
                                        );
                                      }}
                                    >
                                      Edit
                                    </Button>
                                  )}
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </div>
                    
                    <div className="p-3 bg-muted rounded-md">
                      <p className="text-sm text-muted-foreground">
                        💡 Product level shipping global settings को override करता है। 
                        Empty छोड़ने पर global shipping charge use होगा।
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            <div className="flex justify-end">
              <Button onClick={saveSettings} disabled={saving} size="lg">
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Shipping Settings
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
