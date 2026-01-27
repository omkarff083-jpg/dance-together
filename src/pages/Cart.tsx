import { Link } from 'react-router-dom';
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Layout } from '@/components/layout/Layout';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';

export default function Cart() {
  const { items, loading, updateQuantity, removeFromCart, totalAmount } = useCart();
  const { user } = useAuth();

  if (!user) {
    return (
      <Layout>
        <div className="container py-16 text-center">
          <ShoppingBag className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h1 className="font-display text-2xl font-bold mb-4">Your Cart is Empty</h1>
          <p className="text-muted-foreground mb-6">Please login to view your cart</p>
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
          <h1 className="font-display text-3xl font-bold mb-8">Shopping Cart</h1>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-muted animate-pulse rounded-lg" />
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
          <ShoppingBag className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h1 className="font-display text-2xl font-bold mb-4">Your Cart is Empty</h1>
          <p className="text-muted-foreground mb-6">Looks like you haven't added anything yet</p>
          <Button asChild>
            <Link to="/products">Start Shopping</Link>
          </Button>
        </div>
      </Layout>
    );
  }

  const shipping = totalAmount >= 999 ? 0 : 99;
  const finalTotal = totalAmount + shipping;

  return (
    <Layout>
      <div className="container px-4 py-4 md:py-8 pb-40 md:pb-8">
        <h1 className="font-display text-xl md:text-3xl font-bold mb-4 md:mb-8">Shopping Cart</h1>

        <div className="grid lg:grid-cols-3 gap-4 md:gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-3 md:space-y-4">
            {items.map((item) => {
              const price = item.product?.sale_price || item.product?.price || 0;
              const imageUrl = item.product?.images?.[0] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200';

              return (
                <Card key={item.id} className="p-3 md:p-4">
                  <div className="flex gap-3">
                    <div className="w-16 h-16 md:w-24 md:h-24 rounded-lg overflow-hidden bg-secondary flex-shrink-0">
                      <img
                        src={imageUrl}
                        alt={item.product?.name}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-sm md:text-base truncate">{item.product?.name}</h3>
                      <div className="text-xs md:text-sm text-muted-foreground mt-0.5 md:mt-1">
                        {item.size && <span>Size: {item.size}</span>}
                        {item.size && item.color && <span> • </span>}
                        {item.color && <span>{item.color}</span>}
                      </div>
                      <p className="font-semibold text-sm md:text-base mt-1 md:mt-2">₹{price.toLocaleString()}</p>
                      
                      {/* Mobile quantity controls */}
                      <div className="flex items-center justify-between mt-2 md:hidden">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-6 text-center text-sm">{item.quantity}</span>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive h-7 px-2"
                          onClick={() => removeFromCart(item.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Desktop controls */}
                    <div className="hidden md:flex flex-col items-end justify-between">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        onClick={() => removeFromCart(item.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>

                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-8 text-center">{item.quantity}</span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>

          {/* Order Summary - Desktop */}
          <div className="hidden md:block">
            <Card className="p-6 sticky top-24">
              <h2 className="font-semibold text-lg mb-4">Order Summary</h2>
              
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>₹{totalAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Shipping</span>
                  <span>{shipping === 0 ? 'Free' : `₹${shipping}`}</span>
                </div>
                {shipping > 0 && (
                  <p className="text-xs text-muted-foreground">
                    Free shipping on orders above ₹999
                  </p>
                )}
              </div>

              <Separator className="my-4" />

              <div className="flex justify-between font-semibold text-lg mb-6">
                <span>Total</span>
                <span>₹{finalTotal.toLocaleString()}</span>
              </div>

              <Button className="w-full bg-accent hover:bg-accent/90 text-accent-foreground" asChild>
                <Link to="/checkout">
                  Proceed to Checkout
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </Card>
          </div>
        </div>

        {/* Fixed Bottom Summary for Mobile */}
        <div className="fixed bottom-14 left-0 right-0 bg-background border-t p-3 md:hidden z-40">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="font-bold text-lg">₹{finalTotal.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">
                {items.length} item(s) • {shipping === 0 ? 'Free delivery' : `+₹${shipping}`}
              </p>
            </div>
            <Button className="bg-accent hover:bg-accent/90 text-accent-foreground" asChild>
              <Link to="/checkout">
                Checkout
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </Layout>
  );
}
