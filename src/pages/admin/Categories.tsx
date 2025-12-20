import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
}

export default function AdminCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({ name: '', slug: '', description: '', image_url: '' });

  useEffect(() => { fetchCategories(); }, []);

  const fetchCategories = async () => {
    const { data } = await supabase.from('categories').select('*').order('name');
    setCategories(data || []);
    setLoading(false);
  };

  const generateSlug = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

  const handleSave = async () => {
    if (!formData.name) { toast.error('Name is required'); return; }
    setSaving(true);
    try {
      const data = { name: formData.name, slug: formData.slug || generateSlug(formData.name), description: formData.description || null, image_url: formData.image_url || null };
      if (editingCategory) {
        await supabase.from('categories').update(data).eq('id', editingCategory.id);
        toast.success('Category updated');
      } else {
        await supabase.from('categories').insert(data);
        toast.success('Category created');
      }
      setIsDialogOpen(false);
      setFormData({ name: '', slug: '', description: '', image_url: '' });
      setEditingCategory(null);
      fetchCategories();
    } catch (error: any) { toast.error(error.message); } finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    await supabase.from('categories').delete().eq('id', id);
    toast.success('Deleted');
    fetchCategories();
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="font-display text-3xl font-bold">Categories</h1>
          <Dialog open={isDialogOpen} onOpenChange={(o) => { setIsDialogOpen(o); if (!o) { setEditingCategory(null); setFormData({ name: '', slug: '', description: '', image_url: '' }); } }}>
            <DialogTrigger asChild><Button className="bg-accent"><Plus className="h-4 w-4 mr-2" />Add Category</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>{editingCategory ? 'Edit' : 'Add'} Category</DialogTitle></DialogHeader>
              <div className="space-y-4 py-4">
                <div><Label>Name</Label><Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value, slug: generateSlug(e.target.value) })} /></div>
                <div><Label>Slug</Label><Input value={formData.slug} onChange={(e) => setFormData({ ...formData, slug: e.target.value })} /></div>
                <div><Label>Description</Label><Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} /></div>
                <div><Label>Image URL</Label><Input value={formData.image_url} onChange={(e) => setFormData({ ...formData, image_url: e.target.value })} /></div>
                <Button onClick={handleSave} disabled={saving} className="w-full bg-accent">{saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Save</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        {loading ? <div className="h-32 bg-muted animate-pulse rounded-lg" /> : categories.length === 0 ? <Card className="p-8 text-center text-muted-foreground">No categories</Card> : (
          <div className="grid gap-4">
            {categories.map((cat) => (
              <Card key={cat.id} className="p-4 flex items-center gap-4">
                <div className="w-16 h-16 rounded-lg bg-secondary overflow-hidden"><img src={cat.image_url || 'https://via.placeholder.com/64'} alt="" className="w-full h-full object-cover" /></div>
                <div className="flex-1"><h3 className="font-medium">{cat.name}</h3><p className="text-sm text-muted-foreground">{cat.slug}</p></div>
                <Button variant="outline" size="icon" onClick={() => { setEditingCategory(cat); setFormData({ name: cat.name, slug: cat.slug, description: cat.description || '', image_url: cat.image_url || '' }); setIsDialogOpen(true); }}><Pencil className="h-4 w-4" /></Button>
                <AlertDialog><AlertDialogTrigger asChild><Button variant="outline" size="icon" className="text-destructive"><Trash2 className="h-4 w-4" /></Button></AlertDialogTrigger><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Delete?</AlertDialogTitle><AlertDialogDescription>This cannot be undone.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => handleDelete(cat.id)} className="bg-destructive">Delete</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
