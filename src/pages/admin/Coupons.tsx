import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Pencil, Trash2, Ticket, Calendar, Percent, IndianRupee, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format, addDays } from 'date-fns';

interface Coupon {
  id: string;
  code: string;
  description: string | null;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  min_order_amount: number | null;
  max_discount_amount: number | null;
  usage_limit: number | null;
  used_count: number;
  is_active: boolean;
  valid_from: string;
  valid_until: string | null;
  created_at: string;
}

const initialFormData = {
  code: '',
  description: '',
  discount_type: 'percentage' as 'percentage' | 'fixed',
  discount_value: 10,
  min_order_amount: 0,
  max_discount_amount: null as number | null,
  usage_limit: null as number | null,
  is_active: true,
  valid_from: format(new Date(), 'yyyy-MM-dd'),
  valid_until: '',
  expiry_days: '',
};

export default function AdminCoupons() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [formData, setFormData] = useState(initialFormData);

  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('coupons')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching coupons:', error);
      toast.error('Failed to load coupons');
    } else {
      setCoupons((data || []) as Coupon[]);
    }
    setLoading(false);
  };

  const handleOpenDialog = (coupon?: Coupon) => {
    if (coupon) {
      setEditingCoupon(coupon);
      setFormData({
        code: coupon.code,
        description: coupon.description || '',
        discount_type: coupon.discount_type,
        discount_value: coupon.discount_value,
        min_order_amount: coupon.min_order_amount || 0,
        max_discount_amount: coupon.max_discount_amount,
        usage_limit: coupon.usage_limit,
        is_active: coupon.is_active,
        valid_from: format(new Date(coupon.valid_from), 'yyyy-MM-dd'),
        valid_until: coupon.valid_until ? format(new Date(coupon.valid_until), 'yyyy-MM-dd') : '',
        expiry_days: '',
      });
    } else {
      setEditingCoupon(null);
      setFormData(initialFormData);
    }
    setDialogOpen(true);
  };

  const handleExpiryDaysChange = (days: string) => {
    setFormData(prev => ({
      ...prev,
      expiry_days: days,
      valid_until: days ? format(addDays(new Date(), parseInt(days)), 'yyyy-MM-dd') : '',
    }));
  };

  const handleSave = async () => {
    if (!formData.code.trim()) {
      toast.error('Coupon code is required');
      return;
    }

    setSaving(true);

    const couponData = {
      code: formData.code.toUpperCase().trim(),
      description: formData.description || null,
      discount_type: formData.discount_type,
      discount_value: formData.discount_value,
      min_order_amount: formData.min_order_amount || 0,
      max_discount_amount: formData.max_discount_amount || null,
      usage_limit: formData.usage_limit || null,
      is_active: formData.is_active,
      valid_from: new Date(formData.valid_from).toISOString(),
      valid_until: formData.valid_until ? new Date(formData.valid_until).toISOString() : null,
    };

    try {
      if (editingCoupon) {
        const { error } = await supabase
          .from('coupons')
          .update(couponData)
          .eq('id', editingCoupon.id);

        if (error) throw error;
        toast.success('Coupon updated successfully');
      } else {
        const { error } = await supabase
          .from('coupons')
          .insert(couponData);

        if (error) throw error;
        toast.success('Coupon created successfully');
      }

      setDialogOpen(false);
      fetchCoupons();
    } catch (error: any) {
      console.error('Error saving coupon:', error);
      toast.error(error.message || 'Failed to save coupon');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this coupon?')) return;

    const { error } = await supabase.from('coupons').delete().eq('id', id);

    if (error) {
      console.error('Error deleting coupon:', error);
      toast.error('Failed to delete coupon');
    } else {
      toast.success('Coupon deleted');
      fetchCoupons();
    }
  };

  const toggleActive = async (id: string, is_active: boolean) => {
    const { error } = await supabase
      .from('coupons')
      .update({ is_active: !is_active })
      .eq('id', id);

    if (error) {
      toast.error('Failed to update coupon');
    } else {
      fetchCoupons();
    }
  };

  const getCouponStatus = (coupon: Coupon) => {
    if (!coupon.is_active) return { label: 'Inactive', variant: 'secondary' as const };
    if (coupon.valid_until && new Date(coupon.valid_until) < new Date()) {
      return { label: 'Expired', variant: 'destructive' as const };
    }
    if (coupon.usage_limit && coupon.used_count >= coupon.usage_limit) {
      return { label: 'Exhausted', variant: 'outline' as const };
    }
    return { label: 'Active', variant: 'default' as const };
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Ticket className="h-6 w-6" />
              Coupon Management
            </h1>
            <p className="text-muted-foreground">Create and manage discount coupons</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => handleOpenDialog()}>
                <Plus className="h-4 w-4 mr-2" />
                Add Coupon
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingCoupon ? 'Edit Coupon' : 'Create New Coupon'}</DialogTitle>
              </DialogHeader>
              
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Coupon Code *</Label>
                    <Input
                      placeholder="e.g., SAVE20"
                      value={formData.code}
                      onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                      className="uppercase"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <div className="flex items-center gap-2 pt-2">
                      <Switch
                        checked={formData.is_active}
                        onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
                      />
                      <span className="text-sm">{formData.is_active ? 'Active' : 'Inactive'}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Description</Label>
                  <Input
                    placeholder="e.g., 20% off on all products"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Discount Type</Label>
                    <Select
                      value={formData.discount_type}
                      onValueChange={(value: 'percentage' | 'fixed') => setFormData(prev => ({ ...prev, discount_type: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="percentage">Percentage (%)</SelectItem>
                        <SelectItem value="fixed">Fixed Amount (₹)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Discount Value *</Label>
                    <div className="relative">
                      <Input
                        type="number"
                        min={0}
                        value={formData.discount_value}
                        onChange={(e) => setFormData(prev => ({ ...prev, discount_value: parseFloat(e.target.value) || 0 }))}
                        className="pl-8"
                      />
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                        {formData.discount_type === 'percentage' ? '%' : '₹'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Minimum Order Amount (₹)</Label>
                    <Input
                      type="number"
                      min={0}
                      value={formData.min_order_amount}
                      onChange={(e) => setFormData(prev => ({ ...prev, min_order_amount: parseFloat(e.target.value) || 0 }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Maximum Discount (₹)</Label>
                    <Input
                      type="number"
                      min={0}
                      placeholder="No limit"
                      value={formData.max_discount_amount || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, max_discount_amount: e.target.value ? parseFloat(e.target.value) : null }))}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Usage Limit</Label>
                  <Input
                    type="number"
                    min={1}
                    placeholder="Unlimited"
                    value={formData.usage_limit || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, usage_limit: e.target.value ? parseInt(e.target.value) : null }))}
                  />
                  <p className="text-xs text-muted-foreground">Leave empty for unlimited usage</p>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Valid From</Label>
                    <Input
                      type="date"
                      value={formData.valid_from}
                      onChange={(e) => setFormData(prev => ({ ...prev, valid_from: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Valid Until</Label>
                    <Input
                      type="date"
                      value={formData.valid_until}
                      onChange={(e) => setFormData(prev => ({ ...prev, valid_until: e.target.value, expiry_days: '' }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Or Expire After (Days)</Label>
                    <Select
                      value={formData.expiry_days}
                      onValueChange={handleExpiryDaysChange}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select days" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1 Day</SelectItem>
                        <SelectItem value="3">3 Days</SelectItem>
                        <SelectItem value="7">7 Days</SelectItem>
                        <SelectItem value="15">15 Days</SelectItem>
                        <SelectItem value="30">30 Days</SelectItem>
                        <SelectItem value="60">60 Days</SelectItem>
                        <SelectItem value="90">90 Days</SelectItem>
                        <SelectItem value="180">180 Days</SelectItem>
                        <SelectItem value="365">1 Year</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleSave} disabled={saving}>
                    {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    {editingCoupon ? 'Update Coupon' : 'Create Coupon'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{coupons.length}</div>
              <p className="text-sm text-muted-foreground">Total Coupons</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-green-600">
                {coupons.filter(c => getCouponStatus(c).label === 'Active').length}
              </div>
              <p className="text-sm text-muted-foreground">Active Coupons</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-red-600">
                {coupons.filter(c => getCouponStatus(c).label === 'Expired').length}
              </div>
              <p className="text-sm text-muted-foreground">Expired Coupons</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-blue-600">
                {coupons.reduce((sum, c) => sum + c.used_count, 0)}
              </div>
              <p className="text-sm text-muted-foreground">Total Redemptions</p>
            </CardContent>
          </Card>
        </div>

        {/* Coupons Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Coupons</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : coupons.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Ticket className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No coupons created yet</p>
                <Button variant="outline" className="mt-4" onClick={() => handleOpenDialog()}>
                  Create your first coupon
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Discount</TableHead>
                    <TableHead>Min Order</TableHead>
                    <TableHead>Usage</TableHead>
                    <TableHead>Validity</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {coupons.map((coupon) => {
                    const status = getCouponStatus(coupon);
                    return (
                      <TableRow key={coupon.id}>
                        <TableCell>
                          <div>
                            <span className="font-mono font-bold">{coupon.code}</span>
                            {coupon.description && (
                              <p className="text-xs text-muted-foreground">{coupon.description}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            {coupon.discount_type === 'percentage' ? (
                              <>
                                <Percent className="h-3 w-3" />
                                {coupon.discount_value}%
                              </>
                            ) : (
                              <>
                                <IndianRupee className="h-3 w-3" />
                                {coupon.discount_value}
                              </>
                            )}
                          </div>
                          {coupon.max_discount_amount && (
                            <p className="text-xs text-muted-foreground">Max: ₹{coupon.max_discount_amount}</p>
                          )}
                        </TableCell>
                        <TableCell>
                          {coupon.min_order_amount ? `₹${coupon.min_order_amount}` : '-'}
                        </TableCell>
                        <TableCell>
                          {coupon.used_count}{coupon.usage_limit ? ` / ${coupon.usage_limit}` : ''}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {format(new Date(coupon.valid_from), 'dd MMM')}
                              {coupon.valid_until && (
                                <> - {format(new Date(coupon.valid_until), 'dd MMM yyyy')}</>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={status.variant}>{status.label}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Switch
                              checked={coupon.is_active}
                              onCheckedChange={() => toggleActive(coupon.id, coupon.is_active)}
                            />
                            <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(coupon)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleDelete(coupon.id)}>
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}