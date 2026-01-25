-- Add Razorpay UPI settings columns to payment_settings
ALTER TABLE public.payment_settings 
ADD COLUMN IF NOT EXISTS razorpay_upi_enabled boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS razorpay_upi_id text DEFAULT NULL;