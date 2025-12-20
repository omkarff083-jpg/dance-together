import { useState, useEffect } from 'react';
import { Loader2, Eye, EyeOff, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Switch } from '@/components/ui/switch';

export default function AdminSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [upiId, setUpiId] = useState('');
  const [upiEnabled, setUpiEnabled] = useState(true);
  const [razorpayEnabled, setRazorpayEnabled] = useState(false);
  const [razorpayKeyId, setRazorpayKeyId] = useState('');
  const [razorpayKeySecret, setRazorpayKeySecret] = useState('');
  const [showSecret, setShowSecret] = useState(false);

  useEffect(() => { fetchSettings(); }, []);

  const fetchSettings = async () => {
    const { data } = await supabase.from('payment_settings').select('*').limit(1).maybeSingle();
    if (data) {
      setUpiId(data.upi_id || '');
      setUpiEnabled(data.upi_enabled ?? true);
      setRazorpayEnabled(data.razorpay_enabled ?? false);
      setRazorpayKeyId(data.razorpay_key_id || '');
      setRazorpayKeySecret(data.razorpay_key_secret || '');
    }
    setLoading(false);
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      const { data: existing } = await supabase.from('payment_settings').select('id').limit(1).maybeSingle();
      
      const settingsData = {
        upi_id: upiId,
        upi_enabled: upiEnabled,
        razorpay_enabled: razorpayEnabled,
        razorpay_key_id: razorpayKeyId,
        razorpay_key_secret: razorpayKeySecret,
      };

      if (existing) {
        await supabase.from('payment_settings').update(settingsData).eq('id', existing.id);
      } else {
        await supabase.from('payment_settings').insert(settingsData);
      }
      toast.success('Settings saved successfully!');
    } catch (error) { 
      toast.error('Failed to save settings'); 
    } finally { 
      setSaving(false); 
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <h1 className="font-display text-3xl font-bold">Payment Settings</h1>
        
        {loading ? (
          <div className="h-48 bg-muted animate-pulse rounded-lg" />
        ) : (
          <div className="grid gap-6">
            {/* Razorpay Settings */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CreditCard className="h-6 w-6 text-primary" />
                    <div>
                      <CardTitle>Razorpay Settings</CardTitle>
                      <CardDescription>Configure your Razorpay payment gateway</CardDescription>
                    </div>
                  </div>
                  <Switch
                    checked={razorpayEnabled}
                    onCheckedChange={setRazorpayEnabled}
                  />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="razorpay-key-id">Razorpay Key ID</Label>
                  <Input
                    id="razorpay-key-id"
                    value={razorpayKeyId}
                    onChange={(e) => setRazorpayKeyId(e.target.value)}
                    placeholder="rzp_test_xxxxxxxxxxxxx"
                    disabled={!razorpayEnabled}
                  />
                  <p className="text-xs text-muted-foreground">
                    Your Razorpay API Key ID (starts with rzp_test_ or rzp_live_)
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="razorpay-secret">Razorpay Key Secret</Label>
                  <div className="relative">
                    <Input
                      id="razorpay-secret"
                      type={showSecret ? 'text' : 'password'}
                      value={razorpayKeySecret}
                      onChange={(e) => setRazorpayKeySecret(e.target.value)}
                      placeholder="Enter your Razorpay Key Secret"
                      disabled={!razorpayEnabled}
                      className="pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowSecret(!showSecret)}
                      disabled={!razorpayEnabled}
                    >
                      {showSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Your Razorpay API Key Secret (keep this secure!)
                  </p>
                </div>

                {razorpayEnabled && (!razorpayKeyId || !razorpayKeySecret) && (
                  <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                    <p className="text-sm text-destructive">
                      ⚠️ Please enter both Key ID and Key Secret to enable Razorpay payments
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* UPI Settings */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>UPI Settings</CardTitle>
                    <CardDescription>Configure UPI QR code payments</CardDescription>
                  </div>
                  <Switch
                    checked={upiEnabled}
                    onCheckedChange={setUpiEnabled}
                  />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="upi-id">UPI ID</Label>
                  <Input
                    id="upi-id"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    placeholder="yourname@upi"
                    disabled={!upiEnabled}
                  />
                  <p className="text-xs text-muted-foreground">
                    Your UPI ID for receiving payments via QR code
                  </p>
                </div>
              </CardContent>
            </Card>

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