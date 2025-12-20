-- Add razorpay_key_secret column to payment_settings
ALTER TABLE public.payment_settings 
ADD COLUMN IF NOT EXISTS razorpay_key_secret text;

-- Update RLS to ensure only admins can access payment settings (already exists, but making sure)