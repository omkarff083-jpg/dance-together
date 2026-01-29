import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Heart, Minus, Plus, ShoppingBag, Star, Truck, Shield, RefreshCw, MessageSquare, User, GitCompare, Share2 } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';
import { Layout } from '@/components/layout/Layout';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { useCompare } from '@/contexts/CompareContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { PincodeChecker } from '@/components/checkout/PincodeChecker';
import { SwipeableImageGallery } from '@/components/products/SwipeableImageGallery';
import { useRecentlyViewed } from '@/hooks/useRecentlyViewed';

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
  user_id: string;
  user_name: string | null;
}

// Star Rating Component
function StarRating({ 
  rating, 
  onRatingChange, 
  readonly = false, 
  size = 'md' 
}: { 
  rating: number; 
  onRatingChange?: (rating: number) => void; 
  readonly?: boolean;
  size?: 'sm' | 'md' | 'lg';
}) {
  const [hoverRating, setHoverRating] = useState(0);
  
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6',
  };

  return (
    <div className="flex">
      {Array.from({ length: 5 }).map((_, i) => {
        const starValue = i + 1;
        const isFilled = (hoverRating || rating) >= starValue;
        
        return (
          <button
            key={i}
            type="button"
            disabled={readonly}
            className={`${readonly ? 'cursor-default' : 'cursor-pointer'} transition-transform ${!readonly && 'hover:scale-110'}`}
            onClick={() => !readonly && onRatingChange?.(starValue)}
            onMouseEnter={() => !readonly && setHoverRating(starValue)}
            onMouseLeave={() => !readonly && setHoverRating(0)}
          >
            <Star
              className={`${sizeClasses[size]} ${
                isFilled ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'
              }`}
            />
          </button>
        );
      })}
    </div>
  );
}

// Rating Distribution Component
function RatingDistribution({ reviews }: { reviews: Review[] }) {
  const distribution = [5, 4, 3, 2, 1].map((star) => {
    const count = reviews.filter((r) => r.rating === star).length;
    const percentage = reviews.length > 0 ? (count / reviews.length) * 100 : 0;
    return { star, count, percentage };
  });

  return (
    <div className="space-y-2">
      {distribution.map(({ star, count, percentage }) => (
        <div key={star} className="flex items-center gap-2 text-sm">
          <span className="w-8">{star} ★</span>
          <Progress value={percentage} className="h-2 flex-1" />
          <span className="w-8 text-muted-foreground text-right">{count}</span>
        </div>
      ))}
    </div>
  );
}

