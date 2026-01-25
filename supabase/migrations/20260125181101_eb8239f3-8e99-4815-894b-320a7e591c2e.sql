-- Add IP address column to orders table for tracking
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS customer_ip text;

-- Create index for IP address queries
CREATE INDEX IF NOT EXISTS idx_orders_customer_ip ON public.orders(customer_ip);