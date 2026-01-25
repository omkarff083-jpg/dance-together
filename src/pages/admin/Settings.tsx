import { useState, useEffect } from 'react';
import { Loader2, Eye, EyeOff, CreditCard, Smartphone, Wallet, Building2, Banknote } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';

interface PaymentSettings {
  upi_id: string;
  upi_enabled: boolean;
  razorpay_enabled: boolean;
  razorpay_key_id: string;
  razorpay_key_secret: string;
  paytm_enabled: boolean;
  paytm_merchant_id: string;
  paytm_merchant_key: string;
  cashfree_enabled: boolean;
  cashfree_app_id: string;
  cashfree_secret_key: string;
  bharatpay_enabled: boolean;
  bharatpay_merchant_id: string;
  bharatpay_api_key: string;
  payyou_enabled: boolean;
  payyou_merchant_id: string;
  payyou_api_key: string;
  phonepe_enabled: boolean;
  phonepe_merchant_id: string;
  phonepe_salt_key: string;
  phonepe_salt_index: string;
  cod_enabled: boolean;
}

export default function AdminSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});
  
  const [settings, setSettings] = useState<PaymentSettings>({
    upi_id: '',
    upi_enabled: true,
    razorpay_enabled: false,
    razorpay_key_id: '',
    razorpay_key_secret: '',
    paytm_enabled: false,
    paytm_merchant_id: '',
    paytm_merchant_key: '',
    cashfree_enabled: false,
    cashfree_app_id: '',
    cashfree_secret_key: '',
    bharatpay_enabled: false,
    bharatpay_merchant_id: '',
    bharatpay_api_key: '',
    payyou_enabled: false,
    payyou_merchant_id: '',
    payyou_api_key: '',
    phonepe_enabled: false,
    phonepe_merchant_id: '',
    phonepe_salt_key: '',
    phonepe_salt_index: '',
    cod_enabled: true,
  });

  useEffect(() => { fetchSettings(); }, []);

  const fetchSettings = async () => {
    const { data } = await supabase.from('payment_settings').select('*').limit(1).maybeSingle();
    if (data) {
      setSettings({
        upi_id: data.upi_id || '',
        upi_enabled: data.upi_enabled ?? true,
        razorpay_enabled: data.razorpay_enabled ?? false,
        razorpay_key_id: data.razorpay_key_id || '',
        razorpay_key_secret: data.razorpay_key_secret || '',
        paytm_enabled: (data as any).paytm_enabled ?? false,
        paytm_merchant_id: (data as any).paytm_merchant_id || '',
        paytm_merchant_key: (data as any).paytm_merchant_key || '',
        cashfree_enabled: (data as any).cashfree_enabled ?? false,
        cashfree_app_id: (data as any).cashfree_app_id || '',
        cashfree_secret_key: (data as any).cashfree_secret_key || '',
        bharatpay_enabled: (data as any).bharatpay_enabled ?? false,
        bharatpay_merchant_id: (data as any).bharatpay_merchant_id || '',
        bharatpay_api_key: (data as any).bharatpay_api_key || '',
        payyou_enabled: (data as any).payyou_enabled ?? false,
        payyou_merchant_id: (data as any).payyou_merchant_id || '',
        payyou_api_key: (data as any).payyou_api_key || '',
        phonepe_enabled: (data as any).phonepe_enabled ?? false,
        phonepe_merchant_id: (data as any).phonepe_merchant_id || '',
        phonepe_salt_key: (data as any).phonepe_salt_key || '',
        phonepe_salt_index: (data as any).phonepe_salt_index || '',
        cod_enabled: (data as any).cod_enabled ?? true,
      });
    }
    setLoading(false);
  };

  const updateSetting = <K extends keyof PaymentSettings>(key: K, value: PaymentSettings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const toggleSecret = (key: string) => {
    setShowSecrets(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      const { data: existing } = await supabase.from('payment_settings').select('id').limit(1).maybeSingle();
      
      const settingsData = {
        upi_id: settings.upi_id,
        upi_enabled: settings.upi_enabled,
        razorpay_enabled: settings.razorpay_enabled,
        razorpay_key_id: settings.razorpay_key_id,
        razorpay_key_secret: settings.razorpay_key_secret,
        paytm_enabled: settings.paytm_enabled,
        paytm_merchant_id: settings.paytm_merchant_id,
        paytm_merchant_key: settings.paytm_merchant_key,
        cashfree_enabled: settings.cashfree_enabled,
        cashfree_app_id: settings.cashfree_app_id,
        cashfree_secret_key: settings.cashfree_secret_key,
        bharatpay_enabled: settings.bharatpay_enabled,
        bharatpay_merchant_id: settings.bharatpay_merchant_id,
        bharatpay_api_key: settings.bharatpay_api_key,
        payyou_enabled: settings.payyou_enabled,
        payyou_merchant_id: settings.payyou_merchant_id,
        payyou_api_key: settings.payyou_api_key,
        phonepe_enabled: settings.phonepe_enabled,
        phonepe_merchant_id: settings.phonepe_merchant_id,
        phonepe_salt_key: settings.phonepe_salt_key,
        phonepe_salt_index: settings.phonepe_salt_index,
        cod_enabled: settings.cod_enabled,
      };

      if (existing) {
        await supabase.from('payment_settings').update(settingsData as any).eq('id', existing.id);
      } else {
        await supabase.from('payment_settings').insert(settingsData as any);
      }
      toast.success('Settings saved successfully!');
    } catch (error) { 
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings'); 
    } finally { 
      setSaving(false); 
    }
  };

  const enabledGatewaysCount = [
    settings.razorpay_enabled,
    settings.upi_enabled,
    settings.paytm_enabled,
    settings.cashfree_enabled,
    settings.bharatpay_enabled,
    settings.payyou_enabled,
    settings.phonepe_enabled,
  ].filter(Boolean).length;

  const SecretInput = ({ 
    id, 
    value, 
    onChange, 
    placeholder, 
    disabled 
  }: { 
    id: string; 
    value: string; 
    onChange: (v: string) => void; 
    placeholder: string; 
    disabled?: boolean;
  }) => (
    <div className="relative">
      <Input
        id={id}
        type={showSecrets[id] ? 'text' : 'password'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className="pr-10"
      />
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="absolute right-0 top-0 h-full px-3"
        onClick={() => toggleSecret(id)}
        disabled={disabled}
      >
        {showSecrets[id] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </Button>
    </div>
  );

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-3xl font-bold">Payment Settings</h1>
            <p className="text-muted-foreground mt-1">
              Manage all your payment gateways from one place
            </p>
          </div>
          <Badge variant="secondary" className="text-sm">
            {enabledGatewaysCount} Active Gateway{enabledGatewaysCount !== 1 ? 's' : ''}
          </Badge>
        </div>
        
        {loading ? (
          <div className="h-96 bg-muted animate-pulse rounded-lg" />
        ) : (
          <div className="space-y-6">
            <Tabs defaultValue="razorpay" className="w-full">
              <TabsList className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 w-full h-auto gap-1 p-1">
                <TabsTrigger value="razorpay" className="text-xs sm:text-sm">
                  Razorpay
                  {settings.razorpay_enabled && <span className="ml-1 w-2 h-2 bg-green-500 rounded-full" />}
                </TabsTrigger>
                <TabsTrigger value="upi" className="text-xs sm:text-sm">
                  UPI
                  {settings.upi_enabled && <span className="ml-1 w-2 h-2 bg-green-500 rounded-full" />}
                </TabsTrigger>
                <TabsTrigger value="paytm" className="text-xs sm:text-sm">
                  Paytm
                  {settings.paytm_enabled && <span className="ml-1 w-2 h-2 bg-green-500 rounded-full" />}
                </TabsTrigger>
                <TabsTrigger value="cashfree" className="text-xs sm:text-sm">
                  Cashfree
                  {settings.cashfree_enabled && <span className="ml-1 w-2 h-2 bg-green-500 rounded-full" />}
                </TabsTrigger>
                <TabsTrigger value="bharatpay" className="text-xs sm:text-sm">
                  BharatPay
                  {settings.bharatpay_enabled && <span className="ml-1 w-2 h-2 bg-green-500 rounded-full" />}
                </TabsTrigger>
                <TabsTrigger value="payyou" className="text-xs sm:text-sm">
                  PayYou
                  {settings.payyou_enabled && <span className="ml-1 w-2 h-2 bg-green-500 rounded-full" />}
                </TabsTrigger>
                <TabsTrigger value="phonepe" className="text-xs sm:text-sm">
                  PhonePe
                  {settings.phonepe_enabled && <span className="ml-1 w-2 h-2 bg-green-500 rounded-full" />}
                </TabsTrigger>
                <TabsTrigger value="cod" className="text-xs sm:text-sm">
                  COD
                  {settings.cod_enabled && <span className="ml-1 w-2 h-2 bg-green-500 rounded-full" />}
                </TabsTrigger>
              </TabsList>

              {/* Razorpay */}
              <TabsContent value="razorpay">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <CreditCard className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                          <CardTitle>Razorpay Payment Gateway</CardTitle>
                          <CardDescription>Accept payments via Cards, UPI, Netbanking & more</CardDescription>
                        </div>
                      </div>
                      <Switch
                        checked={settings.razorpay_enabled}
                        onCheckedChange={(v) => updateSetting('razorpay_enabled', v)}
                      />
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="razorpay-key-id">Razorpay Key ID</Label>
                      <Input
                        id="razorpay-key-id"
                        value={settings.razorpay_key_id}
                        onChange={(e) => updateSetting('razorpay_key_id', e.target.value)}
                        placeholder="rzp_test_xxxxxxxxxxxxx"
                        disabled={!settings.razorpay_enabled}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="razorpay-secret">Razorpay Key Secret</Label>
                      <SecretInput
                        id="razorpay-secret"
                        value={settings.razorpay_key_secret}
                        onChange={(v) => updateSetting('razorpay_key_secret', v)}
                        placeholder="Enter your Razorpay Key Secret"
                        disabled={!settings.razorpay_enabled}
                      />
                    </div>
                    {settings.razorpay_enabled && (!settings.razorpay_key_id || !settings.razorpay_key_secret) && (
                      <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                        <p className="text-sm text-destructive">
                          ⚠️ Please enter both Key ID and Key Secret to enable Razorpay payments
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* UPI */}
              <TabsContent value="upi">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-100 rounded-lg">
                          <Smartphone className="h-6 w-6 text-green-600" />
                        </div>
                        <div>
                          <CardTitle>UPI Direct Payment</CardTitle>
                          <CardDescription>Accept payments via QR code and UPI apps</CardDescription>
                        </div>
                      </div>
                      <Switch
                        checked={settings.upi_enabled}
                        onCheckedChange={(v) => updateSetting('upi_enabled', v)}
                      />
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="upi-id">UPI ID</Label>
                      <Input
                        id="upi-id"
                        value={settings.upi_id}
                        onChange={(e) => updateSetting('upi_id', e.target.value)}
                        placeholder="yourname@upi"
                        disabled={!settings.upi_enabled}
                      />
                      <p className="text-xs text-muted-foreground">
                        Your UPI ID for receiving payments via QR code
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Paytm */}
              <TabsContent value="paytm">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <Wallet className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                          <CardTitle>Paytm Payment Gateway</CardTitle>
                          <CardDescription>Accept payments via Paytm Wallet, UPI, Cards & Netbanking</CardDescription>
                        </div>
                      </div>
                      <Switch
                        checked={settings.paytm_enabled}
                        onCheckedChange={(v) => updateSetting('paytm_enabled', v)}
                      />
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="paytm-merchant-id">Merchant ID</Label>
                      <Input
                        id="paytm-merchant-id"
                        value={settings.paytm_merchant_id}
                        onChange={(e) => updateSetting('paytm_merchant_id', e.target.value)}
                        placeholder="Enter your Paytm Merchant ID"
                        disabled={!settings.paytm_enabled}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="paytm-key">Merchant Key</Label>
                      <SecretInput
                        id="paytm-key"
                        value={settings.paytm_merchant_key}
                        onChange={(v) => updateSetting('paytm_merchant_key', v)}
                        placeholder="Enter your Paytm Merchant Key"
                        disabled={!settings.paytm_enabled}
                      />
                    </div>
                    {settings.paytm_enabled && (!settings.paytm_merchant_id || !settings.paytm_merchant_key) && (
                      <div className="p-3 bg-amber-50 border border-amber-200 rounded-md">
                        <p className="text-sm text-amber-700">
                          ⚠️ Enter Merchant ID and Key to enable Paytm payments
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Cashfree */}
              <TabsContent value="cashfree">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-100 rounded-lg">
                          <Banknote className="h-6 w-6 text-purple-600" />
                        </div>
                        <div>
                          <CardTitle>Cashfree Payment Gateway</CardTitle>
                          <CardDescription>Accept payments with low transaction fees</CardDescription>
                        </div>
                      </div>
                      <Switch
                        checked={settings.cashfree_enabled}
                        onCheckedChange={(v) => updateSetting('cashfree_enabled', v)}
                      />
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="cashfree-app-id">App ID</Label>
                      <Input
                        id="cashfree-app-id"
                        value={settings.cashfree_app_id}
                        onChange={(e) => updateSetting('cashfree_app_id', e.target.value)}
                        placeholder="Enter your Cashfree App ID"
                        disabled={!settings.cashfree_enabled}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cashfree-secret">Secret Key</Label>
                      <SecretInput
                        id="cashfree-secret"
                        value={settings.cashfree_secret_key}
                        onChange={(v) => updateSetting('cashfree_secret_key', v)}
                        placeholder="Enter your Cashfree Secret Key"
                        disabled={!settings.cashfree_enabled}
                      />
                    </div>
                    {settings.cashfree_enabled && (!settings.cashfree_app_id || !settings.cashfree_secret_key) && (
                      <div className="p-3 bg-amber-50 border border-amber-200 rounded-md">
                        <p className="text-sm text-amber-700">
                          ⚠️ Enter App ID and Secret Key to enable Cashfree payments
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* BharatPay */}
              <TabsContent value="bharatpay">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-orange-100 rounded-lg">
                          <Building2 className="h-6 w-6 text-orange-600" />
                        </div>
                        <div>
                          <CardTitle>BharatPay Merchant Gateway</CardTitle>
                          <CardDescription>Accept UPI and bank payments with BharatPay</CardDescription>
                        </div>
                      </div>
                      <Switch
                        checked={settings.bharatpay_enabled}
                        onCheckedChange={(v) => updateSetting('bharatpay_enabled', v)}
                      />
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="bharatpay-merchant-id">Merchant ID</Label>
                      <Input
                        id="bharatpay-merchant-id"
                        value={settings.bharatpay_merchant_id}
                        onChange={(e) => updateSetting('bharatpay_merchant_id', e.target.value)}
                        placeholder="Enter your BharatPay Merchant ID"
                        disabled={!settings.bharatpay_enabled}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="bharatpay-api-key">API Key</Label>
                      <SecretInput
                        id="bharatpay-api-key"
                        value={settings.bharatpay_api_key}
                        onChange={(v) => updateSetting('bharatpay_api_key', v)}
                        placeholder="Enter your BharatPay API Key"
                        disabled={!settings.bharatpay_enabled}
                      />
                    </div>
                    {settings.bharatpay_enabled && (!settings.bharatpay_merchant_id || !settings.bharatpay_api_key) && (
                      <div className="p-3 bg-amber-50 border border-amber-200 rounded-md">
                        <p className="text-sm text-amber-700">
                          ⚠️ Enter Merchant ID and API Key to enable BharatPay payments
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* PayYou Biz */}
              <TabsContent value="payyou">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-teal-100 rounded-lg">
                          <Wallet className="h-6 w-6 text-teal-600" />
                        </div>
                        <div>
                          <CardTitle>PayYou Biz Gateway</CardTitle>
                          <CardDescription>Accept business payments with PayYou</CardDescription>
                        </div>
                      </div>
                      <Switch
                        checked={settings.payyou_enabled}
                        onCheckedChange={(v) => updateSetting('payyou_enabled', v)}
                      />
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="payyou-merchant-id">Merchant ID</Label>
                      <Input
                        id="payyou-merchant-id"
                        value={settings.payyou_merchant_id}
                        onChange={(e) => updateSetting('payyou_merchant_id', e.target.value)}
                        placeholder="Enter your PayYou Merchant ID"
                        disabled={!settings.payyou_enabled}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="payyou-api-key">API Key</Label>
                      <SecretInput
                        id="payyou-api-key"
                        value={settings.payyou_api_key}
                        onChange={(v) => updateSetting('payyou_api_key', v)}
                        placeholder="Enter your PayYou API Key"
                        disabled={!settings.payyou_enabled}
                      />
                    </div>
                    {settings.payyou_enabled && (!settings.payyou_merchant_id || !settings.payyou_api_key) && (
                      <div className="p-3 bg-amber-50 border border-amber-200 rounded-md">
                        <p className="text-sm text-amber-700">
                          ⚠️ Enter Merchant ID and API Key to enable PayYou payments
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* PhonePe Merchant */}
              <TabsContent value="phonepe">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-100 rounded-lg">
                          <Smartphone className="h-6 w-6 text-indigo-600" />
                        </div>
                        <div>
                          <CardTitle>PhonePe Merchant Gateway</CardTitle>
                          <CardDescription>Accept payments via PhonePe Business</CardDescription>
                        </div>
                      </div>
                      <Switch
                        checked={settings.phonepe_enabled}
                        onCheckedChange={(v) => updateSetting('phonepe_enabled', v)}
                      />
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="phonepe-merchant-id">Merchant ID</Label>
                      <Input
                        id="phonepe-merchant-id"
                        value={settings.phonepe_merchant_id}
                        onChange={(e) => updateSetting('phonepe_merchant_id', e.target.value)}
                        placeholder="Enter your PhonePe Merchant ID"
                        disabled={!settings.phonepe_enabled}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phonepe-salt-key">Salt Key</Label>
                      <SecretInput
                        id="phonepe-salt-key"
                        value={settings.phonepe_salt_key}
                        onChange={(v) => updateSetting('phonepe_salt_key', v)}
                        placeholder="Enter your PhonePe Salt Key"
                        disabled={!settings.phonepe_enabled}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phonepe-salt-index">Salt Index</Label>
                      <Input
                        id="phonepe-salt-index"
                        value={settings.phonepe_salt_index}
                        onChange={(e) => updateSetting('phonepe_salt_index', e.target.value)}
                        placeholder="e.g., 1"
                        disabled={!settings.phonepe_enabled}
                      />
                    </div>
                    {settings.phonepe_enabled && (!settings.phonepe_merchant_id || !settings.phonepe_salt_key) && (
                      <div className="p-3 bg-amber-50 border border-amber-200 rounded-md">
                        <p className="text-sm text-amber-700">
                          ⚠️ Enter Merchant ID and Salt Key to enable PhonePe payments
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Cash on Delivery */}
              <TabsContent value="cod">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-amber-100 rounded-lg">
                          <Banknote className="h-6 w-6 text-amber-600" />
                        </div>
                        <div>
                          <CardTitle>Cash on Delivery (COD)</CardTitle>
                          <CardDescription>Allow customers to pay when they receive their order</CardDescription>
                        </div>
                      </div>
                      <Switch
                        checked={settings.cod_enabled}
                        onCheckedChange={(v) => updateSetting('cod_enabled', v)}
                      />
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                      <h4 className="font-medium text-amber-800 mb-2">💰 Cash on Delivery Settings</h4>
                      <ul className="text-sm text-amber-700 space-y-1">
                        <li>• जब यह ON है, तो customers COD से order कर सकते हैं</li>
                        <li>• जब यह OFF है, तो COD option checkout में नहीं दिखेगा</li>
                        <li>• आप individual products के लिए भी COD on/off कर सकते हैं (Products section में)</li>
                      </ul>
                    </div>
                    
                    {settings.cod_enabled ? (
                      <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                        <p className="text-sm text-green-700 flex items-center gap-2">
                          ✅ Cash on Delivery is currently <strong>enabled</strong> for your store
                        </p>
                      </div>
                    ) : (
                      <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                        <p className="text-sm text-red-700 flex items-center gap-2">
                          ❌ Cash on Delivery is currently <strong>disabled</strong> - customers must pay online
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            {/* Save Button */}
            <Button 
              onClick={saveSettings} 
              disabled={saving} 
              size="lg"
              className="w-full sm:w-auto"
            >
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save All Settings
            </Button>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
