-- Add new payment gateway columns to payment_settings table

-- Paytm Merchant
ALTER TABLE public.payment_settings 
ADD COLUMN IF NOT EXISTS paytm_enabled boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS paytm_merchant_id text,
ADD COLUMN IF NOT EXISTS paytm_merchant_key text;

-- Cashfree
ALTER TABLE public.payment_settings 
ADD COLUMN IF NOT EXISTS cashfree_enabled boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS cashfree_app_id text,
ADD COLUMN IF NOT EXISTS cashfree_secret_key text;

-- BharatPay Merchant
ALTER TABLE public.payment_settings 
ADD COLUMN IF NOT EXISTS bharatpay_enabled boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS bharatpay_merchant_id text,
ADD COLUMN IF NOT EXISTS bharatpay_api_key text;

-- PayYou Biz
ALTER TABLE public.payment_settings 
ADD COLUMN IF NOT EXISTS payyou_enabled boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS payyou_merchant_id text,
ADD COLUMN IF NOT EXISTS payyou_api_key text;

-- PhonePe Merchant
ALTER TABLE public.payment_settings 
ADD COLUMN IF NOT EXISTS phonepe_enabled boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS phonepe_merchant_id text,
ADD COLUMN IF NOT EXISTS phonepe_salt_key text,
ADD COLUMN IF NOT EXISTS phonepe_salt_index text;