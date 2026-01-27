import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, ArrowRight, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Layout } from '@/components/layout/Layout';
import { useCart, BuyNowItem } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const addressSchema = z.object({
  fullName: z.string().min(2, 'Name is required'),
  email: z.string().email('Valid email is required'),
  phone: z.string().min(10, 'Valid phone number is required'),
  address: z.string().min(5, 'Address is required'),
  city: z.string().min(2, 'City is required'),
  state: z.string().min(2, 'State is required'),
  pincode: z.string().min(6, 'Valid pincode is required'),
});

type AddressFormData = z.infer<typeof addressSchema>;

export default function CheckoutAddress() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { items, totalAmount } = useCart();
  const [buyNowItem, setBuyNowItem] = useState<BuyNowItem | null>(null);
  const [pincodeLoading, setPincodeLoading] = useState(false);

  const isBuyNowMode = searchParams.get('mode') === 'buynow';

  const form = useForm<AddressFormData>({
    resolver: zodResolver(addressSchema),
    defaultValues: {
      fullName: '',
      email: '',
      phone: '',
      address: '',
      city: '',
      state: '',
      pincode: '',
    },
  });

  // Background pincode lookup for auto-filling city and state
  const lookupPincode = async (pincode: string) => {
    if (pincode.length !== 6) return;
    
    setPincodeLoading(true);
    
    try {
      const { data: localData } = await supabase
        .from('serviceable_pincodes')
        .select('city, state')
        .eq('pincode', pincode)
        .eq('is_active', true)
        .maybeSingle();
      
      if (localData?.city && localData?.state) {
        form.setValue('city', localData.city);
        form.setValue('state', localData.state);
        setPincodeLoading(false);
        return;
      }
      
      const response = await fetch(`https://api.postalpincode.in/pincode/${pincode}`);
      const apiData = await response.json();
      
      if (apiData?.[0]?.Status === 'Success' && apiData[0].PostOffice?.length > 0) {
        const postOffice = apiData[0].PostOffice[0];
        form.setValue('city', postOffice.District || postOffice.Name);
        form.setValue('state', postOffice.State);
      }
    } catch (error) {
      console.log('Pincode lookup failed:', error);
    } finally {
      setPincodeLoading(false);
    }
  };

  const watchedPincode = form.watch('pincode');
  
  useEffect(() => {
    if (watchedPincode?.length === 6 && /^\d{6}$/.test(watchedPincode)) {
      lookupPincode(watchedPincode);
    }
  }, [watchedPincode]);

  useEffect(() => {
    if (isBuyNowMode) {
      const storedItem = sessionStorage.getItem('buyNowItem');
      if (storedItem) {
        setBuyNowItem(JSON.parse(storedItem));
      } else {
        navigate('/products');
        return;
      }
    } else if (!user && items.length === 0) {
      const guestCart = sessionStorage.getItem('guestCart');
      if (!guestCart) {
        navigate('/products');
        return;
      }
    } else if (user && items.length === 0 && !isBuyNowMode) {
      navigate('/cart');
      return;
    }

    if (user) {
      fetchProfile();
    }

    // Load saved address from session if available
    const savedAddress = sessionStorage.getItem('checkoutAddress');
    if (savedAddress) {
      const parsed = JSON.parse(savedAddress);
      Object.keys(parsed).forEach(key => {
        form.setValue(key as keyof AddressFormData, parsed[key]);
      });
    }
  }, [user, items.length, navigate, isBuyNowMode]);

  const fetchProfile = async () => {
    if (!user) return;
    
    const { data } = await supabase
      .from('profiles')
      .select('full_name, phone, address, email')
      .eq('id', user.id)
      .maybeSingle();

    if (data) {
      if (data.full_name) form.setValue('fullName', data.full_name);
      if (data.email) form.setValue('email', data.email);
      if (data.phone) form.setValue('phone', data.phone);
    }
  };

  const checkoutItems = isBuyNowMode && buyNowItem ? [buyNowItem] : items;
  const checkoutTotal = isBuyNowMode && buyNowItem
    ? (buyNowItem.product.sale_price || buyNowItem.product.price) * buyNowItem.quantity
    : totalAmount;
  const shipping = checkoutTotal >= 999 ? 0 : 99;

  const handleSubmit = async (data: AddressFormData) => {
    // Save address to session storage for payment page
    sessionStorage.setItem('checkoutAddress', JSON.stringify(data));
    
    // Navigate to payment page
    const params = new URLSearchParams();
    if (isBuyNowMode) {
      params.set('mode', 'buynow');
    }
    navigate(`/checkout/payment${params.toString() ? `?${params.toString()}` : ''}`);
  };

  const hasItems = isBuyNowMode ? !!buyNowItem : (user ? items.length > 0 : true);
  if (!hasItems) {
    return null;
  }

  return (
    <Layout>
      <div className="container px-4 py-4 md:py-8 pb-40 md:pb-8">
        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-2 md:gap-4 mb-4 md:mb-8">
          <div className="flex items-center gap-1 md:gap-2">
            <div className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs md:text-sm font-semibold">
              1
            </div>
            <span className="text-sm md:text-base font-medium">Address</span>
          </div>
          <div className="w-8 md:w-12 h-0.5 bg-muted" />
          <div className="flex items-center gap-1 md:gap-2">
            <div className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-muted text-muted-foreground flex items-center justify-center text-xs md:text-sm font-semibold">
              2
            </div>
            <span className="text-sm md:text-base text-muted-foreground">Payment</span>
          </div>
        </div>

        <h1 className="font-display text-xl md:text-3xl font-bold mb-4 md:mb-8 flex items-center gap-2 md:gap-3">
          <MapPin className="h-5 w-5 md:h-8 md:w-8" />
          Shipping Address
        </h1>

        <form onSubmit={form.handleSubmit(handleSubmit)}>
          <div className="grid lg:grid-cols-3 gap-4 md:gap-8">
            <div className="lg:col-span-2">
              <Card className="p-4 md:p-6">
                <div className="grid gap-3 md:gap-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                    <div className="space-y-1 md:space-y-2">
                      <Label htmlFor="fullName" className="text-sm">Full Name</Label>
                      <Input id="fullName" {...form.register('fullName')} className="h-10" />
                      {form.formState.errors.fullName && (
                        <p className="text-xs md:text-sm text-destructive">{form.formState.errors.fullName.message}</p>
                      )}
                    </div>
                    <div className="space-y-1 md:space-y-2">
                      <Label htmlFor="email" className="text-sm">Email Address</Label>
                      <Input id="email" type="email" {...form.register('email')} className="h-10" />
                      {form.formState.errors.email && (
                        <p className="text-xs md:text-sm text-destructive">{form.formState.errors.email.message}</p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1 md:space-y-2">
                    <Label htmlFor="phone" className="text-sm">Phone Number</Label>
                    <Input id="phone" {...form.register('phone')} className="h-10" />
                    {form.formState.errors.phone && (
                      <p className="text-xs md:text-sm text-destructive">{form.formState.errors.phone.message}</p>
                    )}
                  </div>

                  <div className="space-y-1 md:space-y-2">
                    <Label htmlFor="address" className="text-sm">Address</Label>
                    <Input id="address" {...form.register('address')} className="h-10" />
                    {form.formState.errors.address && (
                      <p className="text-xs md:text-sm text-destructive">{form.formState.errors.address.message}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-2 md:gap-4">
                    <div className="space-y-1 md:space-y-2">
                      <Label htmlFor="pincode" className="text-xs md:text-sm">Pincode</Label>
                      <div className="relative">
                        <Input 
                          id="pincode" 
                          {...form.register('pincode')} 
                          placeholder="Pincode"
                          maxLength={6}
                          className="h-10 text-sm"
                        />
                        {pincodeLoading && (
                          <Loader2 className="absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 md:h-4 md:w-4 animate-spin text-muted-foreground" />
                        )}
                      </div>
                      {form.formState.errors.pincode && (
                        <p className="text-xs text-destructive">{form.formState.errors.pincode.message}</p>
                      )}
                    </div>
                    <div className="space-y-1 md:space-y-2">
                      <Label htmlFor="city" className="text-xs md:text-sm">City</Label>
                      <Input 
                        id="city" 
                        {...form.register('city')} 
                        placeholder={pincodeLoading ? "..." : "City"}
                        className="h-10 text-sm"
                      />
                      {form.formState.errors.city && (
                        <p className="text-xs text-destructive">{form.formState.errors.city.message}</p>
                      )}
                    </div>
                    <div className="space-y-1 md:space-y-2">
                      <Label htmlFor="state" className="text-xs md:text-sm">State</Label>
                      <Input 
                        id="state" 
                        {...form.register('state')} 
                        placeholder={pincodeLoading ? "..." : "State"}
                        className="h-10 text-sm"
                      />
                      {form.formState.errors.state && (
                        <p className="text-xs text-destructive">{form.formState.errors.state.message}</p>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            </div>

            {/* Order Summary - Fixed at bottom on mobile */}
            <div className="fixed bottom-14 left-0 right-0 z-40 bg-background border-t shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] md:relative md:bottom-auto md:border-t-0 md:shadow-none lg:block">
              <Card className="border-0 md:border rounded-none md:rounded-lg p-0 md:p-6 md:sticky md:top-24">
                {/* Collapsible summary on mobile */}
                <div className="md:hidden px-4 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-muted-foreground">{checkoutItems.length} item(s)</p>
                      <p className="font-bold text-lg">₹{(checkoutTotal + shipping).toLocaleString()}</p>
                    </div>
                    <Button type="submit" className="shrink-0">
                      Continue
                      <ArrowRight className="ml-1 h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Full summary on desktop */}
                <div className="hidden md:block">
                  <h2 className="font-semibold text-lg mb-4">Order Summary</h2>
                  
                  <div className="space-y-3 max-h-48 overflow-y-auto">
                    {checkoutItems.map((item, index) => (
                      <div key={isBuyNowMode ? `buynow-${index}` : (item as any).id} className="flex gap-3">
                        <div className="w-12 h-12 rounded bg-secondary overflow-hidden flex-shrink-0">
                          <img
                            src={item.product?.images?.[0] || 'https://via.placeholder.com/48'}
                            alt={item.product?.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{item.product?.name}</p>
                          <p className="text-xs text-muted-foreground">
                            Qty: {item.quantity}
                            {item.size && ` • Size: ${item.size}`}
                            {item.color && ` • ${item.color}`}
                          </p>
                        </div>
                        <p className="text-sm font-medium">
                          ₹{((item.product?.sale_price || item.product?.price || 0) * item.quantity).toLocaleString()}
                        </p>
                      </div>
                    ))}
                  </div>

                  <Separator className="my-4" />

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span>₹{checkoutTotal.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Shipping</span>
                      <span>{shipping === 0 ? 'Free' : `₹${shipping}`}</span>
                    </div>
                  </div>

                  <Separator className="my-4" />

                  <div className="flex justify-between font-semibold text-lg mb-6">
                    <span>Total</span>
                    <span>₹{(checkoutTotal + shipping).toLocaleString()}</span>
                  </div>

                  <Button type="submit" className="w-full" size="lg">
                    Continue to Payment
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </Card>
            </div>
          </div>
        </form>
      </div>
    </Layout>
  );
}
