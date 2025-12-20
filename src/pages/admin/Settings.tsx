import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export default function AdminSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [upiId, setUpiId] = useState('');

  useEffect(() => { fetchSettings(); }, []);

  const fetchSettings = async () => {
    const { data } = await supabase.from('payment_settings').select('*').limit(1).maybeSingle();
    if (data) setUpiId(data.upi_id || '');
    setLoading(false);
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      const { data: existing } = await supabase.from('payment_settings').select('id').limit(1).maybeSingle();
      if (existing) {
        await supabase.from('payment_settings').update({ upi_id: upiId }).eq('id', existing.id);
      } else {
        await supabase.from('payment_settings').insert({ upi_id: upiId });
      }
      toast.success('Settings saved');
    } catch (error) { toast.error('Failed to save'); } finally { setSaving(false); }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <h1 className="font-display text-3xl font-bold">Settings</h1>
        {loading ? <div className="h-48 bg-muted animate-pulse rounded-lg" /> : (
          <Card>
            <CardHeader><CardTitle>Payment Settings</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>UPI ID (for QR generation)</Label>
                <Input value={upiId} onChange={(e) => setUpiId(e.target.value)} placeholder="yourname@upi" />
                <p className="text-sm text-muted-foreground">Razorpay is already configured via environment secrets</p>
              </div>
              <Button onClick={saveSettings} disabled={saving} className="bg-accent">
                {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Save Settings
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
}
