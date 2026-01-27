import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2, CreditCard, QrCode, Banknote, Copy, Check, Smartphone, CheckCircle, ArrowLeft, Wallet, Building2, Ticket, X, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
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

interface AddressData {
  fullName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
}

interface PaymentSettings {
  razorpay_enabled: boolean;
  razorpay_display_name: string | null;
  razorpay_display_description: string | null;
  razorpay_upi_enabled: boolean;
  razorpay_upi_id: string | null;
  razorpay_upi_display_name: string | null;
  razorpay_upi_display_description: string | null;
  upi_enabled: boolean;
  upi_id: string | null;
  upi_display_name: string | null;
  upi_display_description: string | null;
  paytm_enabled: boolean;
  paytm_display_name: string | null;
  paytm_display_description: string | null;
  cashfree_enabled: boolean;
  cashfree_display_name: string | null;
  cashfree_display_description: string | null;
  bharatpay_enabled: boolean;
  bharatpay_display_name: string | null;
  bharatpay_display_description: string | null;
  payyou_enabled: boolean;
  payyou_display_name: string | null;
  payyou_display_description: string | null;
  phonepe_enabled: boolean;
  phonepe_display_name: string | null;
  phonepe_display_description: string | null;
  cod_enabled: boolean;
  cod_display_name: string | null;
  cod_display_description: string | null;
  // Shipping settings
  shipping_enabled: boolean;
  shipping_charge: number;
  free_shipping_threshold: number;
  razorpay_shipping_charge: number;
  upi_shipping_charge: number;
  razorpay_upi_shipping_charge: number;
  paytm_shipping_charge: number;
  cashfree_shipping_charge: number;
  bharatpay_shipping_charge: number;
  payyou_shipping_charge: number;
  phonepe_shipping_charge: number;
  cod_shipping_charge: number;
}

declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function CheckoutPayment() {
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
  const [addressData, setAddressData] = useState<AddressData | null>(null);
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
  const [welcomeCouponChecked, setWelcomeCouponChecked] = useState(false);
  const [customerIp, setCustomerIp] = useState<string | null>(null);

  // Fetch customer IP on mount
  useEffect(() => {
    const fetchIp = async () => {
      try {
        const response = await fetch('https://api.ipify.org?format=json');
        const data = await response.json();
        setCustomerIp(data.ip);
      } catch (error) {
        console.log('Could not fetch IP:', error);
      }
    };
    fetchIp();
  }, []);

  const isBuyNowMode = searchParams.get('mode') === 'buynow';

  // Load address data from session
  useEffect(() => {
    const savedAddress = sessionStorage.getItem('checkoutAddress');
    if (!savedAddress) {
      toast.error('Please fill in your address first');
      navigate(isBuyNowMode ? '/checkout?mode=buynow' : '/checkout');
      return;
    }
    setAddressData(JSON.parse(savedAddress));
  }, [navigate, isBuyNowMode]);

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

    // Load Razorpay script
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => setRazorpayLoaded(true);
    document.body.appendChild(script);

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
      .select('razorpay_enabled, razorpay_display_name, razorpay_display_description, razorpay_upi_enabled, razorpay_upi_id, razorpay_upi_display_name, razorpay_upi_display_description, upi_enabled, upi_id, upi_display_name, upi_display_description, paytm_enabled, paytm_display_name, paytm_display_description, cashfree_enabled, cashfree_display_name, cashfree_display_description, bharatpay_enabled, bharatpay_display_name, bharatpay_display_description, payyou_enabled, payyou_display_name, payyou_display_description, phonepe_enabled, phonepe_display_name, phonepe_display_description, cod_enabled, cod_display_name, cod_display_description, shipping_enabled, shipping_charge, free_shipping_threshold, razorpay_shipping_charge, upi_shipping_charge, razorpay_upi_shipping_charge, paytm_shipping_charge, cashfree_shipping_charge, bharatpay_shipping_charge, payyou_shipping_charge, phonepe_shipping_charge, cod_shipping_charge')
      .limit(1)
      .maybeSingle();
    
    if (data) {
      setPaymentSettings({
        ...data,
        shipping_enabled: (data as any).shipping_enabled ?? true,
        shipping_charge: (data as any).shipping_charge ?? 99,
        free_shipping_threshold: (data as any).free_shipping_threshold ?? 999,
        razorpay_shipping_charge: (data as any).razorpay_shipping_charge ?? 0,
        upi_shipping_charge: (data as any).upi_shipping_charge ?? 0,
        razorpay_upi_shipping_charge: (data as any).razorpay_upi_shipping_charge ?? 0,
        paytm_shipping_charge: (data as any).paytm_shipping_charge ?? 0,
        cashfree_shipping_charge: (data as any).cashfree_shipping_charge ?? 0,
        bharatpay_shipping_charge: (data as any).bharatpay_shipping_charge ?? 0,
        payyou_shipping_charge: (data as any).payyou_shipping_charge ?? 0,
        phonepe_shipping_charge: (data as any).phonepe_shipping_charge ?? 0,
        cod_shipping_charge: (data as any).cod_shipping_charge ?? 0,
      } as PaymentSettings);
      if (data.razorpay_enabled) {
        setPaymentMethod('razorpay');
      } else if ((data as any).razorpay_upi_enabled && (data as any).razorpay_upi_id) {
        setPaymentMethod('razorpay_upi');
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

  const checkoutItems = isBuyNowMode && buyNowItem ? [buyNowItem] : items;
  const checkoutTotal = isBuyNowMode && buyNowItem
    ? (buyNowItem.product.sale_price || buyNowItem.product.price) * buyNowItem.quantity
    : totalAmount;

  // Calculate shipping based on admin settings
  const calculateShipping = () => {
    // If shipping is disabled globally, return 0
    if (!paymentSettings?.shipping_enabled) {
      return 0;
    }

    // Check for product-level shipping charges first
    let productShipping = 0;
    let hasProductShipping = false;
    checkoutItems.forEach(item => {
      const productCharge = (item.product as any)?.shipping_charge;
      if (productCharge !== null && productCharge !== undefined) {
        productShipping += productCharge * item.quantity;
        hasProductShipping = true;
      }
    });

    // If any product has custom shipping, use that
    if (hasProductShipping) {
      // Add gateway-specific charge if applicable
      const gatewayCharge = getGatewayShippingCharge();
      return productShipping + gatewayCharge;
    }

    // Check free shipping threshold
    const freeThreshold = paymentSettings?.free_shipping_threshold || 0;
    if (freeThreshold > 0 && checkoutTotal >= freeThreshold) {
      return 0;
    }

    // Use global shipping charge + gateway-specific charge
    const globalCharge = paymentSettings?.shipping_charge || 0;
    const gatewayCharge = getGatewayShippingCharge();
    return globalCharge + gatewayCharge;
  };

  // Get gateway-specific shipping charge
  const getGatewayShippingCharge = () => {
    if (!paymentSettings) return 0;
    
    switch (paymentMethod) {
      case 'razorpay': return paymentSettings.razorpay_shipping_charge || 0;
      case 'upi': return paymentSettings.upi_shipping_charge || 0;
      case 'razorpay_upi': return paymentSettings.razorpay_upi_shipping_charge || 0;
      case 'paytm': return paymentSettings.paytm_shipping_charge || 0;
      case 'cashfree': return paymentSettings.cashfree_shipping_charge || 0;
      case 'bharatpay': return paymentSettings.bharatpay_shipping_charge || 0;
      case 'payyou': return paymentSettings.payyou_shipping_charge || 0;
      case 'phonepe': return paymentSettings.phonepe_shipping_charge || 0;
      case 'cod': return paymentSettings.cod_shipping_charge || 0;
      default: return 0;
    }
  };

  const shipping = calculateShipping();
  const subtotalWithShipping = checkoutTotal + shipping;
  const finalTotal = subtotalWithShipping - discountAmount;

  // Check and auto-apply welcome coupon for first-time users
  const checkAndApplyWelcomeCoupon = async () => {
    if (!user || welcomeCouponChecked || appliedCoupon) return;
    
    setWelcomeCouponChecked(true);
    
    try {
      const { data: previousOrders, error: orderError } = await supabase
        .from('orders')
        .select('id')
        .eq('user_id', user.id)
        .neq('status', 'cancelled')
        .limit(1);

      if (orderError) {
        console.log('Error checking previous orders:', orderError);
        return;
      }

      if (previousOrders && previousOrders.length > 0) {
        console.log('User has previous orders, not applying welcome coupon');
        return;
      }

      const { data: welcomeCoupon, error: couponError } = await supabase
        .from('coupons')
        .select('*')
        .eq('code', 'WELCOME10')
        .eq('is_active', true)
        .maybeSingle();

      if (couponError || !welcomeCoupon) {
        console.log('Welcome coupon not found or inactive');
        return;
      }

      if (welcomeCoupon.valid_from && new Date(welcomeCoupon.valid_from) > new Date()) {
        return;
      }
      if (welcomeCoupon.valid_until && new Date(welcomeCoupon.valid_until) < new Date()) {
        return;
      }

      if (welcomeCoupon.usage_limit && welcomeCoupon.used_count >= welcomeCoupon.usage_limit) {
        return;
      }

      setCouponCode('WELCOME10');
      
      let discount = 0;
      if (welcomeCoupon.discount_type === 'percentage') {
        discount = (checkoutTotal * welcomeCoupon.discount_value) / 100;
      } else {
        discount = welcomeCoupon.discount_value;
      }

      if (welcomeCoupon.max_discount_amount && discount > welcomeCoupon.max_discount_amount) {
        discount = welcomeCoupon.max_discount_amount;
      }

      discount = Math.min(discount, subtotalWithShipping);

      setAppliedCoupon({
        id: welcomeCoupon.id,
        code: welcomeCoupon.code,
        discount_type: welcomeCoupon.discount_type as 'percentage' | 'fixed',
        discount_value: welcomeCoupon.discount_value,
        max_discount_amount: welcomeCoupon.max_discount_amount,
      });
      setDiscountAmount(discount);
      toast.success(`🎉 Welcome! First-order discount applied - You save ₹${discount.toLocaleString()}!`, {
        duration: 5000,
      });
    } catch (error) {
      console.log('Error checking welcome coupon:', error);
    }
  };

  useEffect(() => {
    if (user && checkoutTotal > 0 && !welcomeCouponChecked) {
      checkAndApplyWelcomeCoupon();
    }
  }, [user, checkoutTotal, welcomeCouponChecked]);

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

      if (coupon.usage_limit && coupon.used_count >= coupon.usage_limit) {
        toast.error('This coupon has been fully redeemed');
        setCouponLoading(false);
        return;
      }

      if (coupon.min_order_amount && checkoutTotal < coupon.min_order_amount) {
        toast.error(`Minimum order amount is ₹${coupon.min_order_amount}`);
        setCouponLoading(false);
        return;
      }

      let discount = 0;
      if (coupon.discount_type === 'percentage') {
        discount = (checkoutTotal * coupon.discount_value) / 100;
      } else {
        discount = coupon.discount_value;
      }

      if (coupon.max_discount_amount && discount > coupon.max_discount_amount) {
        discount = coupon.max_discount_amount;
      }

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
    if (!addressData) throw new Error('Address data missing');
    
    const orderData: any = {
      total_amount: finalTotal,
      status: status,
      payment_method: paymentMethod,
      payment_id: paymentId || null,
      discount_amount: discountAmount,
      coupon_code: appliedCoupon?.code || null,
      customer_ip: customerIp,
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

    if (appliedCoupon) {
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
      
      await supabase.from('coupon_usage').insert({
        coupon_id: appliedCoupon.id,
        user_id: user?.id || null,
        order_id: order.id,
      });
    }

    if (!user) {
      sessionStorage.setItem('guestOrderId', order.id);
      sessionStorage.setItem('guestOrderEmail', addressData.email);
    }

    return order;
  };

  const clearCheckoutItems = async () => {
    sessionStorage.removeItem('checkoutAddress');
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
      const { data, error } = await supabase.functions.invoke('create-razorpay-order', {
        body: { amount: finalTotal * 100 },
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
            const { error: verifyError } = await supabase.functions.invoke('verify-razorpay-payment', {
              body: {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              },
            });

            if (verifyError) throw verifyError;

            const order = await createOrder(response.razorpay_payment_id, 'confirmed');
            await clearCheckoutItems();
            
            toast.success('Payment successful! Order confirmed.');
            navigate(`/order-confirmation?orderId=${order.id}`);
          } catch (error) {
            console.error('Payment verification error:', error);
            toast.error('Payment verification failed. Order not placed.');
          }
        },
        modal: {
          ondismiss: () => {
            toast.error('Payment cancelled. Order not placed.');
            setLoading(false);
          },
        },
        prefill: {
          name: addressData?.fullName,
          contact: addressData?.phone,
          email: addressData?.email || user?.email,
        },
        theme: {
          color: '#f97316',
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.on('payment.failed', (response: any) => {
        console.error('Payment failed:', response.error);
        toast.error('Payment failed. Order not placed.');
        setLoading(false);
      });
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
    const upiId = getCurrentUpiId();
    if (upiId) {
      navigator.clipboard.writeText(upiId);
      setUpiCopied(true);
      toast.success('UPI ID copied!');
      setTimeout(() => setUpiCopied(false), 2000);
    }
  };

  const confirmUpiPayment = async (withUtr?: boolean) => {
    if (withUtr && pendingOrderId && utrNumber.trim()) {
      const prefix = paymentMethod === 'razorpay_upi' ? 'TRID:' : 'UTR:';
      await supabase
        .from('orders')
        .update({ payment_id: `${prefix}${utrNumber.trim()}`, status: 'awaiting_verification' })
        .eq('id', pendingOrderId);
    }
    
    // Close dialog and clear states
    setShowUpiDialog(false);
    setUtrNumber('');
    setPendingOrderId(null);
    
    // Clear checkout items
    await clearCheckoutItems();
    
    // Show success message and redirect to confirmation page
    toast.success('Order placed successfully! Payment will be verified shortly.');
    navigate(`/order-confirmation?orderId=${pendingOrderId}`);
  };

  const handleUpiDialogClose = async (open: boolean) => {
    if (!open && pendingOrderId) {
      await supabase
        .from('orders')
        .update({ status: 'cancelled' })
        .eq('id', pendingOrderId);
      
      await supabase
        .from('order_items')
        .delete()
        .eq('order_id', pendingOrderId);
      
      if (appliedCoupon) {
        const { data: couponData } = await supabase
          .from('coupons')
          .select('used_count')
          .eq('id', appliedCoupon.id)
          .single();
        
        if (couponData && couponData.used_count > 0) {
          await supabase
            .from('coupons')
            .update({ used_count: couponData.used_count - 1 })
            .eq('id', appliedCoupon.id);
        }
        
        await supabase
          .from('coupon_usage')
          .delete()
          .eq('order_id', pendingOrderId);
      }
      
      setPendingOrderId(null);
      toast.error('Payment not completed. Order cancelled.');
    }
    setShowUpiDialog(open);
  };

  const handleSuccessClose = async () => {
    await clearCheckoutItems();
    setShowSuccessDialog(false);
    navigate('/orders');
  };

  const openUpiApp = (app: string) => {
    const upiId = getCurrentUpiId();
    if (!upiId) return;
    
    const amount = finalTotal.toString();
    const name = encodeURIComponent('LUXE Store');
    const note = encodeURIComponent('Order Payment');
    
    const upiLink = `upi://pay?pa=${upiId}&pn=${name}&am=${amount}&cu=INR&tn=${note}`;
    
    window.location.href = upiLink;
    
    toast.info('Opening UPI app with amount ₹' + finalTotal);
  };

  const handlePayment = async () => {
    if (!addressData) {
      toast.error('Address data missing');
      navigate(isBuyNowMode ? '/checkout?mode=buynow' : '/checkout');
      return;
    }

    if (paymentMethod === 'razorpay') {
      await handleRazorpayPayment();
    } else if (paymentMethod === 'upi' || paymentMethod === 'razorpay_upi') {
      await handleUpiPayment();
    } else if (['paytm', 'cashfree', 'phonepe', 'bharatpay', 'payyou'].includes(paymentMethod)) {
      toast.info(`${paymentMethod.charAt(0).toUpperCase() + paymentMethod.slice(1)} integration is coming soon. Please use another payment method.`);
    } else {
      setLoading(true);
      try {
        const order = await createOrder(undefined, 'confirmed');
        await clearCheckoutItems();
        toast.success('Order placed successfully! Pay on delivery.');
        navigate(`/order-confirmation?orderId=${order.id}`);
      } catch (error) {
        console.error('Order error:', error);
        toast.error('Failed to place order');
      } finally {
        setLoading(false);
      }
    }
  };

  const generateUpiQR = (forRazorpayUpi?: boolean) => {
    const upiId = forRazorpayUpi ? paymentSettings?.razorpay_upi_id : paymentSettings?.upi_id;
    if (!upiId) return '';
    const upiString = `upi://pay?pa=${upiId}&pn=LUXE&am=${finalTotal}&cu=INR`;
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(upiString)}`;
  };

  const getCurrentUpiId = () => {
    return paymentMethod === 'razorpay_upi' ? paymentSettings?.razorpay_upi_id : paymentSettings?.upi_id;
  };

  const hasItems = isBuyNowMode ? !!buyNowItem : (user ? items.length > 0 : true);
  if (!hasItems || !addressData) {
    return null;
  }

  const isRazorpayAvailable = paymentSettings?.razorpay_enabled;
  const isRazorpayUpiAvailable = paymentSettings?.razorpay_upi_enabled && paymentSettings?.razorpay_upi_id;
  const isUpiAvailable = paymentSettings?.upi_enabled && paymentSettings?.upi_id;
  const isPaytmAvailable = paymentSettings?.paytm_enabled;
  const isCashfreeAvailable = paymentSettings?.cashfree_enabled;
  const isBharatPayAvailable = paymentSettings?.bharatpay_enabled;
  const isPayYouAvailable = paymentSettings?.payyou_enabled;
  const isPhonePeAvailable = paymentSettings?.phonepe_enabled;
  
  const isGlobalCodEnabled = paymentSettings?.cod_enabled !== false;
  const allProductsAllowCod = checkoutItems.every(item => (item.product as any)?.cod_available !== false);
  const isCodAvailable = isGlobalCodEnabled && allProductsAllowCod;

  return (
    <Layout>
      <div className="container px-3 md:px-4 py-4 md:py-8 pb-40 md:pb-8">
        {/* Progress Steps - Compact on mobile */}
        <div className="flex items-center justify-center gap-2 md:gap-4 mb-4 md:mb-8">
          <div className="flex items-center gap-1 md:gap-2">
            <div className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-green-500 text-white flex items-center justify-center text-xs md:text-sm font-semibold">
              <Check className="h-3 w-3 md:h-4 md:w-4" />
            </div>
            <span className="text-xs md:text-sm text-muted-foreground">Address</span>
          </div>
          <div className="w-6 md:w-12 h-0.5 bg-primary" />
          <div className="flex items-center gap-1 md:gap-2">
            <div className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs md:text-sm font-semibold">
              2
            </div>
            <span className="text-xs md:text-sm font-medium">Payment</span>
          </div>
        </div>

        <div className="flex items-center gap-2 md:gap-4 mb-4 md:mb-8">
          <Button 
            variant="ghost" 
            size="icon"
            className="h-8 w-8 md:h-10 md:w-10"
            onClick={() => navigate(isBuyNowMode ? '/checkout?mode=buynow' : '/checkout')}
          >
            <ArrowLeft className="h-4 w-4 md:h-5 md:w-5" />
          </Button>
          <h1 className="font-display text-xl md:text-3xl font-bold flex items-center gap-2 md:gap-3">
            <CreditCard className="h-5 w-5 md:h-8 md:w-8" />
            Payment
          </h1>
        </div>

        <div className="grid lg:grid-cols-3 gap-4 md:gap-8">
          <div className="lg:col-span-2 space-y-4 md:space-y-6">
            {/* Delivery Address Summary */}
            <Card className="p-3 md:p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2 md:gap-3 min-w-0">
                  <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                    <MapPin className="h-4 w-4 md:h-5 md:w-5 text-green-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm md:text-base font-medium">Delivering to</p>
                    <p className="text-xs md:text-sm text-muted-foreground truncate">
                      {addressData.fullName}, {addressData.address}, {addressData.city}, {addressData.state} - {addressData.pincode}
                    </p>
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="text-xs md:text-sm h-7 md:h-8 px-2 md:px-3 shrink-0"
                  onClick={() => navigate(isBuyNowMode ? '/checkout?mode=buynow' : '/checkout')}
                >
                  Change
                </Button>
              </div>
            </Card>

            {/* Coupon Code Section */}
            <Card className="p-3 md:p-6">
              <h2 className="font-semibold text-base md:text-lg mb-3 md:mb-4 flex items-center gap-2">
                <Ticket className="h-4 w-4 md:h-5 md:w-5" />
                Apply Coupon
              </h2>
              
              {appliedCoupon ? (
                <div className="flex items-center justify-between p-2 md:p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-2 md:gap-3">
                    <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-green-100 flex items-center justify-center">
                      <Check className="h-4 w-4 md:h-5 md:w-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm md:text-base font-semibold text-green-800">{appliedCoupon.code}</p>
                      <p className="text-xs md:text-sm text-green-600">
                        {appliedCoupon.discount_type === 'percentage' 
                          ? `${appliedCoupon.discount_value}% off`
                          : `₹${appliedCoupon.discount_value} off`}
                        {appliedCoupon.max_discount_amount && ` (Max ₹${appliedCoupon.max_discount_amount})`}
                      </p>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={removeCoupon}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter coupon code"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    className="uppercase h-9 md:h-10 text-sm"
                  />
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={handleApplyCoupon}
                    disabled={couponLoading}
                    className="h-9 md:h-10 px-3 text-sm"
                  >
                    {couponLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Apply'}
                  </Button>
                </div>
              )}
            </Card>

            {/* Payment Method */}
            <Card className="p-3 md:p-6">
              <h2 className="font-semibold text-base md:text-lg mb-3 md:mb-4">Select Payment Method</h2>
              
              <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod} className="space-y-2 md:space-y-3">
                {isRazorpayAvailable && (
                  <div className="flex items-center space-x-2 md:space-x-3 p-2 md:p-4 border rounded-lg cursor-pointer hover:bg-secondary/50 transition-colors">
                    <RadioGroupItem value="razorpay" id="razorpay" />
                    <Label htmlFor="razorpay" className="flex-1 cursor-pointer">
                      <div className="flex items-center gap-2 md:gap-3">
                        <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                          <CreditCard className="h-4 w-4 md:h-5 md:w-5 text-blue-600" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm md:text-base font-medium truncate">{paymentSettings?.razorpay_display_name || 'Pay Online'}</p>
                          <p className="text-xs md:text-sm text-muted-foreground truncate">{paymentSettings?.razorpay_display_description || 'Cards, UPI, Net Banking'}</p>
                        </div>
                      </div>
                    </Label>
                  </div>
                )}

                {isRazorpayUpiAvailable && (
                  <div className="flex items-center space-x-2 md:space-x-3 p-2 md:p-4 border rounded-lg cursor-pointer hover:bg-secondary/50 transition-colors">
                    <RadioGroupItem value="razorpay_upi" id="razorpay_upi" />
                    <Label htmlFor="razorpay_upi" className="flex-1 cursor-pointer">
                      <div className="flex items-center gap-2 md:gap-3">
                        <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center">
                          <span className="text-white font-bold text-[10px] md:text-xs">RZP</span>
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm md:text-base font-medium truncate">{paymentSettings?.razorpay_upi_display_name || 'Razorpay UPI'}</p>
                          <p className="text-xs md:text-sm text-muted-foreground truncate">{paymentSettings?.razorpay_upi_display_description || 'Pay via QR & Enter TR ID'}</p>
                        </div>
                      </div>
                    </Label>
                  </div>
                )}

                {isPaytmAvailable && (
                  <div className="flex items-center space-x-2 md:space-x-3 p-2 md:p-4 border rounded-lg cursor-pointer hover:bg-secondary/50 transition-colors">
                    <RadioGroupItem value="paytm" id="paytm" />
                    <Label htmlFor="paytm" className="flex-1 cursor-pointer">
                      <div className="flex items-center gap-2 md:gap-3">
                        <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                          <Wallet className="h-4 w-4 md:h-5 md:w-5 text-blue-600" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm md:text-base font-medium truncate">{paymentSettings?.paytm_display_name || 'Paytm'}</p>
                          <p className="text-xs md:text-sm text-muted-foreground truncate">{paymentSettings?.paytm_display_description || 'UPI, Wallet, Net Banking'}</p>
                        </div>
                      </div>
                    </Label>
                  </div>
                )}

                {isCashfreeAvailable && (
                  <div className="flex items-center space-x-2 md:space-x-3 p-2 md:p-4 border rounded-lg cursor-pointer hover:bg-secondary/50 transition-colors">
                    <RadioGroupItem value="cashfree" id="cashfree" />
                    <Label htmlFor="cashfree" className="flex-1 cursor-pointer">
                      <div className="flex items-center gap-2 md:gap-3">
                        <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                          <CreditCard className="h-4 w-4 md:h-5 md:w-5 text-purple-600" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm md:text-base font-medium truncate">{paymentSettings?.cashfree_display_name || 'Cashfree'}</p>
                          <p className="text-xs md:text-sm text-muted-foreground truncate">{paymentSettings?.cashfree_display_description || 'Cards, UPI, Net Banking'}</p>
                        </div>
                      </div>
                    </Label>
                  </div>
                )}

                {isPhonePeAvailable && (
                  <div className="flex items-center space-x-2 md:space-x-3 p-2 md:p-4 border rounded-lg cursor-pointer hover:bg-secondary/50 transition-colors">
                    <RadioGroupItem value="phonepe" id="phonepe" />
                    <Label htmlFor="phonepe" className="flex-1 cursor-pointer">
                      <div className="flex items-center gap-2 md:gap-3">
                        <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-indigo-100 flex items-center justify-center">
                          <Smartphone className="h-4 w-4 md:h-5 md:w-5 text-indigo-600" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm md:text-base font-medium truncate">{paymentSettings?.phonepe_display_name || 'PhonePe'}</p>
                          <p className="text-xs md:text-sm text-muted-foreground truncate">{paymentSettings?.phonepe_display_description || 'UPI & Wallet'}</p>
                        </div>
                      </div>
                    </Label>
                  </div>
                )}

                {isBharatPayAvailable && (
                  <div className="flex items-center space-x-2 md:space-x-3 p-2 md:p-4 border rounded-lg cursor-pointer hover:bg-secondary/50 transition-colors">
                    <RadioGroupItem value="bharatpay" id="bharatpay" />
                    <Label htmlFor="bharatpay" className="flex-1 cursor-pointer">
                      <div className="flex items-center gap-2 md:gap-3">
                        <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-orange-100 flex items-center justify-center">
                          <Building2 className="h-4 w-4 md:h-5 md:w-5 text-orange-600" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm md:text-base font-medium truncate">{paymentSettings?.bharatpay_display_name || 'BharatPay'}</p>
                          <p className="text-xs md:text-sm text-muted-foreground truncate">{paymentSettings?.bharatpay_display_description || 'UPI & Bank'}</p>
                        </div>
                      </div>
                    </Label>
                  </div>
                )}

                {isPayYouAvailable && (
                  <div className="flex items-center space-x-2 md:space-x-3 p-2 md:p-4 border rounded-lg cursor-pointer hover:bg-secondary/50 transition-colors">
                    <RadioGroupItem value="payyou" id="payyou" />
                    <Label htmlFor="payyou" className="flex-1 cursor-pointer">
                      <div className="flex items-center gap-2 md:gap-3">
                        <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-teal-100 flex items-center justify-center">
                          <Wallet className="h-4 w-4 md:h-5 md:w-5 text-teal-600" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm md:text-base font-medium truncate">{paymentSettings?.payyou_display_name || 'PayYou Biz'}</p>
                          <p className="text-xs md:text-sm text-muted-foreground truncate">{paymentSettings?.payyou_display_description || 'Business payment'}</p>
                        </div>
                      </div>
                    </Label>
                  </div>
                )}
                
                {isUpiAvailable && (
                  <div className="flex items-center space-x-2 md:space-x-3 p-2 md:p-4 border rounded-lg cursor-pointer hover:bg-secondary/50 transition-colors">
                    <RadioGroupItem value="upi" id="upi" />
                    <Label htmlFor="upi" className="flex-1 cursor-pointer">
                      <div className="flex items-center gap-2 md:gap-3">
                        <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-green-100 flex items-center justify-center">
                          <QrCode className="h-4 w-4 md:h-5 md:w-5 text-green-600" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm md:text-base font-medium truncate">{paymentSettings?.upi_display_name || 'Pay via UPI'}</p>
                          <p className="text-xs md:text-sm text-muted-foreground truncate">{paymentSettings?.upi_display_description || 'Scan QR or UPI ID'}</p>
                        </div>
                      </div>
                    </Label>
                  </div>
                )}
                
                {isCodAvailable && (
                  <div className="flex items-center space-x-2 md:space-x-3 p-2 md:p-4 border rounded-lg cursor-pointer hover:bg-secondary/50 transition-colors">
                    <RadioGroupItem value="cod" id="cod" />
                    <Label htmlFor="cod" className="flex-1 cursor-pointer">
                      <div className="flex items-center gap-2 md:gap-3">
                        <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                          <Banknote className="h-4 w-4 md:h-5 md:w-5 text-amber-600" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm md:text-base font-medium truncate">{paymentSettings?.cod_display_name || 'Cash on Delivery'}</p>
                          <p className="text-xs md:text-sm text-muted-foreground truncate">{paymentSettings?.cod_display_description || 'Pay on delivery'}</p>
                        </div>
                      </div>
                    </Label>
                  </div>
                )}
              </RadioGroup>

              {!isCodAvailable && !isRazorpayAvailable && !isUpiAvailable && !isPaytmAvailable && !isCashfreeAvailable && !isBharatPayAvailable && !isPayYouAvailable && !isPhonePeAvailable && (
                <p className="text-xs md:text-sm text-destructive mt-3 md:mt-4">
                  ⚠️ No payment methods available. Please contact support.
                </p>
              )}

              {!isCodAvailable && (isRazorpayAvailable || isUpiAvailable || isPaytmAvailable || isCashfreeAvailable || isBharatPayAvailable || isPayYouAvailable || isPhonePeAvailable) && (
                <div className="mt-3 md:mt-4 p-2 md:p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-xs md:text-sm text-amber-700">
                    💳 COD not available for {!isGlobalCodEnabled ? 'this store' : 'some items'}.
                  </p>
                </div>
              )}
            </Card>
          </div>

          {/* Order Summary - Fixed bottom on mobile */}
          <div className="fixed bottom-14 left-0 right-0 z-40 bg-background border-t shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] md:relative md:bottom-auto md:border-t-0 md:shadow-none lg:block">
            <Card className="border-0 md:border rounded-none md:rounded-lg p-0 md:p-6 md:sticky md:top-24">
              {/* Compact view on mobile */}
              <div className="md:hidden px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold">₹{finalTotal.toLocaleString()}</span>
                      {discountAmount > 0 && (
                        <span className="text-xs line-through text-muted-foreground">₹{subtotalWithShipping.toLocaleString()}</span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      {checkoutItems.length} item(s) • {shipping === 0 ? 'Free delivery' : `+₹${shipping} delivery`}
                    </p>
                  </div>
                  <Button
                    onClick={handlePayment}
                    disabled={loading || !paymentMethod}
                    className="shrink-0"
                  >
                    {loading && <Loader2 className="h-3 w-3 animate-spin mr-1" />}
                    {paymentMethod === 'cod' ? 'Place Order' : 'Pay Now'}
                  </Button>
                </div>
              </div>

              {/* Full view on desktop */}
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
                  onClick={handlePayment}
                  className="w-full"
                  size="lg"
                  disabled={loading || !paymentMethod}
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : null}
                  {paymentMethod === 'razorpay' ? 'Pay with Razorpay' : 
                   paymentMethod === 'razorpay_upi' ? `Pay with ${paymentSettings?.razorpay_upi_display_name || 'Razorpay UPI'}` :
                   paymentMethod === 'paytm' ? 'Pay with Paytm' :
                   paymentMethod === 'cashfree' ? 'Pay with Cashfree' :
                   paymentMethod === 'phonepe' ? 'Pay with PhonePe' :
                   paymentMethod === 'bharatpay' ? 'Pay with BharatPay' :
                   paymentMethod === 'payyou' ? 'Pay with PayYou' :
                   paymentMethod === 'upi' ? `${paymentSettings?.upi_display_name || 'Generate UPI QR'}` : 'Place Order (COD)'}
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* UPI Payment Dialog - Advanced */}
      <Dialog open={showUpiDialog} onOpenChange={handleUpiDialogClose}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader className="pb-2">
            <div className="flex items-center justify-center gap-2 mb-2">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                paymentMethod === 'razorpay_upi' 
                  ? 'bg-gradient-to-br from-blue-500 to-blue-700' 
                  : 'bg-gradient-to-br from-green-500 to-emerald-600'
              }`}>
                {paymentMethod === 'razorpay_upi' ? (
                  <span className="text-white font-bold text-xs">RZP</span>
                ) : (
                  <QrCode className="h-5 w-5 text-white" />
                )}
              </div>
            </div>
            <DialogTitle className="text-center text-xl">
              {paymentMethod === 'razorpay_upi' ? 'Razorpay UPI Payment' : 'Complete Your Payment'}
            </DialogTitle>
            <DialogDescription className="text-center">
              {paymentMethod === 'razorpay_upi' ? 'Pay via Razorpay UPI & Enter TR ID' : 'Secure UPI Payment'} • Order ID: #{pendingOrderId?.slice(0, 8).toUpperCase()}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Amount Display */}
            <div className="text-center py-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 rounded-xl border border-green-200 dark:border-green-800">
              <p className="text-sm text-muted-foreground mb-1">Amount to Pay</p>
              <p className="text-4xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                ₹{finalTotal.toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground mt-1 italic">
                ({numberToWords(finalTotal)} Rupees Only)
              </p>
            </div>

            {/* UPI Apps Grid */}
            <div className="space-y-3">
              <p className="text-sm font-semibold text-center flex items-center justify-center gap-2">
                <Smartphone className="h-4 w-4" />
                Pay using UPI App
                <span className="text-xs font-normal text-muted-foreground">(Amount auto-filled)</span>
              </p>
              <div className="grid grid-cols-3 gap-3">
                <Button
                  variant="outline"
                  className="h-20 flex flex-col items-center justify-center gap-2 hover:bg-purple-50 hover:border-purple-400 hover:shadow-md transition-all dark:hover:bg-purple-950/30"
                  onClick={() => openUpiApp('phonepe')}
                >
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center shadow-lg">
                    <span className="text-white font-bold text-sm">Pe</span>
                  </div>
                  <span className="text-xs font-medium">PhonePe</span>
                </Button>
                
                <Button
                  variant="outline"
                  className="h-20 flex flex-col items-center justify-center gap-2 hover:bg-blue-50 hover:border-blue-400 hover:shadow-md transition-all dark:hover:bg-blue-950/30"
                  onClick={() => openUpiApp('paytm')}
                >
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center shadow-lg">
                    <span className="text-white font-bold text-[9px]">Paytm</span>
                  </div>
                  <span className="text-xs font-medium">Paytm</span>
                </Button>
                
                <Button
                  variant="outline"
                  className="h-20 flex flex-col items-center justify-center gap-2 hover:bg-green-50 hover:border-green-400 hover:shadow-md transition-all dark:hover:bg-green-950/30"
                  onClick={() => openUpiApp('gpay')}
                >
                  <div className="w-10 h-10 rounded-xl bg-white border-2 border-gray-200 flex items-center justify-center shadow-lg overflow-hidden">
                    <div className="w-full h-full bg-gradient-to-br from-blue-500 via-green-500 to-yellow-400 flex items-center justify-center">
                      <span className="text-white font-bold text-lg">G</span>
                    </div>
                  </div>
                  <span className="text-xs font-medium">GPay</span>
                </Button>

                <Button
                  variant="outline"
                  className="h-20 flex flex-col items-center justify-center gap-2 hover:bg-indigo-50 hover:border-indigo-400 hover:shadow-md transition-all dark:hover:bg-indigo-950/30"
                  onClick={() => openUpiApp('bhim')}
                >
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-800 to-indigo-900 flex items-center justify-center shadow-lg">
                    <span className="text-white font-bold text-[9px]">BHIM</span>
                  </div>
                  <span className="text-xs font-medium">BHIM UPI</span>
                </Button>

                <Button
                  variant="outline"
                  className="h-20 flex flex-col items-center justify-center gap-2 hover:bg-orange-50 hover:border-orange-400 hover:shadow-md transition-all dark:hover:bg-orange-950/30"
                  onClick={() => openUpiApp('amazon')}
                >
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center shadow-lg">
                    <span className="text-white font-bold text-xs">₹Pay</span>
                  </div>
                  <span className="text-xs font-medium">Amazon</span>
                </Button>
                
                <Button
                  variant="outline"
                  className="h-20 flex flex-col items-center justify-center gap-2 hover:bg-gray-100 hover:border-gray-400 hover:shadow-md transition-all dark:hover:bg-gray-800"
                  onClick={() => openUpiApp('any')}
                >
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gray-400 to-gray-600 flex items-center justify-center shadow-lg">
                    <Smartphone className="h-5 w-5 text-white" />
                  </div>
                  <span className="text-xs font-medium">Other UPI</span>
                </Button>
              </div>
            </div>

            {/* Divider */}
            <div className="relative py-2">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-dashed" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-3 text-muted-foreground font-medium">OR SCAN QR</span>
              </div>
            </div>

            {/* QR Code Section */}
            <div className="flex justify-center">
              <div className="bg-white p-4 rounded-2xl shadow-xl border-2 border-gray-100 relative">
                <img 
                  src={generateUpiQR(paymentMethod === 'razorpay_upi')} 
                  alt="UPI QR Code" 
                  className="w-44 h-44 rounded-lg"
                />
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-green-500 text-white text-[10px] px-2 py-0.5 rounded-full font-medium">
                  Scan to Pay
                </div>
              </div>
            </div>
            
            {/* UPI ID */}
            <div className="bg-secondary/80 p-3 rounded-xl border">
              <p className="text-xs text-muted-foreground text-center mb-2">
                {paymentMethod === 'razorpay_upi' ? 'Razorpay UPI ID' : 'UPI ID'}
              </p>
              <div className="flex items-center gap-2 bg-background p-2 rounded-lg">
                <span className="flex-1 font-mono text-sm text-center font-medium truncate">
                  {getCurrentUpiId()}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="shrink-0"
                  onClick={copyUpiId}
                >
                  {upiCopied ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            {/* Divider */}
            <div className="relative py-2">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-dashed" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-3 text-muted-foreground font-medium">AFTER PAYMENT</span>
              </div>
            </div>

            {/* UTR/TR ID Input Section */}
            <div className={`space-y-3 p-4 rounded-xl border ${
              paymentMethod === 'razorpay_upi' 
                ? 'bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-blue-900/30 border-blue-200 dark:border-blue-800'
                : 'bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20'
            }`}>
              <div className="flex items-center justify-center gap-2">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                  paymentMethod === 'razorpay_upi' ? 'bg-blue-200 dark:bg-blue-800' : 'bg-primary/20'
                }`}>
                  <Check className={`h-3 w-3 ${paymentMethod === 'razorpay_upi' ? 'text-blue-600' : 'text-primary'}`} />
                </div>
                <p className="text-sm font-semibold">
                  {paymentMethod === 'razorpay_upi' ? 'Enter TR ID for Quick Verification' : 'Enter UTR for Quick Verification'}
                </p>
              </div>
              
              <div className="space-y-2">
                <Input
                  placeholder={paymentMethod === 'razorpay_upi' ? 'Enter TR ID (e.g., RZCo8ouCwkJJI7qrv2)' : 'Enter 12-digit UTR number'}
                  value={utrNumber}
                  onChange={(e) => {
                    if (paymentMethod === 'razorpay_upi') {
                      // Allow alphanumeric for TR ID
                      setUtrNumber(e.target.value.slice(0, 20));
                    } else {
                      // Only digits for UTR
                      setUtrNumber(e.target.value.replace(/\D/g, '').slice(0, 12));
                    }
                  }}
                  className="font-mono text-center text-lg h-12 tracking-wider border-2 focus:border-primary"
                  maxLength={paymentMethod === 'razorpay_upi' ? 20 : 12}
                />
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <span className={`w-2 h-2 rounded-full ${utrNumber.length >= (paymentMethod === 'razorpay_upi' ? 8 : 10) ? 'bg-green-500' : 'bg-gray-300'}`} />
                    {utrNumber.length} characters
                  </span>
                  <span>{paymentMethod === 'razorpay_upi' ? 'Find TR ID in Razorpay' : 'Find UTR in payment history'}</span>
                </div>
              </div>
              
              <div className="bg-background/80 p-3 rounded-lg border text-xs space-y-1">
                <p className="font-medium text-center">
                  {paymentMethod === 'razorpay_upi' ? '📱 Where to find TR ID?' : '📱 Where to find UTR?'}
                </p>
                <ul className="text-muted-foreground space-y-0.5">
                  {paymentMethod === 'razorpay_upi' ? (
                    <>
                      <li>• Open your UPI app → Payment History</li>
                      <li>• Find this transaction → Copy Transaction Reference</li>
                      <li>• Razorpay TR ID starts with "RZC..."</li>
                    </>
                  ) : (
                    <>
                      <li>• Open your UPI app → Payment History</li>
                      <li>• Find this transaction → Copy UTR/Reference ID</li>
                      <li>• It's usually a 12-digit number</li>
                    </>
                  )}
                </ul>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3 pt-2">
              <Button 
                onClick={() => confirmUpiPayment(true)} 
                className={`w-full h-12 text-base font-semibold ${
                  paymentMethod === 'razorpay_upi'
                    ? 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800'
                    : 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700'
                }`} 
                size="lg"
                disabled={utrNumber.length < (paymentMethod === 'razorpay_upi' ? 8 : 10)}
              >
                <CheckCircle className="h-5 w-5 mr-2" />
                {paymentMethod === 'razorpay_upi' ? 'Submit TR ID & Confirm Order' : 'Submit UTR & Confirm Order'}
              </Button>
              
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-background px-2 text-muted-foreground">Don't have UTR?</span>
                </div>
              </div>
              
              <Button 
                onClick={() => confirmUpiPayment(false)} 
                variant="outline" 
                className="w-full"
              >
                I've Paid, Verify Later
              </Button>
              
              <p className="text-[10px] text-muted-foreground text-center">
                ⚠️ Orders without UTR may take longer to verify (up to 24 hours)
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Payment Success Dialog */}
      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent className="sm:max-w-md">
          <div className="flex flex-col items-center py-6 space-y-6">
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-green-100 flex items-center justify-center animate-scale-in">
                <CheckCircle className="h-12 w-12 text-green-600 animate-[bounce_1s_ease-in-out_1]" />
              </div>
              <div className="absolute inset-0 animate-fade-in">
                <div className="absolute -top-2 left-1/2 w-2 h-2 rounded-full bg-yellow-400 animate-[ping_1s_ease-in-out_1]" />
                <div className="absolute top-1/4 -right-2 w-2 h-2 rounded-full bg-blue-400 animate-[ping_1.2s_ease-in-out_1]" />
                <div className="absolute -bottom-1 left-1/4 w-2 h-2 rounded-full bg-pink-400 animate-[ping_1.4s_ease-in-out_1]" />
                <div className="absolute top-1/3 -left-2 w-2 h-2 rounded-full bg-purple-400 animate-[ping_1.6s_ease-in-out_1]" />
              </div>
            </div>

            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold text-green-600">Payment Received!</h2>
              <p className="text-muted-foreground">
                Your order has been placed successfully.
                {utrNumber ? ' Payment will be verified shortly.' : ' We will verify your payment soon.'}
              </p>
            </div>

            <Button onClick={handleSuccessClose} className="w-full" size="lg">
              View My Orders
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
