-- Add custom display names for UPI payment methods
ALTER TABLE public.payment_settings
ADD COLUMN IF NOT EXISTS upi_display_name text DEFAULT 'Pay via UPI',
ADD COLUMN IF NOT EXISTS upi_display_description text DEFAULT 'Scan QR code or pay to UPI ID',
ADD COLUMN IF NOT EXISTS razorpay_upi_display_name text DEFAULT 'Razorpay UPI',
ADD COLUMN IF NOT EXISTS razorpay_upi_display_description text DEFAULT 'Pay via QR & Enter TR ID';