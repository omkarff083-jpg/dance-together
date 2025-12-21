import { Link } from 'react-router-dom';
import { Heart, Star } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useState } from 'react';

interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  sale_price: number | null;
  images: string[];
  category?: { name: string } | null;
}

interface MeeshoProductCardProps {
  product: Product;
}

export function MeeshoProductCard({ product }: MeeshoProductCardProps) {
  const { user } = useAuth();
  const [isWishlisted, setIsWishlisted] = useState(false);

  const handleAddToWishlist = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!user) {
      toast.error('Please login to add to wishlist');
      return;
    }

    try {
      if (isWishlisted) {
        await supabase
          .from('wishlist')
          .delete()
          .eq('user_id', user.id)
          .eq('product_id', product.id);
        setIsWishlisted(false);
        toast.success('Removed from wishlist');
      } else {
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
          setIsWishlisted(true);
          toast.success('Added to wishlist');
        }
      }
    } catch (error) {
      console.error('Error toggling wishlist:', error);
      toast.error('Failed to update wishlist');
    }
  };

  const displayPrice = product.sale_price || product.price;
  const hasDiscount = product.sale_price && product.sale_price < product.price;
  const discountPercent = hasDiscount
    ? Math.round(((product.price - product.sale_price!) / product.price) * 100)
    : 0;

  const imageUrl = product.images?.[0] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400';
  
  // Random rating for demo (in production, fetch from reviews)
  const rating = (3.5 + Math.random() * 1.5).toFixed(1);
  const reviews = Math.floor(1000 + Math.random() * 50000);
  const codPrice = Math.round(displayPrice * 1.2);

  return (
    <Link 
      to={`/product/${product.slug}`}
      className="block bg-card rounded-lg overflow-hidden border border-border/50 hover:shadow-lg transition-shadow duration-200"
    >
      {/* Image Container */}
      <div className="relative aspect-[3/4] bg-secondary/30">
        <img
          src={imageUrl}
          alt={product.name}
          className="w-full h-full object-cover"
        />
        
        {/* Wishlist Button */}
        <button
          onClick={handleAddToWishlist}
          className="absolute top-2 right-2 w-8 h-8 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center shadow-sm hover:bg-background transition-colors"
        >
          <Heart 
            className={`h-4 w-4 ${isWishlisted ? 'fill-destructive text-destructive' : 'text-muted-foreground'}`} 
          />
        </button>

        {/* Product ID overlay */}
        <div className="absolute bottom-2 left-2">
          <span className="text-[10px] text-muted-foreground bg-background/60 px-1.5 py-0.5 rounded">
            s-{product.id.slice(0, 8)}
          </span>
        </div>
      </div>

      {/* Product Info */}
      <div className="p-3">
        <h3 className="text-sm font-medium text-foreground line-clamp-2 mb-2 leading-tight">
          {product.name}
        </h3>

        {/* Price Row */}
        <div className="flex items-center gap-2 mb-1">
          <span className="font-bold text-base text-foreground">₹{displayPrice.toLocaleString()}</span>
          {hasDiscount && (
            <>
              <span className="text-sm text-muted-foreground line-through">
                ₹{product.price.toLocaleString()}
              </span>
              <span className="text-sm text-success font-medium">
                {discountPercent}% off
              </span>
            </>
          )}
          <Badge variant="outline" className="ml-auto text-[10px] px-1.5 py-0.5 border-primary/30">
            UPI
          </Badge>
        </div>

        {/* COD Price */}
        <p className="text-xs text-muted-foreground mb-2">
          ₹{codPrice.toLocaleString()} with COD
        </p>

        {/* Free Delivery */}
        <p className="text-xs text-success font-medium mb-2">Free Delivery</p>

        {/* Rating */}
        <div className="flex items-center gap-1">
          <div className="flex items-center gap-1 bg-success/10 px-2 py-0.5 rounded-full">
            <span className="text-xs font-semibold text-success">{rating}</span>
            <Star className="h-3 w-3 fill-success text-success" />
          </div>
          <span className="text-xs text-muted-foreground">
            ({reviews.toLocaleString()})
          </span>
        </div>
      </div>
    </Link>
  );
}
