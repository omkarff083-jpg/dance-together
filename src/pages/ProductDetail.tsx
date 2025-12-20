import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Heart, Minus, Plus, ShoppingBag, Star, Truck, Shield, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Layout } from '@/components/layout/Layout';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Product {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  sale_price: number | null;
  images: string[];
  sizes: string[];
  colors: string[];
  stock: number;
  category: { name: string } | null;
}

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  profiles: { full_name: string | null } | null;
}

export default function ProductDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToCart } = useCart();
  
  const [product, setProduct] = useState<Product | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    if (slug) {
      fetchProduct();
    }
  }, [slug]);

  const fetchProduct = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*, category:categories(name)')
        .eq('slug', slug)
        .eq('active', true)
        .single();

      if (error) throw error;
      setProduct(data as Product);

      if (data?.sizes?.length > 0) {
        setSelectedSize(data.sizes[0]);
      }
      if (data?.colors?.length > 0) {
        setSelectedColor(data.colors[0]);
      }

      // Fetch reviews
      const { data: reviewsData } = await supabase
        .from('reviews')
        .select('id, rating, comment, created_at')
        .eq('product_id', data.id)
        .order('created_at', { ascending: false });

      if (reviewsData) {
        setReviews(reviewsData.map(r => ({ ...r, profiles: null })) as Review[]);
      }
    } catch (error) {
      console.error('Error fetching product:', error);
      navigate('/products');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async () => {
    if (!product) return;
    
    if (product.sizes.length > 0 && !selectedSize) {
      toast.error('Please select a size');
      return;
    }
    if (product.colors.length > 0 && !selectedColor) {
      toast.error('Please select a color');
      return;
    }

    await addToCart(product.id, quantity, selectedSize, selectedColor);
  };

  const handleAddToWishlist = async () => {
    if (!user) {
      toast.error('Please login to add to wishlist');
      return;
    }
    if (!product) return;

    try {
      const { error } = await supabase
        .from('wishlist')
        .insert({ user_id: user.id, product_id: product.id });

      if (error) {
        if (error.code === '23505') {
          toast.info('Already in wishlist');
        } else {
          throw error;
        }
      } else {
        toast.success('Added to wishlist');
      }
    } catch (error) {
      console.error('Error adding to wishlist:', error);
      toast.error('Failed to add to wishlist');
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="container py-8">
          <div className="grid md:grid-cols-2 gap-8">
            <div className="aspect-square bg-muted animate-pulse rounded-lg" />
            <div className="space-y-4">
              <div className="h-8 bg-muted animate-pulse rounded w-3/4" />
              <div className="h-6 bg-muted animate-pulse rounded w-1/4" />
              <div className="h-24 bg-muted animate-pulse rounded" />
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!product) {
    return (
      <Layout>
        <div className="container py-16 text-center">
          <h1 className="text-2xl font-bold">Product not found</h1>
        </div>
      </Layout>
    );
  }

  const displayPrice = product.sale_price || product.price;
  const hasDiscount = product.sale_price && product.sale_price < product.price;
  const discountPercent = hasDiscount
    ? Math.round(((product.price - product.sale_price!) / product.price) * 100)
    : 0;

  const avgRating = reviews.length > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 0;

  const images = product.images.length > 0
    ? product.images
    : ['https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800'];

  return (
    <Layout>
      <div className="container py-8">
        <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
          {/* Images */}
          <div className="space-y-4">
            <div className="aspect-square overflow-hidden rounded-lg bg-secondary">
              <img
                src={images[selectedImage]}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            </div>
            {images.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`aspect-square overflow-hidden rounded-lg border-2 transition-colors ${
                      selectedImage === index ? 'border-accent' : 'border-transparent'
                    }`}
                  >
                    <img src={image} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Details */}
          <div className="space-y-6">
            {product.category && (
              <p className="text-sm text-muted-foreground uppercase tracking-wider">
                {product.category.name}
              </p>
            )}

            <h1 className="font-display text-3xl font-bold">{product.name}</h1>

            {/* Rating */}
            {reviews.length > 0 && (
              <div className="flex items-center gap-2">
                <div className="flex">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`h-4 w-4 ${i < Math.round(avgRating) ? 'fill-accent text-accent' : 'text-muted'}`}
                    />
                  ))}
                </div>
                <span className="text-sm text-muted-foreground">
                  ({reviews.length} reviews)
                </span>
              </div>
            )}

            {/* Price */}
            <div className="flex items-center gap-3">
              <span className="text-3xl font-bold">₹{displayPrice.toLocaleString()}</span>
              {hasDiscount && (
                <>
                  <span className="text-xl text-muted-foreground line-through">
                    ₹{product.price.toLocaleString()}
                  </span>
                  <Badge className="bg-accent text-accent-foreground">-{discountPercent}%</Badge>
                </>
              )}
            </div>

            <Separator />

            {/* Sizes */}
            {product.sizes.length > 0 && (
              <div className="space-y-3">
                <label className="text-sm font-medium">Size</label>
                <div className="flex flex-wrap gap-2">
                  {product.sizes.map((size) => (
                    <Button
                      key={size}
                      variant={selectedSize === size ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSelectedSize(size)}
                    >
                      {size}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Colors */}
            {product.colors.length > 0 && (
              <div className="space-y-3">
                <label className="text-sm font-medium">Color</label>
                <div className="flex flex-wrap gap-2">
                  {product.colors.map((color) => (
                    <Button
                      key={color}
                      variant={selectedColor === color ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSelectedColor(color)}
                    >
                      {color}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity */}
            <div className="space-y-3">
              <label className="text-sm font-medium">Quantity</label>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="w-12 text-center font-medium">{quantity}</span>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                >
                  <Plus className="h-4 w-4" />
                </Button>
                <span className="text-sm text-muted-foreground">
                  {product.stock} available
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-4">
              <Button
                size="lg"
                className="flex-1 bg-accent hover:bg-accent/90 text-accent-foreground"
                onClick={handleAddToCart}
                disabled={product.stock === 0}
              >
                <ShoppingBag className="h-5 w-5 mr-2" />
                {product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
              </Button>
              <Button size="lg" variant="outline" onClick={handleAddToWishlist}>
                <Heart className="h-5 w-5" />
              </Button>
            </div>

            {/* Features */}
            <div className="grid grid-cols-3 gap-4 pt-4">
              <div className="text-center">
                <Truck className="h-6 w-6 mx-auto text-accent mb-2" />
                <p className="text-xs text-muted-foreground">Free Shipping</p>
              </div>
              <div className="text-center">
                <Shield className="h-6 w-6 mx-auto text-accent mb-2" />
                <p className="text-xs text-muted-foreground">Secure Payment</p>
              </div>
              <div className="text-center">
                <RefreshCw className="h-6 w-6 mx-auto text-accent mb-2" />
                <p className="text-xs text-muted-foreground">Easy Returns</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-12">
          <Tabs defaultValue="description">
            <TabsList>
              <TabsTrigger value="description">Description</TabsTrigger>
              <TabsTrigger value="reviews">Reviews ({reviews.length})</TabsTrigger>
            </TabsList>
            <TabsContent value="description" className="mt-6">
              <p className="text-muted-foreground whitespace-pre-wrap">
                {product.description || 'No description available.'}
              </p>
            </TabsContent>
            <TabsContent value="reviews" className="mt-6">
              {reviews.length === 0 ? (
                <p className="text-muted-foreground">No reviews yet.</p>
              ) : (
                <div className="space-y-6">
                  {reviews.map((review) => (
                    <div key={review.id} className="border-b pb-6">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="flex">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              className={`h-4 w-4 ${i < review.rating ? 'fill-accent text-accent' : 'text-muted'}`}
                            />
                          ))}
                        </div>
                        <span className="font-medium">
                          {review.profiles?.full_name || 'Anonymous'}
                        </span>
                      </div>
                      {review.comment && <p className="text-muted-foreground">{review.comment}</p>}
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </Layout>
  );
}
