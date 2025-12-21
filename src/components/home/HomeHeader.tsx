import { Link } from 'react-router-dom';
import { Heart, ShoppingCart, Search, Mic, Camera, MapPin, ChevronRight, Gift } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export function HomeHeader() {
  const { user } = useAuth();
  const { totalItems } = useCart();
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-background">
      {/* Top Row */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
        {/* Avatar & Refer */}
        <div className="flex items-center gap-2">
          <Link to={user ? '/orders' : '/auth'}>
            <Avatar className="h-9 w-9 border-2 border-accent">
              <AvatarImage src="" />
              <AvatarFallback className="bg-accent/10 text-accent text-sm font-semibold">
                {user?.email?.charAt(0).toUpperCase() || 'G'}
              </AvatarFallback>
            </Avatar>
          </Link>
          <Button variant="ghost" size="sm" className="h-8 px-3 rounded-full bg-accent/10 text-accent hover:bg-accent/20 gap-1.5">
            <Gift className="h-4 w-4" />
            <span className="text-xs font-medium">Refer and Earn</span>
          </Button>
        </div>

        {/* Right Icons */}
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full" asChild>
            <Link to="/wishlist">
              <Heart className="h-5 w-5" />
            </Link>
          </Button>
          <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full relative" asChild>
            <Link to="/cart">
              <ShoppingCart className="h-5 w-5" />
              {totalItems > 0 && (
                <Badge className="absolute -top-0.5 -right-0.5 h-4 w-4 flex items-center justify-center p-0 bg-accent text-accent-foreground text-[10px] rounded-full">
                  {totalItems}
                </Badge>
              )}
            </Link>
          </Button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="px-4 py-2">
        <form onSubmit={handleSearch} className="relative">
          <div className="flex items-center bg-secondary/50 rounded-lg border border-border/50 overflow-hidden">
            <Search className="h-5 w-5 text-muted-foreground ml-3" />
            <Input
              type="text"
              placeholder="Search by Keyword or Product ID"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-muted-foreground text-sm h-11"
            />
            <div className="flex items-center gap-1 pr-2">
              <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                <Mic className="h-5 w-5" />
              </Button>
              <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                <Camera className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </form>
      </div>

      {/* Delivery Location */}
      <div className="px-4 pb-2">
        <button className="flex items-center gap-2 text-sm text-foreground hover:text-accent transition-colors">
          <MapPin className="h-4 w-4 text-accent" />
          <span>Delivering to <strong>Your Location</strong></span>
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
}
