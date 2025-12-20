import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface SearchResult {
  id: string;
  name: string;
  slug: string;
  price: number;
  sale_price: number | null;
  images: string[];
  category: { name: string } | null;
}

interface ProductSearchProps {
  textColor?: string;
  onClose?: () => void;
  isOpen?: boolean;
}

export function ProductSearch({ textColor = 'text-foreground', onClose, isOpen }: ProductSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    // Debounce search
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (query.trim().length < 2) {
      setResults([]);
      setShowResults(false);
      return;
    }

    debounceRef.current = setTimeout(() => {
      searchProducts(query);
    }, 300);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [query]);

  const searchProducts = async (searchQuery: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('products')
        .select('id, name, slug, price, sale_price, images, category:categories(name)')
        .eq('active', true)
        .ilike('name', `%${searchQuery}%`)
        .limit(6);

      if (error) throw error;
      setResults(data as SearchResult[]);
      setShowResults(true);
      setSelectedIndex(-1);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/products?search=${encodeURIComponent(query.trim())}`);
      handleClose();
    }
  };

  const handleClose = () => {
    setQuery('');
    setResults([]);
    setShowResults(false);
    onClose?.();
  };

  const handleSelectProduct = (slug: string) => {
    navigate(`/product/${slug}`);
    handleClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showResults || results.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((prev) => (prev < results.length - 1 ? prev + 1 : prev));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < results.length) {
          handleSelectProduct(results[selectedIndex].slug);
        } else if (query.trim()) {
          navigate(`/products?search=${encodeURIComponent(query.trim())}`);
          handleClose();
        }
        break;
      case 'Escape':
        handleClose();
        break;
    }
  };

  // Close results when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        resultsRef.current &&
        !resultsRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative">
      <form onSubmit={handleSubmit} className="flex items-center gap-2 animate-fade-in">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            ref={inputRef}
            type="search"
            placeholder="Search products..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => query.length >= 2 && setShowResults(true)}
            className="w-48 sm:w-72 pl-9 pr-8 rounded-full bg-background/90 backdrop-blur-sm border-border"
            autoComplete="off"
          />
          {loading && (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
          )}
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={handleClose}
          className={`rounded-full ${textColor}`}
        >
          <X className="h-4 w-4" />
        </Button>
      </form>

      {/* Autocomplete Results */}
      {showResults && results.length > 0 && (
        <div
          ref={resultsRef}
          className="absolute top-full mt-2 left-0 w-full sm:w-72 bg-popover border border-border rounded-xl shadow-xl overflow-hidden z-50 animate-fade-in"
        >
          <div className="max-h-80 overflow-y-auto">
            {results.map((product, index) => (
              <button
                key={product.id}
                onClick={() => handleSelectProduct(product.slug)}
                className={cn(
                  'w-full flex items-center gap-3 p-3 text-left transition-colors hover:bg-secondary',
                  selectedIndex === index && 'bg-secondary'
                )}
              >
                <div className="w-12 h-12 rounded-lg bg-secondary overflow-hidden flex-shrink-0">
                  <img
                    src={product.images?.[0] || 'https://via.placeholder.com/48'}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{product.name}</p>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-primary">
                      ₹{(product.sale_price || product.price).toLocaleString()}
                    </span>
                    {product.sale_price && product.sale_price < product.price && (
                      <span className="text-xs text-muted-foreground line-through">
                        ₹{product.price.toLocaleString()}
                      </span>
                    )}
                  </div>
                  {product.category && (
                    <p className="text-xs text-muted-foreground">{product.category.name}</p>
                  )}
                </div>
              </button>
            ))}
          </div>
          
          {query.trim() && (
            <button
              onClick={() => {
                navigate(`/products?search=${encodeURIComponent(query.trim())}`);
                handleClose();
              }}
              className="w-full p-3 text-sm text-center border-t border-border hover:bg-secondary transition-colors text-primary font-medium"
            >
              View all results for "{query}"
            </button>
          )}
        </div>
      )}

      {/* No Results */}
      {showResults && results.length === 0 && query.length >= 2 && !loading && (
        <div
          ref={resultsRef}
          className="absolute top-full mt-2 left-0 w-full sm:w-72 bg-popover border border-border rounded-xl shadow-xl p-4 z-50 animate-fade-in"
        >
          <p className="text-sm text-muted-foreground text-center">
            No products found for "{query}"
          </p>
          <button
            onClick={() => {
              navigate(`/products?search=${encodeURIComponent(query.trim())}`);
              handleClose();
            }}
            className="w-full mt-2 text-sm text-center text-primary font-medium hover:underline"
          >
            Search anyway
          </button>
        </div>
      )}
    </div>
  );
}