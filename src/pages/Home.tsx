import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Grid2X2, ChevronRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { HomeHeader } from '@/components/home/HomeHeader';
import { CategoryCircle } from '@/components/home/CategoryCircle';
import { MeeshoProductCard } from '@/components/home/MeeshoProductCard';
import { FilterBar } from '@/components/home/FilterBar';
import { MobileBottomNav } from '@/components/home/MobileBottomNav';
import { ProductGridSkeleton } from '@/components/products/ProductCardSkeleton';
import { PullToRefresh } from '@/components/ui/pull-to-refresh';

interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  sale_price: number | null;
  images: string[];
  category: { name: string } | null;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  image_url: string | null;
}

// Extended categories for the circular icons
const extendedCategories = [
  { id: 'all', name: 'All Categories', slug: '', image_url: 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=200' },
];

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('newest');

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Build products query with sorting
      let productsQuery = supabase
        .from('products')
        .select('id, name, slug, price, sale_price, images, category:categories(name)')
        .eq('active', true);

      // Apply sorting
      switch (sortBy) {
        case 'price-low':
          productsQuery = productsQuery.order('price', { ascending: true });
          break;
        case 'price-high':
          productsQuery = productsQuery.order('price', { ascending: false });
          break;
        case 'newest':
          productsQuery = productsQuery.order('created_at', { ascending: false });
          break;
        default:
          productsQuery = productsQuery.order('created_at', { ascending: false });
      }

      productsQuery = productsQuery.limit(20);

      const [productsRes, categoriesRes] = await Promise.all([
        productsQuery,
        supabase.from('categories').select('*')
      ]);

      if (productsRes.data) {
        setProducts(productsRes.data as Product[]);
      }
      if (categoriesRes.data) {
        setCategories([...extendedCategories, ...categoriesRes.data] as Category[]);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }, [sortBy]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSortChange = (sort: string) => {
    setSortBy(sort);
  };

  const handleRefresh = async () => {
    await fetchData();
  };

  return (
    <PullToRefresh onRefresh={handleRefresh} className="min-h-screen bg-background pb-20 md:pb-0">
      {/* Header */}
      <HomeHeader />

      {/* Categories Carousel */}
      <div className="py-4 bg-background">
        <div className="overflow-x-auto scrollbar-hide">
          <div className="flex gap-4 px-4 pb-2">
            {categories.map((category) => (
              <CategoryCircle key={category.id} category={category} />
            ))}
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <FilterBar onSortChange={handleSortChange} />

      {/* Products Grid */}
      <div className="p-3">
        {loading ? (
          <ProductGridSkeleton count={8} />
        ) : products.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {products.map((product) => (
              <MeeshoProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Grid2X2 className="h-16 w-16 text-muted-foreground/30 mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">No products found</h3>
            <p className="text-muted-foreground text-sm">
              Check back later for new arrivals
            </p>
          </div>
        )}
      </div>

      {/* Load More Section */}
      {products.length > 0 && (
        <div className="px-4 pb-6">
          <Link 
            to="/products" 
            className="flex items-center justify-center gap-2 w-full py-3 bg-secondary hover:bg-secondary/80 rounded-lg text-foreground font-medium transition-colors"
          >
            View All Products
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      )}

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />

      {/* Customer Support Chat is rendered globally in App.tsx */}
    </PullToRefresh>
  );
}
