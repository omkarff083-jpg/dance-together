-- Add per-gateway shipping charge columns to payment_settings
ALTER TABLE public.payment_settings 
ADD COLUMN IF NOT EXISTS razorpay_shipping_charge numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS upi_shipping_charge numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS razorpay_upi_shipping_charge numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS paytm_shipping_charge numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS cashfree_shipping_charge numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS bharatpay_shipping_charge numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS payyou_shipping_charge numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS phonepe_shipping_charge numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS cod_shipping_charge numeric DEFAULT 0;

-- Add shipping_charge column to products table for per-product shipping
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS shipping_charge numeric DEFAULT NULL;