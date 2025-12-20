import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, CreditCard, QrCode, Banknote, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { Layout } from '@/components/layout/Layout';
import { useCart, BuyNowItem } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const addressSchema = z.object({
  fullName: z.string().min(2, 'Name is required'),
  phone: z.string().min(10, 'Valid phone number is required'),
  address: z.string().min(5, 'Address is required'),
  city: z.string().min(2, 'City is required'),
  state: z.string().min(2, 'State is required'),
  pincode: z.string().min(6, 'Valid pincode is required'),
});

type AddressFormData = z.infer<typeof addressSchema>;

interface PaymentSettings {
  razorpay_enabled: boolean;
  upi_enabled: boolean;
  upi_id: string | null;
}

declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function Checkout() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { items, totalAmount, clearCart } = useCart();
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);
  const [paymentSettings, setPaymentSettings] = useState<PaymentSettings | null>(null);
  const [showUpiDialog, setShowUpiDialog] = useState(false);
  const [upiCopied, setUpiCopied] = useState(false);
  const [pendingOrderId, setPendingOrderId] = useState<string | null>(null);
  const [buyNowItem, setBuyNowItem] = useState<BuyNowItem | null>(null);

  const isBuyNowMode = searchParams.get('mode') === 'buynow';

  const form = useForm<AddressFormData>({
    resolver: zodResolver(addressSchema),
    defaultValues: {
      fullName: '',
      phone: '',
      address: '',
      city: '',
      state: '',
      pincode: '',
    },
  });

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }

    // Check for Buy Now mode
    if (isBuyNowMode) {
      const storedItem = sessionStorage.getItem('buyNowItem');
      if (storedItem) {
        setBuyNowItem(JSON.parse(storedItem));
      } else {
        navigate('/products');
        return;
      }
    } else if (items.length === 0) {
      navigate('/cart');
      return;
    }

    // Load Razorpay script
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => setRazorpayLoaded(true);
    document.body.appendChild(script);

    // Fetch user profile and payment settings
    fetchProfile();
    fetchPaymentSettings();

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, [user, items.length, navigate, isBuyNowMode]);

  const fetchPaymentSettings = async () => {
    const { data } = await supabase
      .from('payment_settings')
      .select('razorpay_enabled, upi_enabled, upi_id')
      .limit(1)
      .maybeSingle();
    
    if (data) {
      setPaymentSettings(data);
      // Set default payment method based on what's enabled
      if (data.razorpay_enabled) {
        setPaymentMethod('razorpay');
      } else if (data.upi_enabled && data.upi_id) {
        setPaymentMethod('upi');
      } else {
        setPaymentMethod('cod');
      }
    } else {
      setPaymentMethod('cod');
    }
  };

  const fetchProfile = async () => {
    if (!user) return;
    
    const { data } = await supabase
      .from('profiles')
      .select('full_name, phone, address')
      .eq('id', user.id)
      .maybeSingle();

    if (data) {
      if (data.full_name) form.setValue('fullName', data.full_name);
      if (data.phone) form.setValue('phone', data.phone);
    }
  };

  // Calculate totals based on mode
  const checkoutItems = isBuyNowMode && buyNowItem ? [buyNowItem] : items;
  const checkoutTotal = isBuyNowMode && buyNowItem
    ? (buyNowItem.product.sale_price || buyNowItem.product.price) * buyNowItem.quantity
    : totalAmount;
  const shipping = checkoutTotal >= 999 ? 0 : 99;
  const finalTotal = checkoutTotal + shipping;

  const createOrder = async (paymentId?: string, status: string = 'pending') => {
    const addressData = form.getValues();
    
    // Create order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        user_id: user!.id,
        total_amount: finalTotal,
        status: status,
        payment_method: paymentMethod,
        payment_id: paymentId || null,
        shipping_address: {
          fullName: addressData.fullName,
          phone: addressData.phone,
          address: addressData.address,
          city: addressData.city,
          state: addressData.state,
          pincode: addressData.pincode,
        },
      })
      .select()
      .single();

    if (orderError) throw orderError;

    // Create order items
    const orderItems = checkoutItems.map(item => ({
      order_id: order.id,
      product_id: item.product_id,
      product_name: item.product?.name || 'Unknown',
      product_image: item.product?.images?.[0] || null,
      quantity: item.quantity,
      price: item.product?.sale_price || item.product?.price || 0,
      size: item.size,
      color: item.color,
    }));

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems);

    if (itemsError) throw itemsError;

    return order;
  };

  const clearCheckoutItems = async () => {
    if (isBuyNowMode) {
      sessionStorage.removeItem('buyNowItem');
      setBuyNowItem(null);
    } else {
      await clearCart();
    }
  };

  const handleRazorpayPayment = async () => {
    if (!razorpayLoaded) {
      toast.error('Payment system is loading, please wait');
      return;
    }

    setLoading(true);

    try {
      // Create Razorpay order via edge function
      const { data, error } = await supabase.functions.invoke('create-razorpay-order', {
        body: { amount: finalTotal * 100 }, // Amount in paise
      });

      if (error) throw error;

      const options = {
        key: data.key_id,
        amount: data.order.amount,
        currency: 'INR',
        name: 'LUXE',
        description: 'Fashion Store Purchase',
        order_id: data.order.id,
        handler: async (response: any) => {
          try {
            // Verify payment
            const { error: verifyError } = await supabase.functions.invoke('verify-razorpay-payment', {
              body: {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              },
            });

            if (verifyError) throw verifyError;

            // Create order in database
            await createOrder(response.razorpay_payment_id, 'confirmed');
            await clearCheckoutItems();
            
            toast.success('Payment successful!');
            navigate('/orders');
          } catch (error) {
            console.error('Payment verification error:', error);
            toast.error('Payment verification failed');
          }
        },
        prefill: {
          name: form.getValues('fullName'),
          contact: form.getValues('phone'),
          email: user?.email,
        },
        theme: {
          color: '#f97316',
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (error) {
      console.error('Razorpay error:', error);
      toast.error('Failed to initiate payment. Please check if Razorpay is configured in admin settings.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpiPayment = async () => {
    setLoading(true);
    try {
      const order = await createOrder(undefined, 'awaiting_payment');
      setPendingOrderId(order.id);
      setShowUpiDialog(true);
    } catch (error) {
      console.error('Order error:', error);
      toast.error('Failed to create order');
    } finally {
      setLoading(false);
    }
  };

  const copyUpiId = () => {
    if (paymentSettings?.upi_id) {
      navigator.clipboard.writeText(paymentSettings.upi_id);
      setUpiCopied(true);
      toast.success('UPI ID copied!');
      setTimeout(() => setUpiCopied(false), 2000);
    }
  };

  const confirmUpiPayment = async () => {
    await clearCheckoutItems();
    setShowUpiDialog(false);
    toast.success('Order placed! We will confirm once payment is verified.');
    navigate('/orders');
  };

  const handleSubmit = async (data: AddressFormData) => {
    if (paymentMethod === 'razorpay') {
      await handleRazorpayPayment();
    } else if (paymentMethod === 'upi') {
      await handleUpiPayment();
    } else {
      // COD order
      setLoading(true);
      try {
        await createOrder(undefined, 'pending');
        await clearCheckoutItems();
        toast.success('Order placed successfully!');
        navigate('/orders');
      } catch (error) {
        console.error('Order error:', error);
        toast.error('Failed to place order');
      } finally {
        setLoading(false);
      }
    }
  };

  const generateUpiQR = () => {
    if (!paymentSettings?.upi_id) return '';
    const upiString = `upi://pay?pa=${paymentSettings.upi_id}&pn=LUXE&am=${finalTotal}&cu=INR`;
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(upiString)}`;
  };

  if (!user || (!isBuyNowMode && items.length === 0) || (isBuyNowMode && !buyNowItem)) {
    return null;
  }

  const isRazorpayAvailable = paymentSettings?.razorpay_enabled;
  const isUpiAvailable = paymentSettings?.upi_enabled && paymentSettings?.upi_id;

  return (
    <Layout>
      <div className="container py-8">
        <h1 className="font-display text-3xl font-bold mb-8">Checkout</h1>

        <form onSubmit={form.handleSubmit(handleSubmit)}>
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Shipping Address */}
            <div className="lg:col-span-2 space-y-6">
              <Card className="p-6">
                <h2 className="font-semibold text-lg mb-4">Shipping Address</h2>
                
                <div className="grid gap-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="fullName">Full Name</Label>
                      <Input id="fullName" {...form.register('fullName')} />
                      {form.formState.errors.fullName && (
                        <p className="text-sm text-destructive">{form.formState.errors.fullName.message}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input id="phone" {...form.register('phone')} />
                      {form.formState.errors.phone && (
                        <p className="text-sm text-destructive">{form.formState.errors.phone.message}</p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="address">Address</Label>
                    <Input id="address" {...form.register('address')} />
                    {form.formState.errors.address && (
                      <p className="text-sm text-destructive">{form.formState.errors.address.message}</p>
                    )}
                  </div>

                  <div className="grid sm:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="city">City</Label>
                      <Input id="city" {...form.register('city')} />
                      {form.formState.errors.city && (
                        <p className="text-sm text-destructive">{form.formState.errors.city.message}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="state">State</Label>
                      <Input id="state" {...form.register('state')} />
                      {form.formState.errors.state && (
                        <p className="text-sm text-destructive">{form.formState.errors.state.message}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="pincode">Pincode</Label>
                      <Input id="pincode" {...form.register('pincode')} />
                      {form.formState.errors.pincode && (
                        <p className="text-sm text-destructive">{form.formState.errors.pincode.message}</p>
                      )}
                    </div>
                  </div>
                </div>
              </Card>

              {/* Payment Method */}
              <Card className="p-6">
                <h2 className="font-semibold text-lg mb-4">Payment Method</h2>
                
                <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
                  {/* Razorpay Option */}
                  {isRazorpayAvailable && (
                    <div className="flex items-center space-x-3 p-4 border rounded-lg cursor-pointer hover:bg-secondary/50">
                      <RadioGroupItem value="razorpay" id="razorpay" />
                      <Label htmlFor="razorpay" className="flex-1 cursor-pointer">
                        <div className="flex items-center gap-3">
                          <CreditCard className="h-5 w-5 text-primary" />
                          <div>
                            <p className="font-medium">Pay Online (Razorpay)</p>
                            <p className="text-sm text-muted-foreground">Cards, UPI, Net Banking, Wallets</p>
                          </div>
                        </div>
                      </Label>
                    </div>
                  )}
                  
                  {/* UPI QR Option */}
                  {isUpiAvailable && (
                    <div className={`flex items-center space-x-3 p-4 border rounded-lg cursor-pointer hover:bg-secondary/50 ${isRazorpayAvailable ? 'mt-3' : ''}`}>
                      <RadioGroupItem value="upi" id="upi" />
                      <Label htmlFor="upi" className="flex-1 cursor-pointer">
                        <div className="flex items-center gap-3">
                          <QrCode className="h-5 w-5 text-primary" />
                          <div>
                            <p className="font-medium">Pay via UPI QR</p>
                            <p className="text-sm text-muted-foreground">Scan QR code with any UPI app</p>
                          </div>
                        </div>
                      </Label>
                    </div>
                  )}
                  
                  {/* COD Option */}
                  <div className={`flex items-center space-x-3 p-4 border rounded-lg cursor-pointer hover:bg-secondary/50 ${(isRazorpayAvailable || isUpiAvailable) ? 'mt-3' : ''}`}>
                    <RadioGroupItem value="cod" id="cod" />
                    <Label htmlFor="cod" className="flex-1 cursor-pointer">
                      <div className="flex items-center gap-3">
                        <Banknote className="h-5 w-5 text-primary" />
                        <div>
                          <p className="font-medium">Cash on Delivery</p>
                          <p className="text-sm text-muted-foreground">Pay when you receive your order</p>
                        </div>
                      </div>
                    </Label>
                  </div>
                </RadioGroup>

                {!isRazorpayAvailable && !isUpiAvailable && (
                  <p className="text-sm text-muted-foreground mt-4">
                    Only Cash on Delivery is available at the moment.
                  </p>
                )}
              </Card>
            </div>

            {/* Order Summary */}
            <div>
              <Card className="p-6 sticky top-24">
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
                  <span>₹{finalTotal.toLocaleString()}</span>
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={loading || !paymentMethod}
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : null}
                  {paymentMethod === 'razorpay' ? 'Pay Now' : paymentMethod === 'upi' ? 'Generate QR' : 'Place Order'}
                </Button>
              </Card>
            </div>
          </div>
        </form>
      </div>

      {/* UPI Payment Dialog */}
      <Dialog open={showUpiDialog} onOpenChange={setShowUpiDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Pay via UPI</DialogTitle>
            <DialogDescription>
              Scan the QR code or use the UPI ID to pay ₹{finalTotal.toLocaleString()}
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex flex-col items-center space-y-4 py-4">
            {/* QR Code */}
            <div className="bg-white p-4 rounded-lg">
              <img 
                src={generateUpiQR()} 
                alt="UPI QR Code" 
                className="w-48 h-48"
              />
            </div>
            
            {/* UPI ID */}
            <div className="flex items-center gap-2 bg-secondary p-3 rounded-lg w-full">
              <span className="flex-1 font-mono text-sm">{paymentSettings?.upi_id}</span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={copyUpiId}
              >
                {upiCopied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>

            <p className="text-sm text-muted-foreground text-center">
              After payment, click the button below to confirm your order
            </p>

            <Button onClick={confirmUpiPayment} className="w-full">
              I've Made the Payment
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}