import { Link } from 'react-router-dom';
import { Heart, ShoppingBag, Eye } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  sale_price: number | null;
  images: string[];
  category?: { name: string } | null;
}

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const { addToCart } = useCart();
  const { user } = useAuth();

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    await addToCart(product.id, 1);
  };

  const handleAddToWishlist = async (e: React.MouseEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error('Please login to add to wishlist');
      return;
    }

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

  const displayPrice = product.sale_price || product.price;
  const hasDiscount = product.sale_price && product.sale_price < product.price;
  const discountPercent = hasDiscount
    ? Math.round(((product.price - product.sale_price!) / product.price) * 100)
    : 0;

  const imageUrl = product.images?.[0] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400';

  return (
    <Card className="stagger-item group overflow-hidden border-0 bg-card shadow-elegant hover-lift rounded-xl">
      <Link to={`/product/${product.slug}`}>
        <div className="relative aspect-[3/4] overflow-hidden bg-secondary/50">
          <img
            src={imageUrl}
            alt={product.name}
            className="w-full h-full object-cover img-zoom"
          />
          
          {/* Gradient overlay on hover */}
          <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          
          {hasDiscount && (
            <Badge className="absolute top-4 left-4 bg-accent text-accent-foreground font-sans text-xs px-3 py-1 rounded-full shadow-lg">
              -{discountPercent}%
            </Badge>
          )}

          {/* Action buttons */}
          <div className="absolute top-4 right-4 flex flex-col gap-2">
            <Button
              size="icon"
              variant="secondary"
              className="h-10 w-10 rounded-full shadow-elegant bg-background/90 backdrop-blur-sm opacity-0 translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 hover:bg-accent hover:text-accent-foreground"
              onClick={handleAddToWishlist}
            >
              <Heart className="h-4 w-4" />
            </Button>
            <Button
              size="icon"
              variant="secondary"
              className="h-10 w-10 rounded-full shadow-elegant bg-background/90 backdrop-blur-sm opacity-0 translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 delay-75 hover:bg-accent hover:text-accent-foreground"
              onClick={handleAddToCart}
            >
              <ShoppingBag className="h-4 w-4" />
            </Button>
          </div>

          {/* Quick view button */}
          <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
            <Button 
              variant="secondary" 
              className="w-full bg-background/95 backdrop-blur-sm hover:bg-background shadow-lg rounded-full btn-shine"
            >
              <Eye className="h-4 w-4 mr-2" />
              Quick View
            </Button>
          </div>
        </div>

        <CardContent className="p-5">
          {product.category && (
            <p className="text-xs text-muted-foreground uppercase tracking-widest mb-2 font-medium">
              {product.category.name}
            </p>
          )}
          <h3 className="font-display text-lg font-semibold line-clamp-2 mb-3 group-hover:text-accent transition-colors duration-300">
            {product.name}
          </h3>
          <div className="flex items-center gap-3">
            <span className="font-sans font-semibold text-lg">₹{displayPrice.toLocaleString()}</span>
            {hasDiscount && (
              <span className="text-sm text-muted-foreground line-through">
                ₹{product.price.toLocaleString()}
              </span>
            )}
          </div>
        </CardContent>
      </Link>
    </Card>
  );
}
