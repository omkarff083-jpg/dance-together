import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Heart, Minus, Plus, ShoppingBag, Star, Truck, Shield, RefreshCw, MessageSquare, User, ThumbsUp } from 'lucide-react';
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
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { PincodeChecker } from '@/components/checkout/PincodeChecker';

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
  const [hasPurchased, setHasPurchased] = useState(false);
  const [userReview, setUserReview] = useState<Review | null>(null);

  useEffect(() => {
    if (slug) {
      fetchProduct();
    }
  }, [slug]);

  useEffect(() => {
    if (user && product) {
      checkPurchaseHistory();
      checkUserReview();
    }
  }, [user, product]);

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
      // Fetch profile names for each review
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

  const checkPurchaseHistory = async () => {
    if (!user || !product) return;
    
    // Check if user has a delivered order containing this product
    const { data } = await supabase
      .from('order_items')
      .select('id, order:orders!inner(user_id, status)')
      .eq('product_id', product.id)
      .eq('order.user_id', user.id)
      .eq('order.status', 'delivered')
      .limit(1);

    setHasPurchased((data && data.length > 0) || false);
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
        // Update existing review
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
        // Create new review
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

      // Refresh reviews
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

    // Set buy now item and navigate to checkout
    const { setBuyNowItem } = await import('@/contexts/CartContext').then(m => {
      // We need to access the context properly
      return { setBuyNowItem: null };
    });
    
    // Use the cart context's setBuyNowItem
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
    
    // Store in sessionStorage for checkout to pick up
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

  // Allow any logged-in user to review (not just purchasers)
  const canReview = !!user;

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
              <StarRating rating={Math.round(avgRating)} readonly size="md" />
              <span className="text-sm text-muted-foreground">
                {avgRating.toFixed(1)} ({reviews.length} {reviews.length === 1 ? 'review' : 'reviews'})
              </span>
            </div>

            {/* Price */}
            <div className="flex items-center gap-3">
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
              <PincodeChecker
                onPincodeVerified={(info) => {
                  // Just for display, no need to store
                }}
              />
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
              <TabsTrigger value="reviews">
                Reviews ({reviews.length})
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="description" className="mt-6">
              <p className="text-muted-foreground whitespace-pre-wrap">
                {product.description || 'No description available.'}
              </p>
            </TabsContent>
            
            <TabsContent value="reviews" className="mt-6">
              <div className="grid lg:grid-cols-3 gap-8">
                {/* Reviews Summary */}
                <Card className="p-6 h-fit">
                  <div className="text-center mb-6">
                    <div className="text-5xl font-bold">{avgRating.toFixed(1)}</div>
                    <StarRating rating={Math.round(avgRating)} readonly size="lg" />
                    <p className="text-sm text-muted-foreground mt-2">
                      Based on {reviews.length} {reviews.length === 1 ? 'review' : 'reviews'}
                    </p>
                  </div>
                  
                  <Separator className="my-4" />
                  
                  <RatingDistribution reviews={reviews} />
                  
                  <Separator className="my-4" />
                  
                  {/* Write Review Button */}
                  {user ? (
                    <Button 
                      className="w-full" 
                      onClick={() => setShowReviewForm(!showReviewForm)}
                    >
                      <MessageSquare className="h-4 w-4 mr-2" />
                      {userReview ? 'Edit Your Review' : 'Write a Review'}
                    </Button>
                  ) : (
                    <Button className="w-full" variant="outline" asChild>
                      <a href="/auth">Login to Review</a>
                    </Button>
                  )}
                </Card>

                {/* Reviews List */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Review Form */}
                  {showReviewForm && (
                    <Card className="p-6">
                      <h3 className="font-semibold mb-4">
                        {userReview ? 'Edit Your Review' : 'Write a Review'}
                      </h3>
                      
                      <div className="space-y-4">
                        <div>
                          <label className="text-sm font-medium mb-2 block">Your Rating</label>
                          <StarRating 
                            rating={reviewRating} 
                            onRatingChange={setReviewRating}
                            size="lg"
                          />
                        </div>
                        
                        <div>
                          <label className="text-sm font-medium mb-2 block">Your Review (Optional)</label>
                          <Textarea
                            value={reviewComment}
                            onChange={(e) => setReviewComment(e.target.value)}
                            placeholder="Share your experience with this product..."
                            rows={4}
                          />
                        </div>
                        
                        <div className="flex gap-2">
                          <Button 
                            onClick={handleSubmitReview}
                            disabled={submittingReview || reviewRating === 0}
                          >
                            {submittingReview ? 'Submitting...' : userReview ? 'Update Review' : 'Submit Review'}
                          </Button>
                          <Button 
                            variant="outline" 
                            onClick={() => setShowReviewForm(false)}
                          >
                            Cancel
                          </Button>
                          {userReview && (
                            <Button 
                              variant="destructive" 
                              onClick={handleDeleteReview}
                            >
                              Delete
                            </Button>
                          )}
                        </div>
                      </div>
                    </Card>
                  )}

                  {/* Reviews */}
                  {reviews.length === 0 ? (
                    <Card className="p-8 text-center">
                      <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <h3 className="font-semibold mb-2">No Reviews Yet</h3>
                      <p className="text-muted-foreground">
                        Be the first to review this product!
                      </p>
                    </Card>
                  ) : (
                    reviews.map((review) => (
                      <Card key={review.id} className="p-6">
                        <div className="flex items-start gap-4">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback>
                              {review.user_name?.[0]?.toUpperCase() || <User className="h-5 w-5" />}
                            </AvatarFallback>
                          </Avatar>
                          
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-medium">
                                {review.user_name || 'Anonymous'}
                                {review.user_id === user?.id && (
                                  <Badge variant="secondary" className="ml-2">You</Badge>
                                )}
                              </span>
                              <span className="text-sm text-muted-foreground">
                                {format(new Date(review.created_at), 'dd MMM yyyy')}
                              </span>
                            </div>
                            
                            <StarRating rating={review.rating} readonly size="sm" />
                            
                            {review.comment && (
                              <p className="mt-3 text-muted-foreground">{review.comment}</p>
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