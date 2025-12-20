import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Heart, ShoppingBag, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Layout } from '@/components/layout/Layout';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface WishlistItem {
  id: string;
  product: {
    id: string;
    name: string;
    slug: string;
    price: number;
    sale_price: number | null;
    images: string[];
  };
}

export default function Wishlist() {
  const { user } = useAuth();
  const { addToCart } = useCart();
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchWishlist();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchWishlist = async () => {
    try {
      const { data, error } = await supabase
        .from('wishlist')
        .select(`
          id,
          product:products(id, name, slug, price, sale_price, images)
        `)
        .eq('user_id', user!.id);

      if (error) throw error;
      
      const formattedItems = data?.map(item => ({
        id: item.id,
        product: item.product as WishlistItem['product']
      })).filter(item => item.product) || [];
      
      setItems(formattedItems);
    } catch (error) {
      console.error('Error fetching wishlist:', error);
    } finally {
      setLoading(false);
    }
  };

  const removeFromWishlist = async (itemId: string) => {
    try {
      const { error } = await supabase
        .from('wishlist')
        .delete()
        .eq('id', itemId);

      if (error) throw error;
      
      setItems(items.filter(item => item.id !== itemId));
      toast.success('Removed from wishlist');
    } catch (error) {
      console.error('Error removing from wishlist:', error);
      toast.error('Failed to remove');
    }
  };

  const moveToCart = async (item: WishlistItem) => {
    await addToCart(item.product.id, 1);
    await removeFromWishlist(item.id);
  };

  if (!user) {
    return (
      <Layout>
        <div className="container py-16 text-center">
          <Heart className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h1 className="font-display text-2xl font-bold mb-4">Your Wishlist</h1>
          <p className="text-muted-foreground mb-6">Please login to view your wishlist</p>
          <Button asChild>
            <Link to="/auth">Login</Link>
          </Button>
        </div>
      </Layout>
    );
  }

  if (loading) {
    return (
      <Layout>
        <div className="container py-8">
          <h1 className="font-display text-3xl font-bold mb-8">My Wishlist</h1>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="aspect-[3/4] bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        </div>
      </Layout>
    );
  }

  if (items.length === 0) {
    return (
      <Layout>
        <div className="container py-16 text-center">
          <Heart className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h1 className="font-display text-2xl font-bold mb-4">Your Wishlist is Empty</h1>
          <p className="text-muted-foreground mb-6">Save items you love for later</p>
          <Button asChild>
            <Link to="/products">Browse Products</Link>
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container py-8">
        <h1 className="font-display text-3xl font-bold mb-8">My Wishlist</h1>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {items.map((item) => {
            const price = item.product.sale_price || item.product.price;
            const hasDiscount = item.product.sale_price && item.product.sale_price < item.product.price;
            const imageUrl = item.product.images?.[0] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400';

            return (
              <Card key={item.id} className="overflow-hidden group">
                <Link to={`/product/${item.product.slug}`}>
                  <div className="aspect-[3/4] overflow-hidden bg-secondary relative">
                    <img
                      src={imageUrl}
                      alt={item.product.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                </Link>

                <div className="p-4">
                  <Link to={`/product/${item.product.slug}`}>
                    <h3 className="font-medium text-sm line-clamp-2 mb-2 hover:text-accent transition-colors">
                      {item.product.name}
                    </h3>
                  </Link>

                  <div className="flex items-center gap-2 mb-4">
                    <span className="font-semibold">₹{price.toLocaleString()}</span>
                    {hasDiscount && (
                      <span className="text-sm text-muted-foreground line-through">
                        ₹{item.product.price.toLocaleString()}
                      </span>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      className="flex-1 bg-accent hover:bg-accent/90 text-accent-foreground"
                      onClick={() => moveToCart(item)}
                    >
                      <ShoppingBag className="h-4 w-4 mr-1" />
                      Add to Cart
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => removeFromWishlist(item.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </Layout>
  );
}
