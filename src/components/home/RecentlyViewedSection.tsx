import { Link } from 'react-router-dom';
import { ChevronRight, Clock, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface RecentProduct {
  id: string;
  slug: string;
  name: string;
  price: number;
  sale_price: number | null;
  images: string[];
  viewedAt: number;
}

interface RecentlyViewedSectionProps {
  products: RecentProduct[];
  onClear?: () => void;
}

export function RecentlyViewedSection({ products, onClear }: RecentlyViewedSectionProps) {
  if (products.length === 0) return null;

  return (
    <div className="py-4 bg-background">
      <div className="flex items-center justify-between px-4 mb-3">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <h3 className="font-semibold text-sm">Recently Viewed</h3>
        </div>
        {onClear && (
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-xs h-7 px-2 text-muted-foreground"
            onClick={onClear}
          >
            <X className="h-3 w-3 mr-1" />
            Clear
          </Button>
        )}
      </div>
      
      <div className="overflow-x-auto scrollbar-hide">
        <div className="flex gap-3 px-4 pb-2">
          {products.map((product) => {
            const displayPrice = product.sale_price || product.price;
            const hasDiscount = product.sale_price && product.sale_price < product.price;
            
            return (
              <Link 
                key={product.id} 
                to={`/product/${product.slug}`}
                className="flex-shrink-0 w-28"
              >
                <div className="aspect-square rounded-lg overflow-hidden bg-secondary mb-2">
                  <img
                    src={product.images?.[0] || '/placeholder.svg'}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <p className="text-xs line-clamp-2 leading-tight mb-1">{product.name}</p>
                <div className="flex items-center gap-1">
                  <span className="text-sm font-semibold">₹{displayPrice.toLocaleString()}</span>
                  {hasDiscount && (
                    <span className="text-xs line-through text-muted-foreground">
                      ₹{product.price}
                    </span>
                  )}
                </div>
              </Link>
            );
          })}
          
          <Link 
            to="/products"
            className="flex-shrink-0 w-28 flex flex-col items-center justify-center aspect-square rounded-lg bg-secondary/50 hover:bg-secondary transition-colors"
          >
            <ChevronRight className="h-6 w-6 text-muted-foreground mb-1" />
            <span className="text-xs text-muted-foreground">View All</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
