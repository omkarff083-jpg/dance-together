import { useState, useEffect } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Users, UserPlus, Shield, Trash2, Loader2, Mail, KeyRound, CheckCircle2, XCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

const addAdminSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  fullName: z.string().min(2, 'Name must be at least 2 characters'),
});

type AddAdminFormData = z.infer<typeof addAdminSchema>;

interface AdminUser {
  id: string;
  user_id: string;
  role: string;
  email: string | null;
  full_name: string | null;
}

export default function AdminUsers() {
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingAdmin, setAddingAdmin] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);

  const form = useForm<AddAdminFormData>({
    resolver: zodResolver(addAdminSchema),
    defaultValues: { email: '', password: '', fullName: '' },
  });

  useEffect(() => {
    fetchAdminUsers();
  }, []);

  const fetchAdminUsers = async () => {
    try {
      // Get all admin roles with profile info
      const { data: roles, error } = await supabase
        .from('user_roles')
        .select('id, user_id, role')
        .eq('role', 'admin');

      if (error) throw error;

      // Get profile info for each admin
      const adminsWithProfiles = await Promise.all(
        (roles || []).map(async (role) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('email, full_name')
            .eq('id', role.user_id)
            .maybeSingle();

          return {
            ...role,
            email: profile?.email || null,
            full_name: profile?.full_name || null,
          };
        })
      );

      setAdminUsers(adminsWithProfiles);
    } catch (error) {
      console.error('Error fetching admins:', error);
      toast.error('Failed to load admin users');
    } finally {
      setLoading(false);
    }
  };

  const handleAddAdmin = async (data: AddAdminFormData) => {
    setAddingAdmin(true);
    try {
      // First, sign up the new admin user
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: { full_name: data.fullName }
        }
      });

      if (signUpError) {
        // Check if user already exists
        if (signUpError.message.includes('already registered')) {
          // User exists, try to add admin role
          const { data: existingUser } = await supabase
            .from('profiles')
            .select('id')
            .eq('email', data.email)
            .maybeSingle();

          if (existingUser) {
            // Add admin role to existing user
            const { error: roleError } = await supabase
              .from('user_roles')
              .insert({ user_id: existingUser.id, role: 'admin' });

            if (roleError) {
              if (roleError.message.includes('duplicate')) {
                toast.error('This user is already an admin');
              } else {
                throw roleError;
              }
            } else {
              toast.success('Admin role added to existing user!');
              fetchAdminUsers();
              setShowAddDialog(false);
              form.reset();
            }
          } else {
            toast.error('User exists but profile not found. Please have them log in first.');
          }
        } else {
          throw signUpError;
        }
        return;
      }

      if (authData.user) {
        // Add admin role
        const { error: roleError } = await supabase
          .from('user_roles')
          .insert({ user_id: authData.user.id, role: 'admin' });

        if (roleError) throw roleError;

        toast.success('New admin created successfully!');
        fetchAdminUsers();
        setShowAddDialog(false);
        form.reset();
      }
    } catch (error: any) {
      console.error('Error adding admin:', error);
      toast.error(error.message || 'Failed to add admin');
    } finally {
      setAddingAdmin(false);
    }
  };

  const handleRemoveAdmin = async (roleId: string, userId: string) => {
    try {
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('id', roleId);

      if (error) throw error;

      toast.success('Admin access removed');
      fetchAdminUsers();
    } catch (error) {
      console.error('Error removing admin:', error);
      toast.error('Failed to remove admin');
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-3xl font-bold flex items-center gap-2">
              <Users className="h-8 w-8" />
              Admin Users
            </h1>
            <p className="text-muted-foreground mt-1">
              Manage who has admin access to the dashboard
            </p>
          </div>

          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="h-4 w-4 mr-2" />
                Add Admin
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Admin</DialogTitle>
                <DialogDescription>
                  Create a new admin account or grant admin access to an existing user.
                </DialogDescription>
              </DialogHeader>
              
              <form onSubmit={form.handleSubmit(handleAddAdmin)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    placeholder="Admin Name"
                    {...form.register('fullName')}
                  />
                  {form.formState.errors.fullName && (
                    <p className="text-sm text-destructive">{form.formState.errors.fullName.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="admin@example.com"
                    {...form.register('email')}
                  />
                  {form.formState.errors.email && (
                    <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    {...form.register('password')}
                  />
                  {form.formState.errors.password && (
                    <p className="text-sm text-destructive">{form.formState.errors.password.message}</p>
                  )}
                </div>

                <Button type="submit" className="w-full" disabled={addingAdmin}>
                  {addingAdmin ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <UserPlus className="h-4 w-4 mr-2" />
                  )}
                  Add Admin
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Admin List */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        ) : adminUsers.length === 0 ? (
          <Card className="p-8 text-center">
            <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No admin users found</p>
          </Card>
        ) : (
          <div className="space-y-4">
            {adminUsers.map((admin) => (
              <Card key={admin.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <Shield className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{admin.full_name || 'Unknown'}</p>
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        {admin.email || 'No email'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Badge className="bg-primary/10 text-primary">
                      <Shield className="h-3 w-3 mr-1" />
                      Admin
                    </Badge>
                    
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="icon" className="text-destructive hover:text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Remove Admin Access?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will remove admin privileges from {admin.email}. They will no longer be able to access the admin panel.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleRemoveAdmin(admin.id, admin.user_id)}
                            className="bg-destructive hover:bg-destructive/90"
                          >
                            Remove Access
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Info Card */}
        <Card className="p-6 bg-secondary/30 border-dashed">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
              <KeyRound className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-medium mb-1">About Admin Access</h3>
              <p className="text-sm text-muted-foreground">
                Admins can manage products, categories, orders, payment settings, and other admin users. 
                Be careful when granting admin access as they will have full control over the store.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </AdminLayout>
  );
}
