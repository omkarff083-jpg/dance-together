import { Link } from 'react-router-dom';
import { ArrowLeft, X, Star, Check, Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useCompare } from '@/contexts/CompareContext';
import { Layout } from '@/components/layout/Layout';

export default function Compare() {
  const { compareItems, removeFromCompare, clearCompare } = useCompare();

  if (compareItems.length === 0) {
    return (
      <Layout>
        <div className="container px-4 py-8">
          <div className="text-center py-16">
            <h2 className="text-xl font-semibold mb-2">No products to compare</h2>
            <p className="text-muted-foreground mb-4">Add products to compare their features side by side</p>
            <Button asChild>
              <Link to="/products">Browse Products</Link>
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  const features = [
    { key: 'price', label: 'Price' },
    { key: 'category', label: 'Category' },
    { key: 'sizes', label: 'Sizes Available' },
    { key: 'colors', label: 'Colors Available' },
    { key: 'stock', label: 'In Stock' },
    { key: 'description', label: 'Description' },
  ];

  const getValue = (product: typeof compareItems[0], key: string) => {
    switch (key) {
      case 'price':
        const price = product.sale_price || product.price;
        const hasDiscount = product.sale_price && product.sale_price < product.price;
        return (
          <div>
            <span className="font-bold text-lg">₹{price.toLocaleString()}</span>
            {hasDiscount && (
              <span className="text-xs line-through text-muted-foreground ml-2">
                ₹{product.price.toLocaleString()}
              </span>
            )}
          </div>
        );
      case 'category':
        return product.category?.name || '-';
      case 'sizes':
        return product.sizes?.length > 0 ? product.sizes.join(', ') : '-';
      case 'colors':
        return product.colors?.length > 0 ? product.colors.join(', ') : '-';
      case 'stock':
        return product.stock > 0 ? (
          <span className="text-green-600 flex items-center gap-1">
            <Check className="h-4 w-4" /> In Stock ({product.stock})
          </span>
        ) : (
          <span className="text-destructive">Out of Stock</span>
        );
      case 'description':
        return (
          <p className="text-xs text-muted-foreground line-clamp-3">
            {product.description || 'No description'}
          </p>
        );
      default:
        return '-';
    }
  };

  return (
    <Layout>
      <div className="container px-4 py-4 md:py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" asChild>
              <Link to="/products">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <h1 className="text-xl md:text-2xl font-bold">Compare Products</h1>
          </div>
          <Button variant="outline" size="sm" onClick={clearCompare}>
            Clear All
          </Button>
        </div>

        {/* Compare Grid */}
        <div className="overflow-x-auto">
          <div className="min-w-max">
            {/* Product Images Row */}
            <div className="flex border-b">
              <div className="w-32 md:w-40 flex-shrink-0 p-3 bg-muted/50 font-medium text-sm">
                Product
              </div>
              {compareItems.map((product) => (
                <div key={product.id} className="flex-1 min-w-48 p-3 relative">
                  <button
                    onClick={() => removeFromCompare(product.id)}
                    className="absolute top-2 right-2 w-6 h-6 bg-muted rounded-full flex items-center justify-center hover:bg-destructive hover:text-destructive-foreground transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                  <Link to={`/product/${product.slug}`}>
                    <div className="aspect-square w-32 mx-auto mb-3 rounded-lg overflow-hidden bg-secondary">
                      <img
                        src={product.images?.[0] || '/placeholder.svg'}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <h3 className="text-sm font-medium line-clamp-2 text-center hover:text-primary transition-colors">
                      {product.name}
                    </h3>
                  </Link>
                </div>
              ))}
            </div>

            {/* Feature Rows */}
            {features.map((feature, index) => (
              <div 
                key={feature.key} 
                className={`flex border-b ${index % 2 === 0 ? 'bg-muted/30' : ''}`}
              >
                <div className="w-32 md:w-40 flex-shrink-0 p-3 font-medium text-sm">
                  {feature.label}
                </div>
                {compareItems.map((product) => (
                  <div key={product.id} className="flex-1 min-w-48 p-3 text-sm">
                    {getValue(product, feature.key)}
                  </div>
                ))}
              </div>
            ))}

            {/* Actions Row */}
            <div className="flex border-b">
              <div className="w-32 md:w-40 flex-shrink-0 p-3 bg-muted/50 font-medium text-sm">
                Actions
              </div>
              {compareItems.map((product) => (
                <div key={product.id} className="flex-1 min-w-48 p-3">
                  <Button asChild size="sm" className="w-full">
                    <Link to={`/product/${product.slug}`}>View Details</Link>
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {compareItems.length < 4 && (
          <Card className="mt-6 p-4 text-center">
            <p className="text-sm text-muted-foreground mb-3">
              Add more products to compare (max 4)
            </p>
            <Button variant="outline" asChild>
              <Link to="/products">Browse Products</Link>
            </Button>
          </Card>
        )}
      </div>
    </Layout>
  );
}
