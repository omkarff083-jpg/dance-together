import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff, Loader2, Shield, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function AdminOwner() {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { user, isAdmin, signIn, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // If already logged in as admin, redirect to admin dashboard
    if (!authLoading && user && isAdmin) {
      navigate('/admin');
    }
  }, [user, isAdmin, authLoading, navigate]);

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const handleLogin = async (data: LoginFormData) => {
    setLoading(true);
    try {
      const { error } = await signIn(data.email, data.password);
      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          toast.error('Invalid email or password');
        } else {
          toast.error(error.message);
        }
      } else {
        // Check will happen via useEffect after auth state changes
        toast.success('Checking admin access...');
      }
    } catch (error) {
      toast.error('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Show access denied if logged in but not admin
  if (!authLoading && user && !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-gradient-to-br from-gray-900 to-gray-800">
        <Card className="w-full max-w-md border-red-500/20">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <Lock className="h-8 w-8 text-red-600" />
            </div>
            <CardTitle className="text-2xl text-red-600">Access Denied</CardTitle>
            <CardDescription>
              You don't have admin privileges. Please contact the administrator.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => navigate('/')}
            >
              Go to Homepage
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-gradient-to-br from-gray-900 to-gray-800">
      <Card className="w-full max-w-md border-primary/20 shadow-2xl">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <Shield className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="font-display text-2xl">Admin Access</CardTitle>
          <CardDescription>Enter your admin credentials to continue</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(handleLogin)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@example.com"
                {...form.register('email')}
                className="bg-secondary/50"
              />
              {form.formState.errors.email && (
                <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  {...form.register('password')}
                  className="bg-secondary/50"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              {form.formState.errors.password && (
                <p className="text-sm text-destructive">{form.formState.errors.password.message}</p>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Shield className="h-4 w-4 mr-2" />}
              Access Admin Panel
            </Button>
          </form>

          <p className="text-xs text-muted-foreground text-center mt-6">
            This area is restricted to authorized administrators only.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