export default function ProductDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToCart } = useCart();
  const { addToCompare, isInCompare } = useCompare();
  const { addToRecentlyViewed } = useRecentlyViewed();
  
  const [product, setProduct] = useState<Product | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [quantity, setQuantity] = useState(1);
  
  // Review form state
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [userReview, setUserReview] = useState<Review | null>(null);

  useEffect(() => {
    if (slug) {
      fetchProduct();
    }
  }, [slug]);

  useEffect(() => {
    if (user && product) {
      checkUserReview();
    }
  }, [user, product]);

  // Track recently viewed
  useEffect(() => {
    if (product) {
      addToRecentlyViewed({
        id: product.id,
        slug: product.slug,
        name: product.name,
        price: product.price,
        sale_price: product.sale_price,
        images: product.images,
      });
    }
  }, [product, addToRecentlyViewed]);

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

      // Fetch reviews with user profiles
      await fetchReviews(data.id);
    } catch (error) {
      console.error('Error fetching product:', error);
      navigate('/products');
    } finally {
      setLoading(false);
    }
  };

  const fetchReviews = async (productId: string) => {
    const { data: reviewsData } = await supabase
      .from('reviews')
      .select('id, rating, comment, created_at, user_id')
      .eq('product_id', productId)
      .order('created_at', { ascending: false });

    if (reviewsData) {
      const userIds = [...new Set(reviewsData.map(r => r.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', userIds);

      const profileMap = new Map(profiles?.map(p => [p.id, p.full_name]) || []);
      
      setReviews(reviewsData.map(r => ({
        ...r,
        user_name: profileMap.get(r.user_id) || null,
      })));
    }
  };

  const checkUserReview = async () => {
    if (!user || !product) return;
    
    const { data } = await supabase
      .from('reviews')
      .select('id, rating, comment, created_at, user_id')
      .eq('product_id', product.id)
      .eq('user_id', user.id)
      .maybeSingle();

    if (data) {
      setUserReview({ ...data, user_name: null });
      setReviewRating(data.rating);
      setReviewComment(data.comment || '');
    }
  };

  const handleSubmitReview = async () => {
    if (!user || !product) {
      toast.error('Please login to submit a review');
      return;
    }

    if (reviewRating === 0) {
      toast.error('Please select a rating');
      return;
    }

    setSubmittingReview(true);

    try {
      if (userReview) {
        const { error } = await supabase
          .from('reviews')
          .update({
            rating: reviewRating,
            comment: reviewComment.trim() || null,
          })
          .eq('id', userReview.id);

        if (error) throw error;
        toast.success('Review updated successfully!');
      } else {
        const { error } = await supabase
          .from('reviews')
          .insert({
            product_id: product.id,
            user_id: user.id,
            rating: reviewRating,
            comment: reviewComment.trim() || null,
          });

        if (error) throw error;
        toast.success('Review submitted successfully!');
      }

      await fetchReviews(product.id);
      await checkUserReview();
      setShowReviewForm(false);
    } catch (error) {
      console.error('Error submitting review:', error);
      toast.error('Failed to submit review');
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleDeleteReview = async () => {
    if (!userReview) return;

    try {
      const { error } = await supabase
        .from('reviews')
        .delete()
        .eq('id', userReview.id);

      if (error) throw error;
      
      toast.success('Review deleted');
      setUserReview(null);
      setReviewRating(0);
      setReviewComment('');
      if (product) await fetchReviews(product.id);
    } catch (error) {
      console.error('Error deleting review:', error);
      toast.error('Failed to delete review');
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

  const handleBuyNow = async () => {
    if (!product) return;
    
    if (product.sizes.length > 0 && !selectedSize) {
      toast.error('Please select a size');
      return;
    }
    if (product.colors.length > 0 && !selectedColor) {
      toast.error('Please select a color');
      return;
    }

    const buyNowData = {
      product_id: product.id,
      quantity,
      size: selectedSize || null,
      color: selectedColor || null,
      product: {
        id: product.id,
        name: product.name,
        price: product.price,
        sale_price: product.sale_price,
        images: product.images,
        stock: product.stock,
      },
    };
    
    sessionStorage.setItem('buyNowItem', JSON.stringify(buyNowData));
    navigate('/checkout?mode=buynow');
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

  const handleAddToCompare = () => {
    if (!product) return;
    addToCompare({
      id: product.id,
      name: product.name,
      slug: product.slug,
      price: product.price,
      sale_price: product.sale_price,
      images: product.images,
      description: product.description,
      category: product.category,
      sizes: product.sizes,
      colors: product.colors,
      stock: product.stock,
    });
  };

  const handleShare = async () => {
    try {
      await navigator.share({
        title: product?.name,
        url: window.location.href,
      });
    } catch {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied!');
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

  const canReview = !!user;

  return (
    <Layout>
      {/* Mobile Layout */}
      <div className="md:hidden pb-24">
        {/* Swipeable Image Gallery */}
        <SwipeableImageGallery 
          images={images} 
          productName={product.name}
          onImageChange={setSelectedImage}
        />

        {/* Product Info */}
        <div className="px-4 py-3 space-y-3">
          {product.category && (
            <p className="text-xs text-primary font-medium">{product.category.name}</p>
          )}
          
          <h1 className="text-lg font-semibold leading-tight">{product.name}</h1>
          
          {/* Rating */}
          {reviews.length > 0 && (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 bg-green-600 text-white px-2 py-0.5 rounded text-sm font-medium">
                {avgRating.toFixed(1)} <Star className="h-3 w-3 fill-current" />
              </div>
              <span className="text-sm text-muted-foreground">
                ({reviews.length} reviews)
              </span>
            </div>
          )}

          {/* Price */}
          <div className="flex items-center gap-3">
            <span className="text-2xl font-bold">₹{displayPrice.toLocaleString()}</span>
            {hasDiscount && (
              <>
                <span className="text-lg text-muted-foreground line-through">
                  ₹{product.price.toLocaleString()}
                </span>
                <Badge className="bg-green-600 text-white">{discountPercent}% OFF</Badge>
              </>
            )}
          </div>
        </div>

        <Separator />

        {/* Sizes */}
        {product.sizes.length > 0 && (
          <div className="px-4 py-3">
            <p className="text-sm font-medium mb-2">Select Size</p>
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
          <div className="px-4 py-3">
            <p className="text-sm font-medium mb-2">Select Color</p>
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
        <div className="px-4 py-3 flex items-center justify-between">
          <span className="text-sm font-medium">Quantity</span>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
            >
              <Minus className="h-4 w-4" />
            </Button>
            <span className="w-8 text-center font-medium">{quantity}</span>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <Separator />

        {/* Delivery Check */}
        <div className="px-4 py-3">
          <PincodeChecker onPincodeVerified={() => {}} />
        </div>

        <Separator />

        {/* Action Buttons */}
        <div className="px-4 py-3 flex gap-3">
          <Button 
            variant="outline" 
            size="icon"
            onClick={handleAddToWishlist}
          >
            <Heart className="h-5 w-5" />
          </Button>
          <Button 
            variant="outline" 
            size="icon"
            onClick={handleAddToCompare}
            className={isInCompare(product.id) ? 'bg-primary/10' : ''}
          >
            <GitCompare className="h-5 w-5" />
          </Button>
          <Button 
            variant="outline" 
            size="icon"
            onClick={handleShare}
          >
            <Share2 className="h-5 w-5" />
          </Button>
        </div>

        {/* Features */}
        <div className="px-4 py-4 grid grid-cols-3 gap-2">
          <div className="text-center">
            <Truck className="h-5 w-5 mx-auto text-primary mb-1" />
            <p className="text-xs text-muted-foreground">Free Shipping</p>
          </div>
          <div className="text-center">
            <Shield className="h-5 w-5 mx-auto text-primary mb-1" />
            <p className="text-xs text-muted-foreground">Secure Payment</p>
          </div>
          <div className="text-center">
            <RefreshCw className="h-5 w-5 mx-auto text-primary mb-1" />
            <p className="text-xs text-muted-foreground">Easy Returns</p>
          </div>
        </div>

        <Separator />

        {/* Description */}
        <div className="px-4 py-4">
          <h3 className="font-semibold mb-2">Product Details</h3>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">
            {product.description || 'No description available.'}
          </p>
        </div>

        {/* Reviews Section */}
        <Separator />
        <div className="px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Ratings & Reviews</h3>
            {canReview && !userReview && (
              <Button size="sm" variant="outline" onClick={() => setShowReviewForm(true)}>
                Rate Product
              </Button>
            )}
          </div>

          {/* Average Rating */}
          {reviews.length > 0 && (
            <div className="flex items-center gap-4 mb-4 p-3 bg-secondary/50 rounded-lg">
              <div className="text-center">
                <div className="text-3xl font-bold">{avgRating.toFixed(1)}</div>
                <StarRating rating={Math.round(avgRating)} readonly size="sm" />
                <p className="text-xs text-muted-foreground mt-1">{reviews.length} reviews</p>
              </div>
              <div className="flex-1">
                <RatingDistribution reviews={reviews} />
              </div>
            </div>
          )}

          {/* Review Form */}
          {showReviewForm && (
            <Card className="p-4 mb-4">
              <h4 className="font-medium mb-3">Write a Review</h4>
              <div className="space-y-3">
                <div>
                  <p className="text-sm mb-2">Your Rating</p>
                  <StarRating rating={reviewRating} onRatingChange={setReviewRating} size="lg" />
                </div>
                <Textarea
                  placeholder="Share your experience..."
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  rows={3}
                />
                <div className="flex gap-2">
                  <Button onClick={handleSubmitReview} disabled={submittingReview} size="sm">
                    {submittingReview ? 'Submitting...' : 'Submit Review'}
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setShowReviewForm(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {/* User's Review */}
          {userReview && (
            <Card className="p-4 mb-4 border-primary/30">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium">Your Review</p>
                <div className="flex gap-2">
                  <Button size="sm" variant="ghost" onClick={() => setShowReviewForm(true)}>
                    Edit
                  </Button>
                  <Button size="sm" variant="ghost" className="text-destructive" onClick={handleDeleteReview}>
                    Delete
                  </Button>
                </div>
              </div>
              <StarRating rating={userReview.rating} readonly size="sm" />
              {userReview.comment && (
                <p className="text-sm text-muted-foreground mt-2">{userReview.comment}</p>
              )}
            </Card>
          )}

          {/* Reviews List */}
          <div className="space-y-3">
            {reviews.filter(r => r.id !== userReview?.id).slice(0, 5).map((review) => (
              <div key={review.id} className="border-b pb-3 last:border-b-0">
                <div className="flex items-center gap-2 mb-1">
                  <div className="flex items-center gap-1 bg-green-600 text-white px-1.5 py-0.5 rounded text-xs font-medium">
                    {review.rating} <Star className="h-2.5 w-2.5 fill-current" />
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(review.created_at), 'MMM d, yyyy')}
                  </span>
                </div>
                {review.comment && (
                  <p className="text-sm text-muted-foreground">{review.comment}</p>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  — {review.user_name || 'Anonymous'}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Fixed Bottom Actions */}
        <div className="fixed bottom-14 left-0 right-0 bg-background border-t shadow-lg z-40">
          <div className="flex gap-3 p-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={handleAddToCart}
              disabled={product.stock === 0}
            >
              <ShoppingBag className="h-4 w-4 mr-2" />
              Add to Cart
            </Button>
            <Button
              className="flex-1"
              onClick={handleBuyNow}
              disabled={product.stock === 0}
            >
              Buy Now
            </Button>
          </div>
        </div>
      </div>

      {/* Desktop Layout */}
      <div className="hidden md:block container px-4 py-8">
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
                      selectedImage === index ? 'border-primary' : 'border-transparent'
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
            <div className="flex items-center gap-3">
              <StarRating rating={Math.round(avgRating)} readonly size="sm" />
              <span className="text-sm text-muted-foreground">
                {avgRating.toFixed(1)} ({reviews.length} reviews)
              </span>
            </div>

            {/* Price */}
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-3xl font-bold">₹{displayPrice.toLocaleString()}</span>
              {hasDiscount && (
                <>
                  <span className="text-xl text-muted-foreground line-through">
                    ₹{product.price.toLocaleString()}
                  </span>
                  <Badge className="bg-primary text-primary-foreground">-{discountPercent}%</Badge>
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
                <span className="w-10 text-center font-medium">{quantity}</span>
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
            <div className="flex flex-col gap-3">
              <div className="flex gap-4">
                <Button
                  size="lg"
                  className="flex-1"
                  onClick={handleAddToCart}
                  disabled={product.stock === 0}
                >
                  <ShoppingBag className="h-5 w-5 mr-2" />
                  {product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
                </Button>
                <Button size="lg" variant="outline" onClick={handleAddToWishlist}>
                  <Heart className="h-5 w-5" />
                </Button>
                <Button 
                  size="lg" 
                  variant="outline" 
                  onClick={handleAddToCompare}
                  className={isInCompare(product.id) ? 'bg-primary/10' : ''}
                >
                  <GitCompare className="h-5 w-5" />
                </Button>
              </div>
              <Button
                size="lg"
                variant="secondary"
                className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
                onClick={handleBuyNow}
                disabled={product.stock === 0}
              >
                Buy Now
              </Button>
            </div>

            {/* Delivery Check */}
            <Card className="p-4">
              <PincodeChecker onPincodeVerified={() => {}} />
            </Card>

            {/* Features */}
            <div className="grid grid-cols-3 gap-4 pt-4">
              <div className="text-center">
                <Truck className="h-6 w-6 mx-auto text-primary mb-2" />
                <p className="text-xs text-muted-foreground">Free Shipping</p>
              </div>
              <div className="text-center">
                <Shield className="h-6 w-6 mx-auto text-primary mb-2" />
                <p className="text-xs text-muted-foreground">Secure Payment</p>
              </div>
              <div className="text-center">
                <RefreshCw className="h-6 w-6 mx-auto text-primary mb-2" />
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
              <div className="grid lg:grid-cols-3 gap-8">
                <Card className="p-6 h-fit">
                  <div className="text-center mb-6">
                    <div className="text-5xl font-bold">{avgRating.toFixed(1)}</div>
                    <StarRating rating={Math.round(avgRating)} readonly size="md" />
                    <p className="text-sm text-muted-foreground mt-2">
                      Based on {reviews.length} {reviews.length === 1 ? 'review' : 'reviews'}
                    </p>
                  </div>
                  
                  <Separator className="my-4" />
                  
                  <RatingDistribution reviews={reviews} />
                  
                  <Separator className="my-4" />
                  
                  {user ? (
                    <div>
                      {userReview ? (
                        <div className="space-y-3">
                          <p className="text-sm font-medium">Your Review</p>
                          <div className="p-3 bg-secondary rounded-lg">
                            <StarRating rating={userReview.rating} readonly size="sm" />
                            {userReview.comment && (
                              <p className="text-sm text-muted-foreground mt-2">{userReview.comment}</p>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" onClick={() => setShowReviewForm(true)}>
                              Edit Review
                            </Button>
                            <Button size="sm" variant="ghost" className="text-destructive" onClick={handleDeleteReview}>
                              Delete
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <Button className="w-full" onClick={() => setShowReviewForm(true)}>
                          <MessageSquare className="h-4 w-4 mr-2" />
                          Write a Review
                        </Button>
                      )}
                      
                      {showReviewForm && !userReview && (
                        <div className="mt-4 space-y-4">
                          <div>
                            <p className="text-sm font-medium mb-2">Your Rating</p>
                            <StarRating rating={reviewRating} onRatingChange={setReviewRating} size="lg" />
                          </div>
                          <div>
                            <p className="text-sm font-medium mb-2">Your Review (Optional)</p>
                            <Textarea
                              placeholder="Share your experience with this product..."
                              value={reviewComment}
                              onChange={(e) => setReviewComment(e.target.value)}
                              rows={4}
                            />
                          </div>
                          <div className="flex gap-2">
                            <Button onClick={handleSubmitReview} disabled={submittingReview}>
                              {submittingReview ? 'Submitting...' : 'Submit Review'}
                            </Button>
                            <Button variant="outline" onClick={() => setShowReviewForm(false)}>
                              Cancel
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <Button variant="outline" className="w-full" onClick={() => navigate('/auth')}>
                      Login to Review
                    </Button>
                  )}
                </Card>

                <div className="lg:col-span-2 space-y-4">
                  {reviews.length === 0 ? (
                    <Card className="p-8 text-center">
                      <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <h3 className="font-semibold mb-2">No Reviews Yet</h3>
                      <p className="text-sm text-muted-foreground">
                        Be the first to review this product!
                      </p>
                    </Card>
                  ) : (
                    reviews.map((review) => (
                      <Card key={review.id} className="p-4">
                        <div className="flex items-start gap-4">
                          <Avatar>
                            <AvatarFallback>
                              {review.user_name?.[0]?.toUpperCase() || <User className="h-4 w-4" />}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium">{review.user_name || 'Anonymous'}</span>
                              <span className="text-xs text-muted-foreground">
                                {format(new Date(review.created_at), 'MMM d, yyyy')}
                              </span>
                            </div>
                            <StarRating rating={review.rating} readonly size="sm" />
                            {review.comment && (
                              <p className="text-muted-foreground mt-2">{review.comment}</p>
                            )}
                          </div>
                        </div>
                      </Card>
                    ))
                  )}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </Layout>
  );
}
