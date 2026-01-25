import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, CreditCard, QrCode, Banknote, Copy, Check, Smartphone, CheckCircle, Package, ArrowRight, Wallet, Building2, Ticket, X } from 'lucide-react';
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

// Helper function to convert number to words
const numberToWords = (num: number): string => {
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 
                'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  
  if (num === 0) return 'Zero';
  if (num < 20) return ones[num];
  if (num < 100) return tens[Math.floor(num / 10)] + (num % 10 ? ' ' + ones[num % 10] : '');
  if (num < 1000) return ones[Math.floor(num / 100)] + ' Hundred' + (num % 100 ? ' ' + numberToWords(num % 100) : '');
  if (num < 100000) return numberToWords(Math.floor(num / 1000)) + ' Thousand' + (num % 1000 ? ' ' + numberToWords(num % 1000) : '');
  if (num < 10000000) return numberToWords(Math.floor(num / 100000)) + ' Lakh' + (num % 100000 ? ' ' + numberToWords(num % 100000) : '');
  return numberToWords(Math.floor(num / 10000000)) + ' Crore' + (num % 10000000 ? ' ' + numberToWords(num % 10000000) : '');
};

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

interface PaymentSettings {
  razorpay_enabled: boolean;
  upi_enabled: boolean;
  upi_id: string | null;
  paytm_enabled: boolean;
  cashfree_enabled: boolean;
  bharatpay_enabled: boolean;
  payyou_enabled: boolean;
  phonepe_enabled: boolean;
  cod_enabled: boolean;
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
  const [utrNumber, setUtrNumber] = useState('');
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{
    id: string;
    code: string;
    discount_type: 'percentage' | 'fixed';
    discount_value: number;
    max_discount_amount: number | null;
  } | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [discountAmount, setDiscountAmount] = useState(0);

  const isBuyNowMode = searchParams.get('mode') === 'buynow';

  const [pincodeLoading, setPincodeLoading] = useState(false);
  
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
      // First try from our serviceable_pincodes table
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
      
      // Fallback to external API (India Post API via proxy)
      const response = await fetch(`https://api.postalpincode.in/pincode/${pincode}`);
      const apiData = await response.json();
      
