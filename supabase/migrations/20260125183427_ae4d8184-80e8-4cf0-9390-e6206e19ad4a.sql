-- Add custom display names for all payment gateways
ALTER TABLE public.payment_settings
ADD COLUMN IF NOT EXISTS razorpay_display_name text DEFAULT 'Pay Online (Razorpay)',
ADD COLUMN IF NOT EXISTS razorpay_display_description text DEFAULT 'Cards, UPI, Net Banking, Wallets',
ADD COLUMN IF NOT EXISTS paytm_display_name text DEFAULT 'Paytm',
ADD COLUMN IF NOT EXISTS paytm_display_description text DEFAULT 'Pay via Paytm Wallet, UPI, Cards',
ADD COLUMN IF NOT EXISTS cashfree_display_name text DEFAULT 'Cashfree',
ADD COLUMN IF NOT EXISTS cashfree_display_description text DEFAULT 'Pay via Cards, UPI, Netbanking',
ADD COLUMN IF NOT EXISTS bharatpay_display_name text DEFAULT 'BharatPay',
ADD COLUMN IF NOT EXISTS bharatpay_display_description text DEFAULT 'Pay via UPI & Cards',
ADD COLUMN IF NOT EXISTS payyou_display_name text DEFAULT 'PayYou',
ADD COLUMN IF NOT EXISTS payyou_display_description text DEFAULT 'Quick & Secure Payment',
ADD COLUMN IF NOT EXISTS phonepe_display_name text DEFAULT 'PhonePe',
ADD COLUMN IF NOT EXISTS phonepe_display_description text DEFAULT 'Pay via PhonePe UPI',
ADD COLUMN IF NOT EXISTS cod_display_name text DEFAULT 'Cash on Delivery',
ADD COLUMN IF NOT EXISTS cod_display_description text DEFAULT 'Pay when you receive your order';