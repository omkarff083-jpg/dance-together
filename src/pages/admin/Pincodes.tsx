import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Search, Loader2, MapPin, Truck, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Pincode {
  id: string;
  pincode: string;
  city: string | null;
  state: string | null;
  delivery_days: number | null;
  cod_available: boolean | null;
  is_active: boolean | null;
  created_at: string;
}

export default function AdminPincodes() {
  const [pincodes, setPincodes] = useState<Pincode[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPincode, setEditingPincode] = useState<Pincode | null>(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    pincode: '',
    city: '',
    state: '',
    delivery_days: 5,
    cod_available: true,
    is_active: true,
  });

  useEffect(() => {
    fetchPincodes();
  }, []);

  const fetchPincodes = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('serviceable_pincodes')
      .select('*')
      .order('pincode', { ascending: true });

    if (error) {
      console.error('Error fetching pincodes:', error);
      toast.error('Failed to load pincodes');
    } else {
      setPincodes(data || []);
    }
    setLoading(false);
  };

  const resetForm = () => {
    setFormData({
      pincode: '',
      city: '',
      state: '',
      delivery_days: 5,
      cod_available: true,
      is_active: true,
    });
    setEditingPincode(null);
  };

  const openEditDialog = (pincode: Pincode) => {
    setEditingPincode(pincode);
    setFormData({
      pincode: pincode.pincode,
      city: pincode.city || '',
      state: pincode.state || '',
      delivery_days: pincode.delivery_days || 5,
      cod_available: pincode.cod_available ?? true,
      is_active: pincode.is_active ?? true,
    });
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.pincode || formData.pincode.length !== 6) {
      toast.error('Please enter a valid 6-digit pincode');
      return;
    }

    setSaving(true);

    try {
      const pincodeData = {
        pincode: formData.pincode,
        city: formData.city || null,
        state: formData.state || null,
        delivery_days: formData.delivery_days,
        cod_available: formData.cod_available,
        is_active: formData.is_active,
      };

      if (editingPincode) {
        const { error } = await supabase
          .from('serviceable_pincodes')
          .update(pincodeData)
          .eq('id', editingPincode.id);

        if (error) throw error;
        toast.success('Pincode updated successfully');
      } else {
        const { error } = await supabase
          .from('serviceable_pincodes')
          .insert(pincodeData);

        if (error) {
          if (error.code === '23505') {
            toast.error('This pincode already exists');
            setSaving(false);
            return;
          }
          throw error;
        }
        toast.success('Pincode added successfully');
      }

      setIsDialogOpen(false);
      resetForm();
      fetchPincodes();
    } catch (error) {
      console.error('Error saving pincode:', error);
      toast.error('Failed to save pincode');
    }

    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('serviceable_pincodes')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Pincode deleted successfully');
      fetchPincodes();
    } catch (error) {
      console.error('Error deleting pincode:', error);
      toast.error('Failed to delete pincode');
    }
  };

  const toggleActive = async (pincode: Pincode) => {
    try {
      const { error } = await supabase
        .from('serviceable_pincodes')
        .update({ is_active: !pincode.is_active })
        .eq('id', pincode.id);

      if (error) throw error;
      toast.success(pincode.is_active ? 'Pincode deactivated' : 'Pincode activated');
      fetchPincodes();
    } catch (error) {
      console.error('Error toggling pincode:', error);
      toast.error('Failed to update pincode');
    }
  };

  const filteredPincodes = pincodes.filter(
    (p) =>
      p.pincode.includes(search) ||
      p.city?.toLowerCase().includes(search.toLowerCase()) ||
      p.state?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Serviceable Pincodes</h1>
            <p className="text-muted-foreground">Manage delivery areas and pincode availability</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Pincode
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md bg-background">
              <DialogHeader>
                <DialogTitle>
                  {editingPincode ? 'Edit Pincode' : 'Add New Pincode'}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="pincode">Pincode *</Label>
                  <Input
                    id="pincode"
                    value={formData.pincode}
                    onChange={(e) => setFormData({ ...formData, pincode: e.target.value.replace(/\D/g, '').slice(0, 6) })}
                    placeholder="Enter 6-digit pincode"
                    maxLength={6}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      placeholder="City name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state">State</Label>
                    <Input
                      id="state"
                      value={formData.state}
                      onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                      placeholder="State name"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="delivery_days">Delivery Days</Label>
                  <Input
                    id="delivery_days"
                    type="number"
                    min="1"
                    max="30"
                    value={formData.delivery_days}
                    onChange={(e) => setFormData({ ...formData, delivery_days: parseInt(e.target.value) || 5 })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="cod_available">COD Available</Label>
                  <Switch
                    id="cod_available"
                    checked={formData.cod_available}
                    onCheckedChange={(checked) => setFormData({ ...formData, cod_available: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="is_active">Active</Label>
                  <Switch
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                  />
                </div>

                <Button onClick={handleSave} disabled={saving} className="w-full">
                  {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  {editingPincode ? 'Update Pincode' : 'Add Pincode'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <MapPin className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{pincodes.length}</p>
                <p className="text-sm text-muted-foreground">Total Pincodes</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                <Check className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{pincodes.filter(p => p.is_active).length}</p>
                <p className="text-sm text-muted-foreground">Active Pincodes</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                <Truck className="h-5 w-5 text-accent" />
              </div>
              <div>
                <p className="text-2xl font-bold">{pincodes.filter(p => p.cod_available).length}</p>
                <p className="text-sm text-muted-foreground">COD Available</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by pincode, city, or state..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Pincodes Table */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left p-4 font-medium">Pincode</th>
                    <th className="text-left p-4 font-medium">City</th>
                    <th className="text-left p-4 font-medium">State</th>
                    <th className="text-left p-4 font-medium">Delivery Days</th>
                    <th className="text-left p-4 font-medium">COD</th>
                    <th className="text-left p-4 font-medium">Status</th>
                    <th className="text-left p-4 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPincodes.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-12 text-muted-foreground">
                        No pincodes found
                      </td>
                    </tr>
                  ) : (
                    filteredPincodes.map((pincode) => (
                      <tr key={pincode.id} className="border-b hover:bg-muted/30">
                        <td className="p-4 font-mono font-medium">{pincode.pincode}</td>
                        <td className="p-4">{pincode.city || '-'}</td>
                        <td className="p-4">{pincode.state || '-'}</td>
                        <td className="p-4">{pincode.delivery_days} days</td>
                        <td className="p-4">
                          {pincode.cod_available ? (
                            <Badge variant="secondary" className="bg-green-500/10 text-green-600">
                              Available
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="bg-red-500/10 text-red-600">
                              Not Available
                            </Badge>
                          )}
                        </td>
                        <td className="p-4">
                          <Badge
                            variant={pincode.is_active ? 'default' : 'secondary'}
                            className={pincode.is_active ? 'bg-green-500' : ''}
                          >
                            {pincode.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => toggleActive(pincode)}
                              title={pincode.is_active ? 'Deactivate' : 'Activate'}
                            >
                              {pincode.is_active ? (
                                <X className="h-4 w-4 text-muted-foreground" />
                              ) : (
                                <Check className="h-4 w-4 text-green-500" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openEditDialog(pincode)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Pincode</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete pincode {pincode.pincode}? This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDelete(pincode.id)}
                                    className="bg-destructive text-destructive-foreground"
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
}