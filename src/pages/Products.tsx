import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Filter, SortAsc, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Layout } from '@/components/layout/Layout';
import { ProductGrid } from '@/components/products/ProductGrid';
import { CompareBar } from '@/components/compare/CompareBar';
import { supabase } from '@/integrations/supabase/client';

interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  sale_price: number | null;
  images: string[];
  stock: number;
  category: { name: string } | null;
  avgRating?: number;
  reviewCount?: number;
}

interface Category {
  id: string;
  name: string;
  slug: string;
}

export default function Products() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState('newest');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 10000]);
  const [maxPrice, setMaxPrice] = useState(10000);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [minDiscount, setMinDiscount] = useState(0);

  const searchQuery = searchParams.get('search') || '';
  const categorySlug = searchParams.get('category') || '';
  const featured = searchParams.get('featured') === 'true';
  const onSale = searchParams.get('sale') === 'true';

  useEffect(() => {
    fetchCategories();
    fetchMaxPrice();
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [searchQuery, categorySlug, featured, onSale, selectedCategories, sortBy, priceRange, inStockOnly, minDiscount]);

  const fetchCategories = async () => {
    const { data } = await supabase.from('categories').select('id, name, slug');
    if (data) setCategories(data);
  };

  const fetchMaxPrice = async () => {
    const { data } = await supabase
      .from('products')
      .select('price')
      .eq('active', true)
      .order('price', { ascending: false })
      .limit(1)
      .single();
    if (data) {
      const max = Math.ceil(data.price / 100) * 100;
      setMaxPrice(max);
      setPriceRange([0, max]);
    }
  };

  const fetchProducts = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('products')
        .select('id, name, slug, price, sale_price, images, stock, category:categories(name)')
        .eq('active', true);

      if (searchQuery) {
        query = query.ilike('name', `%${searchQuery}%`);
      }

      if (categorySlug) {
        const { data: cat } = await supabase
          .from('categories')
          .select('id')
          .eq('slug', categorySlug)
          .single();
        if (cat) {
          query = query.eq('category_id', cat.id);
        }
      }

      if (selectedCategories.length > 0) {
        query = query.in('category_id', selectedCategories);
      }

      if (featured) {
        query = query.eq('featured', true);
      }

      if (onSale) {
        query = query.not('sale_price', 'is', null);
      }

      // Price range filter
      query = query.gte('price', priceRange[0]).lte('price', priceRange[1]);

      // In-stock filter
      if (inStockOnly) {
        query = query.gt('stock', 0);
      }

      switch (sortBy) {
        case 'price-low':
          query = query.order('price', { ascending: true });
          break;
        case 'price-high':
          query = query.order('price', { ascending: false });
          break;
        case 'name':
          query = query.order('name', { ascending: true });
          break;
        default:
          query = query.order('created_at', { ascending: false });
      }

      const { data, error } = await query;
      if (error) throw error;
      
      let filteredProducts = data as Product[] || [];
      
      // Fetch ratings for all products
      const productIds = filteredProducts.map(p => p.id);
      if (productIds.length > 0) {
        const { data: reviews } = await supabase
          .from('reviews')
          .select('product_id, rating')
          .in('product_id', productIds);
        
        if (reviews) {
          const ratingsByProduct = reviews.reduce((acc, review) => {
            if (!acc[review.product_id]) {
              acc[review.product_id] = { total: 0, count: 0 };
            }
            acc[review.product_id].total += review.rating;
            acc[review.product_id].count += 1;
            return acc;
          }, {} as Record<string, { total: number; count: number }>);
          
          filteredProducts = filteredProducts.map(product => ({
            ...product,
            avgRating: ratingsByProduct[product.id] 
              ? ratingsByProduct[product.id].total / ratingsByProduct[product.id].count 
              : 0,
            reviewCount: ratingsByProduct[product.id]?.count || 0,
          }));
        }
      }
      
      // Filter by discount percentage
      if (minDiscount > 0) {
        filteredProducts = filteredProducts.filter(product => {
          if (!product.sale_price) return false;
          const discount = Math.round(((product.price - product.sale_price) / product.price) * 100);
          return discount >= minDiscount;
        });
      }
      
      // Sort by rating if selected
      if (sortBy === 'rating') {
        filteredProducts.sort((a, b) => (b.avgRating || 0) - (a.avgRating || 0));
      }
      
      setProducts(filteredProducts);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleCategory = (categoryId: string) => {
    setSelectedCategories(prev =>
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const clearFilters = () => {
    setSelectedCategories([]);
    setPriceRange([0, maxPrice]);
    setInStockOnly(false);
    setMinDiscount(0);
    setSearchParams({});
  };

  const hasActiveFilters = selectedCategories.length > 0 || searchQuery || categorySlug || featured || onSale || priceRange[0] > 0 || priceRange[1] < maxPrice || inStockOnly || minDiscount > 0;

  return (
    <Layout>
      <div className="container py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-display text-4xl font-bold mb-2">
            {searchQuery ? `Search: "${searchQuery}"` : 'All Products'}
          </h1>
          <p className="text-muted-foreground">
            {products.length} products found
          </p>
        </div>

        {/* Filters Bar */}
        <div className="flex items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-2">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm">
                  <Filter className="h-4 w-4 mr-2" />
                  Filters
                </Button>
              </SheetTrigger>
              <SheetContent side="left">
                <SheetHeader>
                  <SheetTitle>Filters</SheetTitle>
                </SheetHeader>
                <div className="mt-6 space-y-6">
                  {/* Price Range */}
                  <div>
                    <h3 className="font-semibold mb-4">Price Range</h3>
                    <div className="space-y-4">
                      <Slider
                        value={priceRange}
                        onValueChange={(value) => setPriceRange(value as [number, number])}
                        min={0}
                        max={maxPrice}
                        step={100}
                        className="w-full"
                      />
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <span>₹{priceRange[0].toLocaleString()}</span>
                        <span>₹{priceRange[1].toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  {/* Minimum Discount */}
                  <div>
                    <h3 className="font-semibold mb-4">Minimum Discount</h3>
                    <div className="space-y-4">
                      <Slider
                        value={[minDiscount]}
                        onValueChange={(value) => setMinDiscount(value[0])}
                        min={0}
                        max={70}
                        step={5}
                        className="w-full"
                      />
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <span>{minDiscount}% off or more</span>
                        {minDiscount > 0 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-auto p-0 text-xs"
                            onClick={() => setMinDiscount(0)}
                          >
                            Clear
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* In Stock Toggle */}
                  <div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="in-stock" className="font-semibold cursor-pointer">
                        In Stock Only
                      </Label>
                      <Switch
                        id="in-stock"
                        checked={inStockOnly}
                        onCheckedChange={setInStockOnly}
                      />
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Show only products that are available
                    </p>
                  </div>

                  {/* Categories */}
                  <div>
                    <h3 className="font-semibold mb-4">Categories</h3>
                    <div className="space-y-3">
                      {categories.map((category) => (
                        <div key={category.id} className="flex items-center gap-2">
                          <Checkbox
                            id={category.id}
                            checked={selectedCategories.includes(category.id)}
                            onCheckedChange={() => toggleCategory(category.id)}
                          />
                          <Label htmlFor={category.id} className="cursor-pointer">
                            {category.name}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </SheetContent>
            </Sheet>

            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                <X className="h-4 w-4 mr-2" />
                Clear filters
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <SortAsc className="h-4 w-4 text-muted-foreground" />
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest</SelectItem>
                <SelectItem value="rating">Highest Rated</SelectItem>
                <SelectItem value="price-low">Price: Low to High</SelectItem>
                <SelectItem value="price-high">Price: High to Low</SelectItem>
                <SelectItem value="name">Name</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Products Grid */}
        <ProductGrid products={products} loading={loading} />
        
        {/* Compare Bar */}
        <CompareBar />
      </div>
    </Layout>
  );
}