      if (apiData?.[0]?.Status === 'Success' && apiData[0].PostOffice?.length > 0) {
        const postOffice = apiData[0].PostOffice[0];
        form.setValue('city', postOffice.District || postOffice.Name);
        form.setValue('state', postOffice.State);
      }
    } catch (error) {
      // Silent fail - don't block the order
      console.log('Pincode lookup failed:', error);
    } finally {
      setPincodeLoading(false);
    }
  };

  // Watch pincode changes for auto-fill
  const watchedPincode = form.watch('pincode');
  
  useEffect(() => {
    if (watchedPincode?.length === 6 && /^\d{6}$/.test(watchedPincode)) {
      lookupPincode(watchedPincode);
    }
  }, [watchedPincode]);

  useEffect(() => {
    // Check for Buy Now mode
    if (isBuyNowMode) {
      const storedItem = sessionStorage.getItem('buyNowItem');
      if (storedItem) {
        setBuyNowItem(JSON.parse(storedItem));
      } else {
        navigate('/products');
        return;
      }
    } else if (!user && items.length === 0) {
      // For guests, check session storage for cart
      const guestCart = sessionStorage.getItem('guestCart');
      if (!guestCart) {
        navigate('/products');
        return;
      }
    } else if (user && items.length === 0 && !isBuyNowMode) {
      navigate('/cart');
      return;
    }

    // Load Razorpay script
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => setRazorpayLoaded(true);
    document.body.appendChild(script);

    // Fetch user profile (if logged in) and payment settings
    if (user) {
      fetchProfile();
    }
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
      .select('razorpay_enabled, upi_enabled, upi_id, paytm_enabled, cashfree_enabled, bharatpay_enabled, payyou_enabled, phonepe_enabled, cod_enabled')
      .limit(1)
      .maybeSingle();
    
    if (data) {
      setPaymentSettings(data as PaymentSettings);
      // Set default payment method based on what's enabled (prioritize online payments)
      if (data.razorpay_enabled) {
        setPaymentMethod('razorpay');
      } else if ((data as any).paytm_enabled) {
        setPaymentMethod('paytm');
      } else if ((data as any).cashfree_enabled) {
        setPaymentMethod('cashfree');
      } else if ((data as any).phonepe_enabled) {
        setPaymentMethod('phonepe');
      } else if ((data as any).bharatpay_enabled) {
        setPaymentMethod('bharatpay');
      } else if ((data as any).payyou_enabled) {
        setPaymentMethod('payyou');
      } else if (data.upi_enabled && data.upi_id) {
        setPaymentMethod('upi');
      } else if ((data as any).cod_enabled !== false) {
        setPaymentMethod('cod');
      } else {
        setPaymentMethod('');
      }
    } else {
      setPaymentMethod('cod');
    }
  };

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

  // Calculate totals based on mode
  const checkoutItems = isBuyNowMode && buyNowItem ? [buyNowItem] : items;
  const checkoutTotal = isBuyNowMode && buyNowItem
    ? (buyNowItem.product.sale_price || buyNowItem.product.price) * buyNowItem.quantity
    : totalAmount;
  const shipping = checkoutTotal >= 999 ? 0 : 99;
  const subtotalWithShipping = checkoutTotal + shipping;
  const finalTotal = subtotalWithShipping - discountAmount;

  // Apply coupon handler
  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      toast.error('Please enter a coupon code');
      return;
    }

    setCouponLoading(true);
    try {
      const { data: coupon, error } = await supabase
        .from('coupons')
        .select('*')
        .eq('code', couponCode.toUpperCase().trim())
        .eq('is_active', true)
        .maybeSingle();

      if (error) throw error;

      if (!coupon) {
        toast.error('Invalid coupon code');
        setCouponLoading(false);
        return;
      }

      // Check validity dates
      if (coupon.valid_from && new Date(coupon.valid_from) > new Date()) {
        toast.error('This coupon is not yet active');
        setCouponLoading(false);
        return;
      }

      if (coupon.valid_until && new Date(coupon.valid_until) < new Date()) {
        toast.error('This coupon has expired');
        setCouponLoading(false);
        return;
      }

      // Check usage limit
      if (coupon.usage_limit && coupon.used_count >= coupon.usage_limit) {
        toast.error('This coupon has been fully redeemed');
        setCouponLoading(false);
        return;
      }

      // Check minimum order amount
      if (coupon.min_order_amount && checkoutTotal < coupon.min_order_amount) {
        toast.error(`Minimum order amount is ₹${coupon.min_order_amount}`);
        setCouponLoading(false);
        return;
      }

      // Calculate discount
      let discount = 0;
      if (coupon.discount_type === 'percentage') {
        discount = (checkoutTotal * coupon.discount_value) / 100;
      } else {
        discount = coupon.discount_value;
      }

      // Apply max discount cap
      if (coupon.max_discount_amount && discount > coupon.max_discount_amount) {
        discount = coupon.max_discount_amount;
      }

      // Don't allow discount more than order total
      discount = Math.min(discount, subtotalWithShipping);

      setAppliedCoupon({
        id: coupon.id,
        code: coupon.code,
        discount_type: coupon.discount_type as 'percentage' | 'fixed',
        discount_value: coupon.discount_value,
        max_discount_amount: coupon.max_discount_amount,
      });
      setDiscountAmount(discount);
      toast.success(`Coupon applied! You save ₹${discount.toLocaleString()}`);
    } catch (error) {
      console.error('Coupon error:', error);
      toast.error('Failed to apply coupon');
    } finally {
      setCouponLoading(false);
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setDiscountAmount(0);
    setCouponCode('');
    toast.info('Coupon removed');
  };

  const createOrder = async (paymentId?: string, status: string = 'pending') => {
    const addressData = form.getValues();
    
    // Create order - support both authenticated and guest users
    const orderData: any = {
      total_amount: finalTotal,
      status: status,
      payment_method: paymentMethod,
      payment_id: paymentId || null,
      discount_amount: discountAmount,
      coupon_code: appliedCoupon?.code || null,
      shipping_address: {
        fullName: addressData.fullName,
        email: addressData.email,
        phone: addressData.phone,
        address: addressData.address,
        city: addressData.city,
        state: addressData.state,
        pincode: addressData.pincode,
      },
    };

    // Add user_id only if logged in, otherwise store guest info
    if (user) {
      orderData.user_id = user.id;
    } else {
      orderData.user_id = null;
      orderData.guest_email = addressData.email;
      orderData.guest_name = addressData.fullName;
      orderData.guest_phone = addressData.phone;
    }

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert(orderData)
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

    // Update coupon usage count if coupon was applied
    if (appliedCoupon) {
      // Get current count and increment
      const { data: couponData } = await supabase
        .from('coupons')
        .select('used_count')
        .eq('id', appliedCoupon.id)
        .single();
      
      if (couponData) {
        await supabase
          .from('coupons')
          .update({ used_count: (couponData.used_count || 0) + 1 })
          .eq('id', appliedCoupon.id);
      }
      
      // Track coupon usage
      await supabase.from('coupon_usage').insert({
        coupon_id: appliedCoupon.id,
        user_id: user?.id || null,
        order_id: order.id,
      });
    }

    // Store order ID in session for guest order tracking
    if (!user) {
      sessionStorage.setItem('guestOrderId', order.id);
      sessionStorage.setItem('guestOrderEmail', addressData.email);
    }

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
          email: form.getValues('email') || user?.email,
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

  const confirmUpiPayment = async (withUtr?: boolean) => {
    if (withUtr && pendingOrderId && utrNumber.trim()) {
      // Update order with UTR number
      await supabase
        .from('orders')
        .update({ payment_id: `UTR:${utrNumber.trim()}` })
        .eq('id', pendingOrderId);
    }
    await clearCheckoutItems();
    setShowUpiDialog(false);
    setUtrNumber('');
    setShowSuccessDialog(true);
  };

  const handleSuccessClose = () => {
    setShowSuccessDialog(false);
    navigate('/orders');
  };

  // UPI deep link generator with auto-filled amount
  const openUpiApp = (app: string) => {
    if (!paymentSettings?.upi_id) return;
    
    const upiId = paymentSettings.upi_id;
    const amount = finalTotal.toString();
    const name = encodeURIComponent('LUXE Store');
    const note = encodeURIComponent('Order Payment');
    
    // Standard UPI deep link format with amount pre-filled
    const upiLink = `upi://pay?pa=${upiId}&pn=${name}&am=${amount}&cu=INR&tn=${note}`;
    
    // Open the UPI link - this will trigger app chooser on mobile
    window.location.href = upiLink;
    
    toast.info('Opening UPI app with amount ₹' + finalTotal);
  };

  const handleSubmit = async (data: AddressFormData) => {
    if (paymentMethod === 'razorpay') {
      await handleRazorpayPayment();
    } else if (paymentMethod === 'upi') {
      await handleUpiPayment();
    } else if (['paytm', 'cashfree', 'phonepe', 'bharatpay', 'payyou'].includes(paymentMethod)) {
      // For other payment gateways - create order with awaiting payment status
      // These would need proper integration with their respective APIs
      setLoading(true);
      try {
        await createOrder(undefined, 'awaiting_payment');
        await clearCheckoutItems();
        toast.success(`Order placed! You will be redirected to ${paymentMethod.charAt(0).toUpperCase() + paymentMethod.slice(1)} for payment.`);
        navigate('/orders');
      } catch (error) {
        console.error('Order error:', error);
        toast.error('Failed to place order');
      } finally {
        setLoading(false);
      }
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

  // Allow checkout for both guests and logged-in users
  const hasItems = isBuyNowMode ? !!buyNowItem : (user ? items.length > 0 : true);
  if (!hasItems) {
    return null;
  }

  const isRazorpayAvailable = paymentSettings?.razorpay_enabled;
  const isUpiAvailable = paymentSettings?.upi_enabled && paymentSettings?.upi_id;
  const isPaytmAvailable = paymentSettings?.paytm_enabled;
  const isCashfreeAvailable = paymentSettings?.cashfree_enabled;
  const isBharatPayAvailable = paymentSettings?.bharatpay_enabled;
  const isPayYouAvailable = paymentSettings?.payyou_enabled;
  const isPhonePeAvailable = paymentSettings?.phonepe_enabled;
  
  // Check if COD is available globally and for all products
  const isGlobalCodEnabled = paymentSettings?.cod_enabled !== false;
  const allProductsAllowCod = checkoutItems.every(item => (item.product as any)?.cod_available !== false);
  const isCodAvailable = isGlobalCodEnabled && allProductsAllowCod;

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
                      <Label htmlFor="email">Email Address</Label>
                      <Input id="email" type="email" {...form.register('email')} />
                      {form.formState.errors.email && (
                        <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input id="phone" {...form.register('phone')} />
                    {form.formState.errors.phone && (
                      <p className="text-sm text-destructive">{form.formState.errors.phone.message}</p>
                    )}
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
                      <Label htmlFor="pincode">Pincode</Label>
                      <div className="relative">
                        <Input 
                          id="pincode" 
                          {...form.register('pincode')} 
                          placeholder="Enter pincode"
                          maxLength={6}
                        />
                        {pincodeLoading && (
                          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                        )}
                      </div>
                      {form.formState.errors.pincode && (
                        <p className="text-sm text-destructive">{form.formState.errors.pincode.message}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="city">City</Label>
                      <Input 
                        id="city" 
                        {...form.register('city')} 
                        placeholder={pincodeLoading ? "Loading..." : "City"}
                      />
                      {form.formState.errors.city && (
                        <p className="text-sm text-destructive">{form.formState.errors.city.message}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="state">State</Label>
                      <Input 
                        id="state" 
                        {...form.register('state')} 
                        placeholder={pincodeLoading ? "Loading..." : "State"}
                      />
                      {form.formState.errors.state && (
                        <p className="text-sm text-destructive">{form.formState.errors.state.message}</p>
                      )}
                    </div>
                  </div>
                </div>
              </Card>

              {/* Coupon Code Section */}
              <Card className="p-6">
                <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
                  <Ticket className="h-5 w-5" />
                  Apply Coupon
                </h2>
                
                {appliedCoupon ? (
                  <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                        <Check className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-green-800">{appliedCoupon.code}</p>
                        <p className="text-sm text-green-600">
                          {appliedCoupon.discount_type === 'percentage' 
                            ? `${appliedCoupon.discount_value}% off`
                            : `₹${appliedCoupon.discount_value} off`}
                          {appliedCoupon.max_discount_amount && ` (Max ₹${appliedCoupon.max_discount_amount})`}
                        </p>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={removeCoupon}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Input
                      placeholder="Enter coupon code"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      className="uppercase"
                    />
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={handleApplyCoupon}
                      disabled={couponLoading}
                    >
                      {couponLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Apply'}
                    </Button>
                  </div>
                )}
              </Card>

              {/* Payment Method */}
              <Card className="p-6">
                <h2 className="font-semibold text-lg mb-4">Payment Method</h2>
                
                <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod} className="space-y-3">
                  {/* Razorpay Option */}
                  {isRazorpayAvailable && (
                    <div className="flex items-center space-x-3 p-4 border rounded-lg cursor-pointer hover:bg-secondary/50 transition-colors">
                      <RadioGroupItem value="razorpay" id="razorpay" />
                      <Label htmlFor="razorpay" className="flex-1 cursor-pointer">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                            <CreditCard className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-medium">Pay Online (Razorpay)</p>
                            <p className="text-sm text-muted-foreground">Cards, UPI, Net Banking, Wallets</p>
                          </div>
                        </div>
                      </Label>
                    </div>
                  )}

                  {/* Paytm Option */}
                  {isPaytmAvailable && (
                    <div className="flex items-center space-x-3 p-4 border rounded-lg cursor-pointer hover:bg-secondary/50 transition-colors">
                      <RadioGroupItem value="paytm" id="paytm" />
                      <Label htmlFor="paytm" className="flex-1 cursor-pointer">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-sky-100 flex items-center justify-center">
                            <Wallet className="h-5 w-5 text-sky-600" />
                          </div>
                          <div>
                            <p className="font-medium">Paytm</p>
                            <p className="text-sm text-muted-foreground">Paytm Wallet, UPI, Cards & Net Banking</p>
                          </div>
                        </div>
                      </Label>
                    </div>
                  )}

                  {/* Cashfree Option */}
                  {isCashfreeAvailable && (
                    <div className="flex items-center space-x-3 p-4 border rounded-lg cursor-pointer hover:bg-secondary/50 transition-colors">
                      <RadioGroupItem value="cashfree" id="cashfree" />
                      <Label htmlFor="cashfree" className="flex-1 cursor-pointer">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                            <Banknote className="h-5 w-5 text-purple-600" />
                          </div>
                          <div>
                            <p className="font-medium">Cashfree</p>
                            <p className="text-sm text-muted-foreground">Fast & secure payments</p>
                          </div>
                        </div>
                      </Label>
                    </div>
                  )}

                  {/* PhonePe Merchant Option */}
                  {isPhonePeAvailable && (
                    <div className="flex items-center space-x-3 p-4 border rounded-lg cursor-pointer hover:bg-secondary/50 transition-colors">
                      <RadioGroupItem value="phonepe" id="phonepe" />
                      <Label htmlFor="phonepe" className="flex-1 cursor-pointer">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center">
                            <Smartphone className="h-5 w-5 text-indigo-600" />
                          </div>
                          <div>
                            <p className="font-medium">PhonePe</p>
                            <p className="text-sm text-muted-foreground">Pay via PhonePe Business</p>
                          </div>
                        </div>
                      </Label>
                    </div>
                  )}

                  {/* BharatPay Option */}
                  {isBharatPayAvailable && (
                    <div className="flex items-center space-x-3 p-4 border rounded-lg cursor-pointer hover:bg-secondary/50 transition-colors">
                      <RadioGroupItem value="bharatpay" id="bharatpay" />
                      <Label htmlFor="bharatpay" className="flex-1 cursor-pointer">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
                            <Building2 className="h-5 w-5 text-orange-600" />
                          </div>
                          <div>
                            <p className="font-medium">BharatPay</p>
                            <p className="text-sm text-muted-foreground">UPI & Bank payments</p>
                          </div>
                        </div>
                      </Label>
                    </div>
                  )}

                  {/* PayYou Biz Option */}
                  {isPayYouAvailable && (
                    <div className="flex items-center space-x-3 p-4 border rounded-lg cursor-pointer hover:bg-secondary/50 transition-colors">
                      <RadioGroupItem value="payyou" id="payyou" />
                      <Label htmlFor="payyou" className="flex-1 cursor-pointer">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-teal-100 flex items-center justify-center">
                            <Wallet className="h-5 w-5 text-teal-600" />
                          </div>
                          <div>
                            <p className="font-medium">PayYou Biz</p>
                            <p className="text-sm text-muted-foreground">Business payment solution</p>
                          </div>
                        </div>
                      </Label>
                    </div>
                  )}
                  
                  {/* UPI Option */}
                  {isUpiAvailable && (
                    <div className="flex items-center space-x-3 p-4 border rounded-lg cursor-pointer hover:bg-secondary/50 transition-colors">
                      <RadioGroupItem value="upi" id="upi" />
                      <Label htmlFor="upi" className="flex-1 cursor-pointer">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                            <QrCode className="h-5 w-5 text-green-600" />
                          </div>
                          <div>
                            <p className="font-medium">Pay via UPI</p>
                            <p className="text-sm text-muted-foreground">Scan QR code or pay to UPI ID</p>
                          </div>
                        </div>
                      </Label>
                    </div>
                  )}
                  
                  {/* COD Option - Only show if globally enabled AND all products allow COD */}
                  {isCodAvailable && (
                    <div className="flex items-center space-x-3 p-4 border rounded-lg cursor-pointer hover:bg-secondary/50 transition-colors">
                      <RadioGroupItem value="cod" id="cod" />
                      <Label htmlFor="cod" className="flex-1 cursor-pointer">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                            <Banknote className="h-5 w-5 text-amber-600" />
                          </div>
                          <div>
                            <p className="font-medium">Cash on Delivery</p>
                            <p className="text-sm text-muted-foreground">Pay when you receive your order</p>
                          </div>
                        </div>
                      </Label>
                    </div>
                  )}
                </RadioGroup>

                {!isCodAvailable && !isRazorpayAvailable && !isUpiAvailable && !isPaytmAvailable && !isCashfreeAvailable && !isBharatPayAvailable && !isPayYouAvailable && !isPhonePeAvailable && (
                  <p className="text-sm text-destructive mt-4">
                    ⚠️ No payment methods available. Please contact support.
                  </p>
                )}

                {!isCodAvailable && (isRazorpayAvailable || isUpiAvailable || isPaytmAvailable || isCashfreeAvailable || isBharatPayAvailable || isPayYouAvailable || isPhonePeAvailable) && (
                  <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <p className="text-sm text-amber-700">
                      💳 Cash on Delivery is not available for {!isGlobalCodEnabled ? 'this store' : 'some products in your cart'}. Please pay online.
                    </p>
                  </div>
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
                  {discountAmount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span className="flex items-center gap-1">
                        <Ticket className="h-3 w-3" />
                        Discount ({appliedCoupon?.code})
                      </span>
                      <span>-₹{discountAmount.toLocaleString()}</span>
                    </div>
                  )}
                </div>

                <Separator className="my-4" />

                <div className="flex justify-between font-semibold text-lg mb-6">
                  <span>Total</span>
                  <div className="text-right">
                    {discountAmount > 0 && (
                      <span className="text-sm line-through text-muted-foreground mr-2">
                        ₹{subtotalWithShipping.toLocaleString()}
                      </span>
                    )}
                    <span>₹{finalTotal.toLocaleString()}</span>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={loading || !paymentMethod}
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : null}
                  {paymentMethod === 'razorpay' ? 'Pay with Razorpay' : 
                   paymentMethod === 'paytm' ? 'Pay with Paytm' :
                   paymentMethod === 'cashfree' ? 'Pay with Cashfree' :
                   paymentMethod === 'phonepe' ? 'Pay with PhonePe' :
                   paymentMethod === 'bharatpay' ? 'Pay with BharatPay' :
                   paymentMethod === 'payyou' ? 'Pay with PayYou' :
                   paymentMethod === 'upi' ? 'Generate UPI QR' : 'Place Order (COD)'}
                </Button>
              </Card>
            </div>
          </div>
        </form>
      </div>

      {/* UPI Payment Dialog with App Redirect */}
      <Dialog open={showUpiDialog} onOpenChange={setShowUpiDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center">Pay via UPI</DialogTitle>
            <DialogDescription className="text-center">
              Pay ₹{finalTotal.toLocaleString()} using UPI
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-5">
            {/* Amount Display */}
            <div className="text-center py-4 bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg border">
              <p className="text-3xl font-bold text-primary">₹{finalTotal.toLocaleString()}</p>
              <p className="text-sm text-muted-foreground mt-1">Rupees {numberToWords(finalTotal)} Only</p>
            </div>

            {/* UPI App Buttons - Amount will be auto-filled */}
            <div className="space-y-3">
              <p className="text-sm font-medium text-center">Pay using UPI App (Amount auto-filled)</p>
              <div className="grid grid-cols-3 gap-2">
                <Button
                  variant="outline"
                  className="h-16 flex flex-col items-center justify-center gap-1 hover:bg-purple-50 hover:border-purple-300"
                  onClick={() => openUpiApp('phonepe')}
                >
                  <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center">
                    <span className="text-white font-bold text-sm">Pe</span>
                  </div>
                  <span className="text-[10px] font-medium">PhonePe</span>
                </Button>
                
                <Button
                  variant="outline"
                  className="h-16 flex flex-col items-center justify-center gap-1 hover:bg-blue-50 hover:border-blue-300"
                  onClick={() => openUpiApp('paytm')}
                >
                  <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
                    <span className="text-white font-bold text-[8px]">Paytm</span>
                  </div>
                  <span className="text-[10px] font-medium">Paytm</span>
                </Button>
                
                <Button
                  variant="outline"
                  className="h-16 flex flex-col items-center justify-center gap-1 hover:bg-green-50 hover:border-green-300"
                  onClick={() => openUpiApp('gpay')}
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 via-green-500 to-yellow-500 flex items-center justify-center">
                    <span className="text-white font-bold text-sm">G</span>
                  </div>
                  <span className="text-[10px] font-medium">GPay</span>
                </Button>

                <Button
                  variant="outline"
                  className="h-16 flex flex-col items-center justify-center gap-1 hover:bg-blue-50 hover:border-blue-300"
                  onClick={() => openUpiApp('bhim')}
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-700 to-blue-900 flex items-center justify-center">
                    <span className="text-white font-bold text-[8px]">BHIM</span>
                  </div>
                  <span className="text-[10px] font-medium">BHIM UPI</span>
                </Button>

                <Button
                  variant="outline"
                  className="h-16 flex flex-col items-center justify-center gap-1 hover:bg-orange-50 hover:border-orange-300"
                  onClick={() => openUpiApp('amazon')}
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-500 to-yellow-400 flex items-center justify-center">
                    <span className="text-white font-bold text-[8px]">₹Pay</span>
                  </div>
                  <span className="text-[10px] font-medium">Amazon</span>
                </Button>
                
                <Button
                  variant="outline"
                  className="h-16 flex flex-col items-center justify-center gap-1"
                  onClick={() => openUpiApp('any')}
                >
                  <Smartphone className="h-6 w-6 text-muted-foreground" />
                  <span className="text-[10px] font-medium">Other UPI</span>
                </Button>
              </div>
            </div>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">Or scan QR</span>
              </div>
            </div>

            {/* QR Code */}
            <div className="flex justify-center">
              <div className="bg-white p-3 rounded-xl shadow-md border">
                <img 
                  src={generateUpiQR()} 
                  alt="UPI QR Code" 
                  className="w-40 h-40"
                />
              </div>
            </div>
            
            {/* UPI ID with Copy */}
            <div className="flex items-center gap-2 bg-secondary p-3 rounded-lg">
              <span className="flex-1 font-mono text-xs text-center">{paymentSettings?.upi_id}</span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={copyUpiId}
              >
                {upiCopied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>

            {/* UTR Verification Section */}
            <div className="space-y-2">
              <p className="text-sm font-medium text-center">Enter UTR Number for Quick Verification</p>
              <div className="flex gap-2">
                <Input
                  placeholder="Enter 12-digit UTR number"
                  value={utrNumber}
                  onChange={(e) => setUtrNumber(e.target.value.replace(/\D/g, '').slice(0, 12))}
                  className="font-mono text-center"
                  maxLength={12}
                />
              </div>
              <p className="text-xs text-muted-foreground text-center">
                You can find UTR in your UPI app payment history
              </p>
            </div>

            {/* Confirm Buttons */}
            <div className="space-y-2">
              <Button 
                onClick={() => confirmUpiPayment(true)} 
                className="w-full" 
                size="lg"
                disabled={utrNumber.length < 10}
              >
                Verify with UTR ✓
              </Button>
              <Button 
                onClick={() => confirmUpiPayment(false)} 
                variant="outline" 
                className="w-full"
              >
                I've Paid (Verify Later)
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Payment Success Dialog */}
      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent className="sm:max-w-md">
          <div className="flex flex-col items-center py-6 space-y-6">
            {/* Success Animation */}
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-green-100 flex items-center justify-center animate-scale-in">
                <CheckCircle className="h-12 w-12 text-green-600 animate-[bounce_1s_ease-in-out_1]" />
              </div>
              {/* Confetti-like dots animation */}
              <div className="absolute inset-0 animate-fade-in">
                <div className="absolute -top-2 left-1/2 w-2 h-2 rounded-full bg-yellow-400 animate-[ping_1s_ease-in-out_1]" />
                <div className="absolute top-1/4 -right-2 w-2 h-2 rounded-full bg-blue-400 animate-[ping_1.2s_ease-in-out_1]" />
                <div className="absolute -bottom-1 left-1/4 w-2 h-2 rounded-full bg-pink-400 animate-[ping_1.4s_ease-in-out_1]" />
                <div className="absolute top-1/3 -left-2 w-2 h-2 rounded-full bg-purple-400 animate-[ping_1.6s_ease-in-out_1]" />
              </div>
            </div>

            {/* Success Text */}
            <div className="text-center space-y-2 animate-fade-in">
              <h2 className="text-2xl font-bold text-foreground">Payment Initiated!</h2>
              <p className="text-muted-foreground">
                Your order has been placed successfully
              </p>
            </div>

            {/* Amount Paid */}
            <div className="w-full bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4 animate-fade-in">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Amount Paid</span>
                <span className="text-xl font-bold text-green-700">₹{finalTotal.toLocaleString()}</span>
              </div>
            </div>

            {/* Order Status Info */}
            <div className="w-full space-y-3 animate-fade-in">
              <div className="flex items-center gap-3 p-3 bg-secondary/50 rounded-lg">
                <Package className="h-5 w-5 text-primary" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Order Processing</p>
                  <p className="text-xs text-muted-foreground">We'll verify your payment shortly</p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="w-full space-y-3 animate-fade-in">
              <Button onClick={handleSuccessClose} className="w-full" size="lg">
                View My Orders
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowSuccessDialog(false);
                  navigate('/');
                }} 
                className="w-full"
              >
                Continue Shopping
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}