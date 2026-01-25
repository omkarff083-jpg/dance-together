-- Add global COD enabled setting to payment_settings
ALTER TABLE public.payment_settings 
ADD COLUMN IF NOT EXISTS cod_enabled boolean DEFAULT true;

-- Add per-product COD available option to products
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS cod_available boolean DEFAULT true;