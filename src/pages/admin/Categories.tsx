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
import { ImageUpload } from '@/components/admin/ImageUpload';
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

  const resetForm = () => {
    setFormData({ name: '', slug: '', description: '', image_url: '' });
    setEditingCategory(null);
  };

  const handleSave = async () => {
    if (!formData.name) { toast.error('Name is required'); return; }
    setSaving(true);
    try {
      const data = { 
        name: formData.name, 
        slug: formData.slug || generateSlug(formData.name), 
        description: formData.description || null, 
        image_url: formData.image_url || null 
      };
      if (editingCategory) {
        await supabase.from('categories').update(data).eq('id', editingCategory.id);
        toast.success('Category updated');
      } else {
        await supabase.from('categories').insert(data);
        toast.success('Category created');
      }
      setIsDialogOpen(false);
      resetForm();
      fetchCategories();
    } catch (error: any) { 
      toast.error(error.message); 
    } finally { 
      setSaving(false); 
    }
  };

  const handleDelete = async (id: string) => {
    await supabase.from('categories').delete().eq('id', id);
    toast.success('Deleted');
    fetchCategories();
  };

  const handleImageChange = (images: string[]) => {
    setFormData({ ...formData, image_url: images[0] || '' });
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-3xl font-bold">Categories</h1>
            <p className="text-muted-foreground">Manage product categories</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={(o) => { setIsDialogOpen(o); if (!o) resetForm(); }}>
            <DialogTrigger asChild>
              <Button className="bg-accent hover:bg-accent/90">
                <Plus className="h-4 w-4 mr-2" />
                Add Category
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>{editingCategory ? 'Edit' : 'Add'} Category</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Name *</Label>
                  <Input 
                    value={formData.name} 
                    onChange={(e) => setFormData({ ...formData, name: e.target.value, slug: generateSlug(e.target.value) })} 
                  />
                </div>
                <div className="space-y-2">
                  <Label>Slug</Label>
                  <Input 
                    value={formData.slug} 
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })} 
                  />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea 
                    value={formData.description} 
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })} 
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Category Image</Label>
                  <ImageUpload
                    images={formData.image_url ? [formData.image_url] : []}
                    onImagesChange={handleImageChange}
                    maxImages={1}
                  />
                </div>
                <Button onClick={handleSave} disabled={saving} className="w-full bg-accent hover:bg-accent/90">
                  {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  {editingCategory ? 'Update Category' : 'Create Category'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        ) : categories.length === 0 ? (
          <Card className="p-8 text-center text-muted-foreground">No categories found</Card>
        ) : (
          <div className="grid gap-4">
            {categories.map((cat) => (
              <Card key={cat.id} className="p-4 flex items-center gap-4">
                <div className="w-16 h-16 rounded-lg bg-secondary overflow-hidden flex-shrink-0">
                  <img 
                    src={cat.image_url || 'https://via.placeholder.com/64'} 
                    alt={cat.name} 
                    className="w-full h-full object-cover" 
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium truncate">{cat.name}</h3>
                  <p className="text-sm text-muted-foreground">{cat.slug}</p>
                  {cat.description && (
                    <p className="text-sm text-muted-foreground truncate">{cat.description}</p>
                  )}
                </div>
                <Button 
                  variant="outline" 
                  size="icon" 
                  onClick={() => { 
                    setEditingCategory(cat); 
                    setFormData({ 
                      name: cat.name, 
                      slug: cat.slug, 
                      description: cat.description || '', 
                      image_url: cat.image_url || '' 
                    }); 
                    setIsDialogOpen(true); 
                  }}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" size="icon" className="text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Category?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently delete "{cat.name}". This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleDelete(cat.id)} className="bg-destructive">
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}