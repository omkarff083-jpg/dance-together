-- =====================================================
-- COMPLETE DATABASE SCHEMA AND DATA FOR E-COMMERCE STORE
-- Run this SQL in your new Supabase project
-- =====================================================

-- =====================================================
-- PART 1: ENUMS
-- =====================================================
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- =====================================================
-- PART 2: TABLES
-- =====================================================

-- Categories Table
CREATE TABLE public.categories (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Products Table
CREATE TABLE public.products (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    price NUMERIC NOT NULL,
    sale_price NUMERIC,
    category_id UUID REFERENCES public.categories(id),
    images TEXT[] DEFAULT '{}'::text[],
    sizes TEXT[] DEFAULT '{}'::text[],
    colors TEXT[] DEFAULT '{}'::text[],
    stock INTEGER NOT NULL DEFAULT 0,
    featured BOOLEAN DEFAULT false,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Profiles Table
CREATE TABLE public.profiles (
    id UUID NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    full_name TEXT,
    phone TEXT,
    address TEXT,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- User Roles Table
CREATE TABLE public.user_roles (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role app_role NOT NULL DEFAULT 'user'::app_role,
    UNIQUE(user_id, role)
);

-- Cart Table
CREATE TABLE public.cart (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL DEFAULT 1,
    size TEXT,
    color TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Wishlist Table
CREATE TABLE public.wishlist (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(user_id, product_id)
);

-- Orders Table
CREATE TABLE public.orders (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending',
    total_amount NUMERIC NOT NULL,
    shipping_address JSONB,
    payment_method TEXT,
    payment_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Order Items Table
CREATE TABLE public.order_items (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id),
    product_name TEXT NOT NULL,
    product_image TEXT,
    quantity INTEGER NOT NULL,
    price NUMERIC NOT NULL,
    size TEXT,
    color TEXT
);

-- Reviews Table
CREATE TABLE public.reviews (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Payment Settings Table
CREATE TABLE public.payment_settings (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    razorpay_enabled BOOLEAN DEFAULT false,
    razorpay_key_id TEXT,
    upi_enabled BOOLEAN DEFAULT true,
    upi_id TEXT,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- =====================================================
-- PART 3: FUNCTIONS
-- =====================================================

-- Check if user has a specific role
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data ->> 'full_name');
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  RETURN NEW;
END;
$$;

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- =====================================================
-- PART 4: TRIGGERS
-- =====================================================

-- Trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger for updating updated_at on products
CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Trigger for updating updated_at on profiles
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Trigger for updating updated_at on orders
CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- =====================================================
-- PART 5: ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_settings ENABLE ROW LEVEL SECURITY;

-- Categories Policies
CREATE POLICY "Anyone can view categories" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Admins can manage categories" ON public.categories FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Products Policies
CREATE POLICY "Anyone can view active products" ON public.products FOR SELECT USING (active = true);
CREATE POLICY "Admins can manage products" ON public.products FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Profiles Policies
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- User Roles Policies
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage roles" ON public.user_roles FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Cart Policies
CREATE POLICY "Users can view own cart" ON public.cart FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can add to cart" ON public.cart FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own cart" ON public.cart FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can remove from cart" ON public.cart FOR DELETE USING (auth.uid() = user_id);

-- Wishlist Policies
CREATE POLICY "Users can view own wishlist" ON public.wishlist FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can add to wishlist" ON public.wishlist FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can remove from wishlist" ON public.wishlist FOR DELETE USING (auth.uid() = user_id);

-- Orders Policies
CREATE POLICY "Users can view own orders" ON public.orders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all orders" ON public.orders FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Users can create orders" ON public.orders FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can update orders" ON public.orders FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));

-- Order Items Policies
CREATE POLICY "Users can view own order items" ON public.order_items FOR SELECT 
  USING (EXISTS (SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid()));
CREATE POLICY "Admins can view all order items" ON public.order_items FOR SELECT 
  USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Users can create order items" ON public.order_items FOR INSERT 
  WITH CHECK (EXISTS (SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid()));

-- Reviews Policies
CREATE POLICY "Anyone can view reviews" ON public.reviews FOR SELECT USING (true);
CREATE POLICY "Users can create reviews" ON public.reviews FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own reviews" ON public.reviews FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own reviews" ON public.reviews FOR DELETE USING (auth.uid() = user_id);

-- Payment Settings Policies
CREATE POLICY "Admins can view payment settings" ON public.payment_settings FOR SELECT 
  USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can manage payment settings" ON public.payment_settings FOR ALL 
  USING (has_role(auth.uid(), 'admin'::app_role));

-- =====================================================
-- PART 6: STORAGE BUCKET
-- =====================================================

-- Create storage bucket for product images
INSERT INTO storage.buckets (id, name, public) VALUES ('product-images', 'product-images', true);

-- Storage Policies
CREATE POLICY "Anyone can view product images" ON storage.objects FOR SELECT USING (bucket_id = 'product-images');
CREATE POLICY "Admins can upload product images" ON storage.objects FOR INSERT 
  WITH CHECK (bucket_id = 'product-images' AND has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update product images" ON storage.objects FOR UPDATE 
  USING (bucket_id = 'product-images' AND has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete product images" ON storage.objects FOR DELETE 
  USING (bucket_id = 'product-images' AND has_role(auth.uid(), 'admin'::app_role));

-- =====================================================
-- PART 7: SAMPLE DATA
-- =====================================================

-- Insert Categories
INSERT INTO public.categories (id, name, slug, description, image_url) VALUES
('877cac4f-c9a4-4ce7-8c06-ba2dd2bd92b5', 'Men''s Fashion', 'mens-fashion', 'Premium clothing and accessories for men', 'https://images.unsplash.com/photo-1617137968427-85924c800a22?w=600'),
('3a7ce8ea-a485-4756-ae5b-1037cee400ac', 'Women''s Fashion', 'womens-fashion', 'Elegant and stylish clothing for women', 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=600'),
('e15c9773-25c5-4b04-8365-24ea0ee54bdc', 'Accessories', 'accessories', 'Watches, bags, jewelry and more', 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600'),
('789e8832-9382-4b47-a46d-57592705b385', 'Footwear', 'footwear', 'Shoes, sneakers and sandals for all', 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600');

-- Insert Products
INSERT INTO public.products (id, name, slug, description, price, sale_price, category_id, images, sizes, colors, stock, featured, active) VALUES
('2b5b1874-3a52-4209-b98d-1e0b608389e3', 'Classic Cotton Shirt', 'classic-cotton-shirt', 'Premium cotton shirt with a modern slim fit. Perfect for formal and casual occasions.', 1999.00, 1499.00, '877cac4f-c9a4-4ce7-8c06-ba2dd2bd92b5', ARRAY['https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=600', 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=600'], ARRAY['S', 'M', 'L', 'XL', 'XXL'], ARRAY['White', 'Blue', 'Black'], 50, true, true),

('3c905e61-f72e-4c62-8474-9681caa4c82c', 'Slim Fit Chinos', 'slim-fit-chinos', 'Comfortable stretch chinos with a tailored look. Versatile for work or weekend.', 2499.00, NULL, '877cac4f-c9a4-4ce7-8c06-ba2dd2bd92b5', ARRAY['https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=600'], ARRAY['28', '30', '32', '34', '36'], ARRAY['Beige', 'Navy', 'Olive'], 35, true, true),

('6dfea0d0-ed3e-4d3f-bef3-f09d42c142b8', 'Premium Leather Jacket', 'premium-leather-jacket', 'Genuine leather jacket with quilted lining. Timeless style for every season.', 8999.00, 6999.00, '877cac4f-c9a4-4ce7-8c06-ba2dd2bd92b5', ARRAY['https://images.unsplash.com/photo-1551028719-00167b16eac5?w=600', 'https://images.unsplash.com/photo-1520975954732-35dd22299614?w=600'], ARRAY['M', 'L', 'XL'], ARRAY['Black', 'Brown'], 15, true, true),

('c664491b-b387-4b31-894b-2d364927c2e9', 'Floral Maxi Dress', 'floral-maxi-dress', 'Elegant floral print maxi dress with flowing silhouette. Perfect for summer occasions.', 3499.00, 2799.00, '3a7ce8ea-a485-4756-ae5b-1037cee400ac', ARRAY['https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=600'], ARRAY['XS', 'S', 'M', 'L', 'XL'], ARRAY['Floral Blue', 'Floral Pink'], 25, true, true),

('8191c9ab-275f-45b5-9bd8-232e58b20b27', 'Silk Blouse', 'silk-blouse', 'Luxurious silk blouse with delicate detailing. A wardrobe essential for sophisticated style.', 2999.00, NULL, '3a7ce8ea-a485-4756-ae5b-1037cee400ac', ARRAY['https://images.unsplash.com/photo-1564257631407-4deb1f99d992?w=600'], ARRAY['XS', 'S', 'M', 'L'], ARRAY['Cream', 'Blush', 'Black'], 40, true, true),

('9b1c0d5d-105a-4600-97fc-ed8290d7d85a', 'High-Waist Trousers', 'high-waist-trousers', 'Tailored high-waist trousers for a polished professional look.', 2799.00, 2299.00, '3a7ce8ea-a485-4756-ae5b-1037cee400ac', ARRAY['https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=600'], ARRAY['XS', 'S', 'M', 'L', 'XL'], ARRAY['Black', 'Navy', 'Camel'], 30, false, true),

('d287bad2-078d-4bd9-96cd-77385253b6dd', 'Luxury Chronograph Watch', 'luxury-chronograph-watch', 'Stainless steel chronograph watch with sapphire crystal. Swiss movement.', 12999.00, 9999.00, 'e15c9773-25c5-4b04-8365-24ea0ee54bdc', ARRAY['https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600', 'https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=600'], ARRAY['One Size'], ARRAY['Silver', 'Gold', 'Rose Gold'], 10, true, true),

('ecbeb905-c1d6-41c1-b48b-505cd7b88941', 'Leather Tote Bag', 'leather-tote-bag', 'Spacious genuine leather tote with multiple compartments. Perfect for work and travel.', 4999.00, NULL, 'e15c9773-25c5-4b04-8365-24ea0ee54bdc', ARRAY['https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=600'], ARRAY['One Size'], ARRAY['Tan', 'Black', 'Burgundy'], 20, true, true),

('ac16faba-bcfc-403a-bff1-8f1a51c7c43b', 'Designer Sunglasses', 'designer-sunglasses', 'UV protection sunglasses with polarized lenses. Italian craftsmanship.', 3499.00, 2499.00, 'e15c9773-25c5-4b04-8365-24ea0ee54bdc', ARRAY['https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=600'], ARRAY['One Size'], ARRAY['Black', 'Tortoise', 'Gold'], 45, false, true),

('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Running Sneakers', 'running-sneakers', 'Comfortable running sneakers with advanced cushioning technology.', 5999.00, 4499.00, '789e8832-9382-4b47-a46d-57592705b385', ARRAY['https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600'], ARRAY['6', '7', '8', '9', '10', '11'], ARRAY['White', 'Black', 'Grey'], 60, true, true),

('b2c3d4e5-f6a7-8901-bcde-f23456789012', 'Classic Oxford Shoes', 'classic-oxford-shoes', 'Handcrafted leather oxford shoes for the modern gentleman.', 7999.00, NULL, '789e8832-9382-4b47-a46d-57592705b385', ARRAY['https://images.unsplash.com/photo-1614252369475-531eba835eb1?w=600'], ARRAY['7', '8', '9', '10', '11'], ARRAY['Black', 'Brown', 'Tan'], 25, true, true),

('c3d4e5f6-a7b8-9012-cdef-345678901234', 'Block Heel Sandals', 'block-heel-sandals', 'Stylish block heel sandals for comfort and elegance.', 3299.00, 2699.00, '789e8832-9382-4b47-a46d-57592705b385', ARRAY['https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=600'], ARRAY['5', '6', '7', '8', '9'], ARRAY['Nude', 'Black', 'Red'], 35, false, true);

-- Insert Default Payment Settings
INSERT INTO public.payment_settings (id, razorpay_enabled, upi_enabled, upi_id) VALUES
('f4fed404-f7e3-422f-a394-e56a5c61e040', false, true, '');

-- =====================================================
-- END OF DATABASE SETUP
-- =====================================================
