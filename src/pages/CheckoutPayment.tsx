import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2, ArrowLeft, ChevronRight, ChevronUp, ChevronDown, Ticket, CreditCard, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
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
import { QrCode, Smartphone, Banknote, Copy, Wallet } from 'lucide-react';

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
  const [onlineExpanded, setOnlineExpanded] = useState(false);
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
  const [priceDetailsOpen, setPriceDetailsOpen] = useState(true);
  
  // Countdown timer state
  const [timeLeft, setTimeLeft] = useState({ hours: 1, minutes: 26, seconds: 42 });

  // Countdown timer effect
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        } else if (prev.minutes > 0) {
          return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        } else if (prev.hours > 0) {
          return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        }
        return prev;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

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
      
      // Default to COD first, then online
      if ((data as any).cod_enabled !== false) {
        setPaymentMethod('cod');
      } else if (data.razorpay_enabled) {
        setPaymentMethod('razorpay');
      } else if ((data as any).razorpay_upi_enabled && (data as any).razorpay_upi_id) {
        setPaymentMethod('razorpay_upi');
      } else if ((data as any).paytm_enabled) {
        setPaymentMethod('paytm');
      } else if (data.upi_enabled && data.upi_id) {
        setPaymentMethod('upi');
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

  // Calculate original price (before sale)
  const originalTotal = checkoutItems.reduce((sum, item) => {
    return sum + (item.product.price * item.quantity);
  }, 0);

  const productDiscount = originalTotal - checkoutTotal;

  const calculateShipping = () => {
    if (!paymentSettings?.shipping_enabled) return 0;

    let productShipping = 0;
    let hasProductShipping = false;
    checkoutItems.forEach(item => {
      const productCharge = (item.product as any)?.shipping_charge;
      if (productCharge !== null && productCharge !== undefined) {
        productShipping += productCharge * item.quantity;
        hasProductShipping = true;
      }
    });

    if (hasProductShipping) {
      const gatewayCharge = getGatewayShippingCharge();
      return productShipping + gatewayCharge;
    }

    const freeThreshold = paymentSettings?.free_shipping_threshold || 0;
    if (freeThreshold > 0 && checkoutTotal >= freeThreshold) {
      return 0;
    }

    const globalCharge = paymentSettings?.shipping_charge || 0;
    const gatewayCharge = getGatewayShippingCharge();
    return globalCharge + gatewayCharge;
  };

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
  const totalDiscount = productDiscount + discountAmount;
  const finalTotal = subtotalWithShipping - discountAmount;

  // Calculate online payment savings (e.g., ₹16 less than COD)
  const onlineSaving = paymentSettings?.cod_shipping_charge 
    ? Math.max(0, (paymentSettings.cod_shipping_charge || 0) - (paymentSettings.razorpay_shipping_charge || paymentSettings.upi_shipping_charge || 0))
    : 16;

  // Coupon handling
  const checkAndApplyWelcomeCoupon = async () => {
    if (!user || welcomeCouponChecked || appliedCoupon) return;
    
    setWelcomeCouponChecked(true);
    
    try {
      const { data: previousOrders } = await supabase
        .from('orders')
        .select('id')
        .eq('user_id', user.id)
        .neq('status', 'cancelled')
        .limit(1);

      if (previousOrders && previousOrders.length > 0) return;

      const { data: welcomeCoupon } = await supabase
        .from('coupons')
        .select('*')
        .eq('code', 'WELCOME10')
        .eq('is_active', true)
        .maybeSingle();

      if (!welcomeCoupon) return;

      if (welcomeCoupon.valid_from && new Date(welcomeCoupon.valid_from) > new Date()) return;
      if (welcomeCoupon.valid_until && new Date(welcomeCoupon.valid_until) < new Date()) return;
      if (welcomeCoupon.usage_limit && welcomeCoupon.used_count >= welcomeCoupon.usage_limit) return;

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
      toast.success(`🎉 Welcome! First-order discount applied - You save ₹${discount.toLocaleString()}!`);
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

  // Order creation & payment handlers
  const createOrder = async (method: string, paymentId?: string, status: string = 'pending') => {
    const orderData: any = {
      total_amount: finalTotal,
      status,
      payment_method: method,
      shipping_address: addressData as any,
      coupon_code: appliedCoupon?.code || null,
      discount_amount: discountAmount,
    };
    
    if (user?.id) {
      orderData.user_id = user.id;
    }
    if (paymentId) {
      orderData.payment_id = paymentId;
    }
    if (!user && addressData) {
      orderData.guest_email = addressData.email;
      orderData.guest_name = addressData.fullName;
      orderData.guest_phone = addressData.phone;
    }
    if (customerIp) {
      orderData.customer_ip = customerIp;
    }

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert([orderData])
      .select()
      .single();

    if (orderError) throw orderError;

    const orderItems = checkoutItems.map(item => ({
      order_id: order.id,
      product_id: item.product.id,
      quantity: item.quantity,
      price: item.product.sale_price || item.product.price,
      product_name: item.product.name,
      product_image: item.product.images?.[0] || null,
      size: item.size || null,
      color: item.color || null,
    }));

    const { error: itemsError } = await supabase.from('order_items').insert(orderItems);
    if (itemsError) throw itemsError;

    if (appliedCoupon) {
      await supabase.from('coupon_usage').insert({
        coupon_id: appliedCoupon.id,
        user_id: user?.id || null,
        order_id: order.id,
      });
      await supabase.from('coupons').update({ used_count: (appliedCoupon as any).used_count + 1 }).eq('id', appliedCoupon.id);
    }

    return order;
  };

  const handlePayment = async () => {
    if (!paymentMethod) {
      toast.error('Please select a payment method');
      return;
    }

    setLoading(true);

    try {
      if (paymentMethod === 'cod') {
        const order = await createOrder('cod', undefined, 'confirmed');
        if (!isBuyNowMode) {
          clearCart();
        }
        sessionStorage.removeItem('buyNowItem');
        sessionStorage.removeItem('checkoutAddress');
        // OrderConfirmation page expects query param (?orderId=...), not a path param.
        navigate(`/order-confirmation?orderId=${order.id}`);
      } else if (paymentMethod === 'upi' || paymentMethod === 'razorpay_upi') {
        const order = await createOrder(paymentMethod, undefined, 'awaiting_payment');
        setPendingOrderId(order.id);
        setShowUpiDialog(true);
      } else if (paymentMethod === 'razorpay') {
        await handleRazorpayPayment();
      } else if (paymentMethod === 'paytm') {
        const order = await createOrder('paytm', undefined, 'awaiting_payment');
        setPendingOrderId(order.id);
        setShowUpiDialog(true);
      }
    } catch (error) {
      console.error('Payment error:', error);
      toast.error('Payment failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRazorpayPayment = async () => {
    if (!razorpayLoaded) {
      toast.error('Payment gateway is loading. Please try again.');
      return;
    }

    try {
      const { data: razorpayOrder, error: razorpayError } = await supabase.functions.invoke('create-razorpay-order', {
        body: { amount: finalTotal },
      });

      if (razorpayError) throw razorpayError;

      const options = {
        key: razorpayOrder.key_id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        name: 'Store',
        description: 'Order Payment',
        order_id: razorpayOrder.id,
        handler: async (response: any) => {
          try {
            const { data: verifyData, error: verifyError } = await supabase.functions.invoke('verify-razorpay-payment', {
              body: {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              },
            });

            if (verifyError) throw verifyError;

            if (verifyData.verified) {
              const order = await createOrder('razorpay', response.razorpay_payment_id, 'confirmed');
              if (!isBuyNowMode) {
                clearCart();
              }
              sessionStorage.removeItem('buyNowItem');
              sessionStorage.removeItem('checkoutAddress');
              // OrderConfirmation page expects query param (?orderId=...), not a path param.
              navigate(`/order-confirmation?orderId=${order.id}`);
            } else {
              toast.error('Payment verification failed');
            }
          } catch (error) {
            toast.error('Payment verification failed');
          }
        },
        prefill: {
          name: addressData?.fullName,
          email: addressData?.email,
          contact: addressData?.phone,
        },
        theme: { color: '#9b1d54' },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (error) {
      toast.error('Failed to initialize payment');
    }
  };

  // UPI Dialog handlers
  const getUpiId = () => {
    if (paymentMethod === 'razorpay_upi') {
      return paymentSettings?.razorpay_upi_id || '';
    }
    return paymentSettings?.upi_id || '';
  };

  const copyUpiId = async () => {
    try {
      await navigator.clipboard.writeText(getUpiId());
      setUpiCopied(true);
      toast.success('UPI ID copied!');
      setTimeout(() => setUpiCopied(false), 2000);
    } catch {
      toast.error('Failed to copy');
    }
  };

  const openUpiApp = (app: string) => {
    const upiId = getUpiId();
    const amount = finalTotal;
    const note = `Order ${pendingOrderId?.slice(0, 8).toUpperCase()}`;
    
    let upiUrl = '';
    switch (app) {
      case 'phonepe':
        upiUrl = `phonepe://pay?pa=${upiId}&pn=Store&am=${amount}&tn=${note}`;
        break;
      case 'gpay':
        upiUrl = `upi://pay?pa=${upiId}&pn=Store&am=${amount}&tn=${note}`;
        break;
      case 'paytm':
        upiUrl = `paytmmp://pay?pa=${upiId}&pn=Store&am=${amount}&tn=${note}`;
        break;
      case 'bhim':
        upiUrl = `upi://pay?pa=${upiId}&pn=Store&am=${amount}&tn=${note}`;
        break;
      case 'amazon':
        upiUrl = `upi://pay?pa=${upiId}&pn=Store&am=${amount}&tn=${note}`;
        break;
      default:
        upiUrl = `upi://pay?pa=${upiId}&pn=Store&am=${amount}&tn=${note}`;
    }
    
    window.location.href = upiUrl;
  };

  const handleUtrSubmit = async () => {
    const expectedLength = paymentMethod === 'razorpay_upi' ? 20 : 12;
    if (utrNumber.length !== expectedLength) {
      toast.error(`Please enter a valid ${expectedLength}-digit ${paymentMethod === 'razorpay_upi' ? 'TR ID' : 'UTR number'}`);
      return;
    }

    setLoading(true);
    try {
      await supabase
        .from('orders')
        .update({ payment_id: utrNumber, status: 'awaiting_verification' })
        .eq('id', pendingOrderId);

      if (!isBuyNowMode) {
        clearCart();
      }
      sessionStorage.removeItem('buyNowItem');
      sessionStorage.removeItem('checkoutAddress');
      setShowUpiDialog(false);
      setShowSuccessDialog(true);
    } catch (error) {
      toast.error('Failed to submit payment details');
    } finally {
      setLoading(false);
    }
  };

  const handleUpiDialogClose = (open: boolean) => {
    if (!open && pendingOrderId) {
      toast.info('Complete payment to confirm your order');
    }
    setShowUpiDialog(open);
  };

  // Payment method availability
  const isCodAvailable = paymentSettings?.cod_enabled !== false && checkoutItems.every(item => (item.product as any)?.cod_available !== false);
  const isOnlineAvailable = paymentSettings?.razorpay_enabled || paymentSettings?.upi_enabled || paymentSettings?.razorpay_upi_enabled || paymentSettings?.paytm_enabled;
  const isGlobalCodEnabled = paymentSettings?.cod_enabled !== false;

  // Calculate prices for each method
  const codPrice = finalTotal + (paymentSettings?.cod_shipping_charge || 0);
  const onlinePrice = finalTotal;
  const onlineOriginalPrice = codPrice;

  const formatTime = (num: number) => num.toString().padStart(2, '0');

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background border-b">
        <div className="flex items-center h-14 px-4">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="ml-2 text-base font-semibold uppercase tracking-wide">Payment Method</h1>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center py-4 px-8">
          <div className="flex items-center gap-0">
            {/* Step 1 - Review (completed) */}
            <div className="flex flex-col items-center">
              <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center">
                <Check className="h-4 w-4 text-white" />
              </div>
              <span className="text-xs mt-1 text-muted-foreground">Review</span>
            </div>
            
            {/* Line */}
            <div className="w-32 h-0.5 bg-emerald-500 mx-1" />
            
            {/* Step 2 - Payment (current) */}
            <div className="flex flex-col items-center">
              <div className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xs font-semibold">
                2
              </div>
              <span className="text-xs mt-1 text-foreground font-medium">Payment</span>
            </div>
          </div>
        </div>
      </div>

      {/* Discount Banner with zigzag */}
      {totalDiscount > 0 && (
        <div className="relative">
          <div className="bg-emerald-100 dark:bg-emerald-900/30 py-3 px-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-emerald-700 dark:text-emerald-400 font-bold text-lg">₹{totalDiscount} OFF</span>
              <span className="text-emerald-700 dark:text-emerald-400 text-sm">on this order</span>
            </div>
            <div className="flex items-center gap-1 bg-white/80 dark:bg-black/30 rounded-full px-3 py-1">
              <span className="text-orange-500">⏰</span>
              <span className="text-sm font-medium text-orange-600 dark:text-orange-400">
                {formatTime(timeLeft.hours)}h : {formatTime(timeLeft.minutes)}m : {formatTime(timeLeft.seconds)}s
              </span>
            </div>
          </div>
          {/* Zigzag border */}
          <div className="absolute bottom-0 left-0 right-0 h-3 overflow-hidden translate-y-full">
            <svg viewBox="0 0 100 10" preserveAspectRatio="none" className="w-full h-full">
              <path 
                d="M0,10 L5,0 L10,10 L15,0 L20,10 L25,0 L30,10 L35,0 L40,10 L45,0 L50,10 L55,0 L60,10 L65,0 L70,10 L75,0 L80,10 L85,0 L90,10 L95,0 L100,10" 
                fill="rgb(209 250 229)" 
                className="dark:fill-emerald-900/30"
              />
            </svg>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="px-4 pt-6 space-y-4">
        {/* Coupon Section */}
        <div className="rounded-xl border bg-card p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Ticket className="h-5 w-5 text-primary" />
              <div>
                <p className="font-semibold text-sm">Apply Coupon</p>
                <p className="text-xs text-muted-foreground">Save more on this order</p>
              </div>
            </div>

            {appliedCoupon ? (
              <button
                type="button"
                onClick={removeCoupon}
                className="text-xs font-semibold text-primary underline underline-offset-2"
              >
                Remove
              </button>
            ) : null}
          </div>

          <div className="mt-3 flex gap-2">
            <Input
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
              placeholder="Enter coupon code"
              className="h-11"
              disabled={!!appliedCoupon}
            />
            <Button
              type="button"
              onClick={appliedCoupon ? removeCoupon : handleApplyCoupon}
              disabled={couponLoading}
              className="h-11 px-5"
              variant={appliedCoupon ? 'outline' : 'default'}
            >
              {couponLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : appliedCoupon ? 'Applied' : 'Apply'}
            </Button>
          </div>

          {appliedCoupon && discountAmount > 0 ? (
            <div className="mt-3 rounded-lg bg-secondary p-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Coupon</span>
                <span className="font-semibold">{appliedCoupon.code}</span>
              </div>
              <div className="flex items-center justify-between mt-1">
                <span className="text-muted-foreground">You saved</span>
                <span className="font-semibold text-emerald-600">- ₹{discountAmount.toLocaleString()}</span>
              </div>
            </div>
          ) : null}
        </div>

        {/* Payment Options */}
        <div className="space-y-3">
          {/* COD Option */}
          {isCodAvailable && (
            <div
              onClick={() => {
                setPaymentMethod('cod');
                setOnlineExpanded(false);
              }}
              className={`flex items-center gap-4 rounded-xl border-2 p-4 cursor-pointer transition-all ${
                paymentMethod === 'cod' ? 'border-primary bg-primary/5' : 'border-border'
              }`}
            >
              <div className="flex items-center gap-3 border-r pr-4">
                <span className="text-lg font-bold">₹{codPrice.toLocaleString()}</span>
              </div>
              <div className="flex-1 flex items-center gap-3">
                <Banknote className="h-5 w-5 text-green-600" />
                <span className="font-medium">{paymentSettings?.cod_display_name || 'Cash on Delivery'}</span>
              </div>
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                paymentMethod === 'cod' ? 'border-primary bg-primary' : 'border-muted-foreground'
              }`}>
                {paymentMethod === 'cod' && <Check className="h-3 w-3 text-white" />}
              </div>
            </div>
          )}

          {/* Online Payment Option - Expandable */}
          {isOnlineAvailable && (
            <div className={`rounded-xl border-2 overflow-hidden transition-all ${
              paymentMethod !== 'cod' && paymentMethod !== '' ? 'border-primary bg-primary/5' : 'border-border'
            }`}>
              {/* Header - Click to expand */}
              <div
                onClick={() => setOnlineExpanded(!onlineExpanded)}
                className="flex items-center gap-4 p-4 cursor-pointer"
              >
                <div className="flex flex-col items-start border-r pr-4">
                  {onlineSaving > 0 && (
                    <span className="text-xs text-muted-foreground line-through">₹{onlineOriginalPrice.toLocaleString()}</span>
                  )}
                  <span className="text-lg font-bold text-emerald-600">₹{onlinePrice.toLocaleString()}</span>
                  {onlineSaving > 0 && (
                    <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-medium">
                      Save ₹{onlineSaving}
                    </span>
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-blue-600" />
                    <span className="font-medium">Pay Online</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">Cards, UPI, Net Banking, Wallets</p>
                </div>
                {onlineExpanded ? (
                  <ChevronUp className="h-5 w-5 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-muted-foreground" />
                )}
              </div>

              {/* Expanded Gateway Options */}
              {onlineExpanded && (
                <div className="border-t bg-secondary/30 p-3 space-y-2">
                  <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod} className="space-y-2">
                    {/* Razorpay */}
                    {paymentSettings?.razorpay_enabled && (
                      <Label
                        htmlFor="razorpay"
                        className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all ${
                          paymentMethod === 'razorpay' ? 'bg-primary/10 border border-primary' : 'bg-background border border-transparent hover:bg-muted'
                        }`}
                      >
                        <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center">
                          <CreditCard className="h-5 w-5 text-white" />
                        </div>
                        <div className="flex-1">
                          <span className="font-medium block">{paymentSettings?.razorpay_display_name || 'Pay Online (Razorpay)'}</span>
                          <span className="text-xs text-muted-foreground">{paymentSettings?.razorpay_display_description || 'Cards, UPI, Net Banking, Wallets'}</span>
                        </div>
                        <RadioGroupItem value="razorpay" id="razorpay" />
                      </Label>
                    )}

                    {/* UPI */}
                    {paymentSettings?.upi_enabled && paymentSettings?.upi_id && (
                      <Label
                        htmlFor="upi"
                        className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all ${
                          paymentMethod === 'upi' ? 'bg-primary/10 border border-primary' : 'bg-background border border-transparent hover:bg-muted'
                        }`}
                      >
                        <div className="w-10 h-10 rounded-lg bg-green-600 flex items-center justify-center">
                          <QrCode className="h-5 w-5 text-white" />
                        </div>
                        <div className="flex-1">
                          <span className="font-medium block">{paymentSettings?.upi_display_name || 'Pay via UPI'}</span>
                          <span className="text-xs text-muted-foreground">{paymentSettings?.upi_display_description || 'Scan QR code or pay to UPI ID'}</span>
                        </div>
                        <RadioGroupItem value="upi" id="upi" />
                      </Label>
                    )}

                    {/* Razorpay UPI */}
                    {paymentSettings?.razorpay_upi_enabled && paymentSettings?.razorpay_upi_id && (
                      <Label
                        htmlFor="razorpay_upi"
                        className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all ${
                          paymentMethod === 'razorpay_upi' ? 'bg-primary/10 border border-primary' : 'bg-background border border-transparent hover:bg-muted'
                        }`}
                      >
                        <div className="w-10 h-10 rounded-lg bg-indigo-600 flex items-center justify-center">
                          <Smartphone className="h-5 w-5 text-white" />
                        </div>
                        <div className="flex-1">
                          <span className="font-medium block">{paymentSettings?.razorpay_upi_display_name || 'Razorpay UPI'}</span>
                          <span className="text-xs text-muted-foreground">{paymentSettings?.razorpay_upi_display_description || 'Pay via QR & Enter TR ID'}</span>
                        </div>
                        <RadioGroupItem value="razorpay_upi" id="razorpay_upi" />
                      </Label>
                    )}

                    {/* Paytm */}
                    {paymentSettings?.paytm_enabled && (
                      <Label
                        htmlFor="paytm"
                        className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all ${
                          paymentMethod === 'paytm' ? 'bg-primary/10 border border-primary' : 'bg-background border border-transparent hover:bg-muted'
                        }`}
                      >
                        <div className="w-10 h-10 rounded-lg bg-sky-500 flex items-center justify-center">
                          <Wallet className="h-5 w-5 text-white" />
                        </div>
                        <div className="flex-1">
                          <span className="font-medium block">{paymentSettings?.paytm_display_name || 'Paytm'}</span>
                          <span className="text-xs text-muted-foreground">{paymentSettings?.paytm_display_description || 'Pay via Paytm Wallet, UPI, Cards'}</span>
                        </div>
                        <RadioGroupItem value="paytm" id="paytm" />
                      </Label>
                    )}

                    {/* Cashfree */}
                    {paymentSettings?.cashfree_enabled && (
                      <Label
                        htmlFor="cashfree"
                        className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all ${
                          paymentMethod === 'cashfree' ? 'bg-primary/10 border border-primary' : 'bg-background border border-transparent hover:bg-muted'
                        }`}
                      >
                        <div className="w-10 h-10 rounded-lg bg-purple-600 flex items-center justify-center">
                          <CreditCard className="h-5 w-5 text-white" />
                        </div>
                        <div className="flex-1">
                          <span className="font-medium block">{paymentSettings?.cashfree_display_name || 'Cashfree'}</span>
                          <span className="text-xs text-muted-foreground">{paymentSettings?.cashfree_display_description || 'Pay via Cards, UPI, Netbanking'}</span>
                        </div>
                        <RadioGroupItem value="cashfree" id="cashfree" />
                      </Label>
                    )}

                    {/* BharatPay */}
                    {paymentSettings?.bharatpay_enabled && (
                      <Label
                        htmlFor="bharatpay"
                        className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all ${
                          paymentMethod === 'bharatpay' ? 'bg-primary/10 border border-primary' : 'bg-background border border-transparent hover:bg-muted'
                        }`}
                      >
                        <div className="w-10 h-10 rounded-lg bg-orange-500 flex items-center justify-center">
                          <Banknote className="h-5 w-5 text-white" />
                        </div>
                        <div className="flex-1">
                          <span className="font-medium block">{paymentSettings?.bharatpay_display_name || 'BharatPay'}</span>
                          <span className="text-xs text-muted-foreground">{paymentSettings?.bharatpay_display_description || 'Pay via UPI & Cards'}</span>
                        </div>
                        <RadioGroupItem value="bharatpay" id="bharatpay" />
                      </Label>
                    )}

                    {/* PayYou */}
                    {paymentSettings?.payyou_enabled && (
                      <Label
                        htmlFor="payyou"
                        className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all ${
                          paymentMethod === 'payyou' ? 'bg-primary/10 border border-primary' : 'bg-background border border-transparent hover:bg-muted'
                        }`}
                      >
                        <div className="w-10 h-10 rounded-lg bg-teal-500 flex items-center justify-center">
                          <Wallet className="h-5 w-5 text-white" />
                        </div>
                        <div className="flex-1">
                          <span className="font-medium block">{paymentSettings?.payyou_display_name || 'PayYou'}</span>
                          <span className="text-xs text-muted-foreground">{paymentSettings?.payyou_display_description || 'Quick & Secure Payment'}</span>
                        </div>
                        <RadioGroupItem value="payyou" id="payyou" />
                      </Label>
                    )}

                    {/* PhonePe */}
                    {paymentSettings?.phonepe_enabled && (
                      <Label
                        htmlFor="phonepe"
                        className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all ${
                          paymentMethod === 'phonepe' ? 'bg-primary/10 border border-primary' : 'bg-background border border-transparent hover:bg-muted'
                        }`}
                      >
                        <div className="w-10 h-10 rounded-lg bg-purple-700 flex items-center justify-center">
                          <Smartphone className="h-5 w-5 text-white" />
                        </div>
                        <div className="flex-1">
                          <span className="font-medium block">{paymentSettings?.phonepe_display_name || 'PhonePe'}</span>
                          <span className="text-xs text-muted-foreground">{paymentSettings?.phonepe_display_description || 'Pay via PhonePe UPI'}</span>
                        </div>
                        <RadioGroupItem value="phonepe" id="phonepe" />
                      </Label>
                    )}
                  </RadioGroup>
                </div>
              )}

              {/* Extra discount banner */}
              <div className="bg-gradient-to-r from-emerald-100 to-emerald-50 dark:from-emerald-900/30 dark:to-emerald-800/20 px-4 py-2 flex items-center gap-2">
                <span className="text-emerald-600">✨</span>
                <span className="text-sm text-emerald-700 dark:text-emerald-400">Extra ₹10 OFF with UPI</span>
              </div>
            </div>
          )}
        </div>

        {/* Reselling section */}
        <div className="flex items-center justify-between py-4 border-t border-b bg-secondary/30 -mx-4 px-4">
          <span className="font-medium">Reselling the order?</span>
          <ChevronRight className="h-5 w-5 text-muted-foreground" />
        </div>

        {/* Price Details Collapsible */}
        <Collapsible open={priceDetailsOpen} onOpenChange={setPriceDetailsOpen}>
          <CollapsibleTrigger className="flex items-center justify-between w-full py-3">
            <span className="font-semibold">Price Details ({checkoutItems.length} Item)</span>
            {priceDetailsOpen ? (
              <ChevronUp className="h-5 w-5 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-5 w-5 text-muted-foreground" />
            )}
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-3 pt-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Total Product Price</span>
              <span>+ ₹{originalTotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-emerald-600 underline underline-offset-2 decoration-dashed">Total Discounts</span>
              <span className="text-emerald-600">- ₹{totalDiscount.toLocaleString()}</span>
            </div>
            
            <div className="border-t pt-3 flex justify-between font-semibold">
              <span>Order Total</span>
              <span>₹{finalTotal.toLocaleString()}</span>
            </div>

            {/* Discount celebration banner */}
            {totalDiscount > 0 && (
              <div className="bg-emerald-100 dark:bg-emerald-900/30 rounded-xl p-3 flex items-center gap-2 justify-center">
                <span className="text-emerald-600">✨</span>
                <span className="text-sm text-emerald-700 dark:text-emerald-400 font-medium">
                  Yay! Your total discount is ₹{totalDiscount}
                </span>
              </div>
            )}
          </CollapsibleContent>
        </Collapsible>
      </div>

      {/* Fixed Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-background border-t px-4 py-3 flex items-center justify-between z-50">
        <div>
          <p className="text-xl font-bold">₹{finalTotal.toLocaleString()}</p>
          <button className="text-sm text-primary font-medium uppercase">View Price Details</button>
        </div>
        <Button
          onClick={handlePayment}
          disabled={loading || !paymentMethod}
          className="bg-[#9b1d54] hover:bg-[#8a1a4b] text-white px-8 py-6 text-base font-semibold rounded-lg"
        >
          {loading ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : null}
          Place Order
        </Button>
      </div>

      {/* UPI Payment Dialog */}
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
              Order ID: #{pendingOrderId?.slice(0, 8).toUpperCase()}
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
              </p>
              <div className="grid grid-cols-3 gap-3">
                {['phonepe', 'paytm', 'gpay', 'bhim', 'amazon', 'any'].map((app) => (
                  <Button
                    key={app}
                    variant="outline"
                    className="h-20 flex flex-col items-center justify-center gap-2 hover:shadow-md transition-all"
                    onClick={() => openUpiApp(app)}
                  >
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gray-400 to-gray-600 flex items-center justify-center">
                      <span className="text-white font-bold text-xs capitalize">{app.slice(0, 2)}</span>
                    </div>
                    <span className="text-xs font-medium capitalize">{app === 'gpay' ? 'GPay' : app}</span>
                  </Button>
                ))}
              </div>
            </div>

            {/* UPI ID Copy */}
            <div className="flex items-center gap-2 p-3 bg-secondary rounded-lg">
              <span className="text-sm flex-1 truncate">{getUpiId()}</span>
              <Button variant="ghost" size="sm" onClick={copyUpiId}>
                {upiCopied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>

            {/* UTR Input */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                {paymentMethod === 'razorpay_upi' ? 'Enter 20-digit TR ID' : 'Enter 12-digit UTR Number'}
              </Label>
              <Input
                value={utrNumber}
                onChange={(e) => setUtrNumber(e.target.value.replace(/\D/g, '').slice(0, paymentMethod === 'razorpay_upi' ? 20 : 12))}
                placeholder={paymentMethod === 'razorpay_upi' ? 'Enter TR ID' : 'Enter UTR Number'}
                className="text-center text-lg tracking-widest"
              />
              <p className="text-xs text-muted-foreground text-center">
                {utrNumber.length}/{paymentMethod === 'razorpay_upi' ? 20 : 12} digits
              </p>
            </div>

            <Button 
              onClick={handleUtrSubmit} 
              className="w-full" 
              disabled={loading || utrNumber.length !== (paymentMethod === 'razorpay_upi' ? 20 : 12)}
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Submit Payment
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Success Dialog */}
      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center text-xl">Payment Submitted!</DialogTitle>
            <DialogDescription className="text-center">
              Your payment is being verified. You'll receive confirmation soon.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-center py-4">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
              <Check className="h-8 w-8 text-green-600" />
            </div>
          </div>
          <Button onClick={() => navigate('/orders')} className="w-full">
            View My Orders
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
