import { useState, useEffect } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Users, UserPlus, Shield, Trash2, Loader2, Mail, KeyRound, Search, UserCheck, AlertTriangle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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

const grantAccessSchema = z.object({
  email: z.string().email('Invalid email address'),
});

type AddAdminFormData = z.infer<typeof addAdminSchema>;
type GrantAccessFormData = z.infer<typeof grantAccessSchema>;

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
  const [grantingAccess, setGrantingAccess] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const form = useForm<AddAdminFormData>({
    resolver: zodResolver(addAdminSchema),
    defaultValues: { email: '', password: '', fullName: '' },
  });

  const grantForm = useForm<GrantAccessFormData>({
    resolver: zodResolver(grantAccessSchema),
    defaultValues: { email: '' },
  });

  useEffect(() => {
    fetchAdminUsers();
  }, []);

  const fetchAdminUsers = async () => {
    try {
      const { data: roles, error } = await supabase
        .from('user_roles')
        .select('id, user_id, role')
        .eq('role', 'admin');

      if (error) throw error;

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

  // Create new admin account with email and password
  const handleAddAdmin = async (data: AddAdminFormData) => {
    setAddingAdmin(true);
    try {
      // First, sign up the new admin user
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          emailRedirectTo: `${window.location.origin}/adminowner`,
          data: { full_name: data.fullName }
        }
      });

      if (signUpError) {
        if (signUpError.message.includes('already registered')) {
          toast.error('This email is already registered. Use "Grant Access" tab instead.');
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

        toast.success('New admin account created successfully!');
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

  // Grant admin access to existing user
  const handleGrantAccess = async (data: GrantAccessFormData) => {
    setGrantingAccess(true);
    try {
      // Find existing user by email
      const { data: existingUser, error: profileError } = await supabase
        .from('profiles')
        .select('id, email, full_name')
        .eq('email', data.email)
        .maybeSingle();

      if (profileError) throw profileError;

      if (!existingUser) {
        toast.error('User not found. Please ask them to sign up first, or create a new admin account.');
        setGrantingAccess(false);
        return;
      }

      // Check if already an admin
      const { data: existingRole } = await supabase
        .from('user_roles')
        .select('id')
        .eq('user_id', existingUser.id)
        .eq('role', 'admin')
        .maybeSingle();

      if (existingRole) {
        toast.error('This user is already an admin');
        setGrantingAccess(false);
        return;
      }

      // Add admin role
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({ user_id: existingUser.id, role: 'admin' });

      if (roleError) throw roleError;

      toast.success(`Admin access granted to ${existingUser.full_name || data.email}!`);
      fetchAdminUsers();
      grantForm.reset();
    } catch (error: any) {
      console.error('Error granting access:', error);
      toast.error(error.message || 'Failed to grant access');
    } finally {
      setGrantingAccess(false);
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

  const filteredAdmins = adminUsers.filter(admin => 
    admin.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    admin.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
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
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Add New Admin</DialogTitle>
                <DialogDescription>
                  Create a new admin account or grant access to an existing user.
                </DialogDescription>
              </DialogHeader>
              
              <Tabs defaultValue="create" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="create">Create New</TabsTrigger>
                  <TabsTrigger value="grant">Grant Access</TabsTrigger>
                </TabsList>
                
                <TabsContent value="create" className="space-y-4 mt-4">
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
                      Create Admin Account
                    </Button>
                  </form>
                </TabsContent>
                
                <TabsContent value="grant" className="space-y-4 mt-4">
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      <p>This option is for users who have already signed up. Enter their email to grant admin access.</p>
                    </div>
                  </div>
                  
                  <form onSubmit={grantForm.handleSubmit(handleGrantAccess)} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="grant-email">User's Email</Label>
                      <Input
                        id="grant-email"
                        type="email"
                        placeholder="user@example.com"
                        {...grantForm.register('email')}
                      />
                      {grantForm.formState.errors.email && (
                        <p className="text-sm text-destructive">{grantForm.formState.errors.email.message}</p>
                      )}
                    </div>

                    <Button type="submit" className="w-full" disabled={grantingAccess}>
                      {grantingAccess ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <UserCheck className="h-4 w-4 mr-2" />
                      )}
                      Grant Admin Access
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
            </DialogContent>
          </Dialog>
        </div>

        {/* Search */}
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search admins..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Admin List */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        ) : filteredAdmins.length === 0 ? (
          <Card className="p-8 text-center">
            <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              {searchTerm ? 'No admins found matching your search' : 'No admin users found'}
            </p>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredAdmins.map((admin) => (
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
                            This will remove admin privileges from {admin.email || admin.full_name}. They will no longer be able to access the admin panel.
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
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• <strong>Create New:</strong> नया admin account बनाने के लिए email और password डालें</li>
                <li>• <strong>Grant Access:</strong> पहले से registered user को admin बनाने के लिए उनका email डालें</li>
                <li>• Admins can manage products, orders, payments, and other settings</li>
                <li>• Be careful when granting admin access</li>
              </ul>
            </div>
          </div>
        </Card>
      </div>
    </AdminLayout>
  );
}