-- Create table for serviceable pincodes
CREATE TABLE public.serviceable_pincodes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pincode TEXT NOT NULL UNIQUE,
  city TEXT,
  state TEXT,
  delivery_days INTEGER DEFAULT 5,
  cod_available BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.serviceable_pincodes ENABLE ROW LEVEL SECURITY;

-- Anyone can check pincodes (for delivery availability)
CREATE POLICY "Anyone can view serviceable pincodes"
ON public.serviceable_pincodes
FOR SELECT
USING (is_active = true);

-- Admins can manage pincodes
CREATE POLICY "Admins can manage pincodes"
ON public.serviceable_pincodes
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Insert some sample pincodes for major cities
INSERT INTO public.serviceable_pincodes (pincode, city, state, delivery_days, cod_available) VALUES
('110001', 'New Delhi', 'Delhi', 3, true),
('110002', 'New Delhi', 'Delhi', 3, true),
('400001', 'Mumbai', 'Maharashtra', 3, true),
('400002', 'Mumbai', 'Maharashtra', 3, true),
('560001', 'Bangalore', 'Karnataka', 4, true),
('560002', 'Bangalore', 'Karnataka', 4, true),
('500001', 'Hyderabad', 'Telangana', 4, true),
('600001', 'Chennai', 'Tamil Nadu', 4, true),
('700001', 'Kolkata', 'West Bengal', 5, true),
('411001', 'Pune', 'Maharashtra', 4, true),
('380001', 'Ahmedabad', 'Gujarat', 5, true),
('302001', 'Jaipur', 'Rajasthan', 5, true),
('226001', 'Lucknow', 'Uttar Pradesh', 5, true),
('682001', 'Kochi', 'Kerala', 5, true);