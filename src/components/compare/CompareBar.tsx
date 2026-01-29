import { Link } from 'react-router-dom';
import { X, GitCompare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCompare } from '@/contexts/CompareContext';

export function CompareBar() {
  const { compareItems, removeFromCompare, clearCompare } = useCompare();

  if (compareItems.length === 0) return null;

  return (
    <div className="fixed bottom-14 left-0 right-0 z-30 bg-background border-t shadow-lg md:bottom-0">
      <div className="container px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 flex-shrink-0">
            <GitCompare className="h-5 w-5 text-primary" />
            <span className="text-sm font-medium hidden sm:inline">Compare</span>
            <span className="text-xs text-muted-foreground">({compareItems.length}/4)</span>
          </div>
          
          <div className="flex gap-2 overflow-x-auto flex-1 scrollbar-hide">
            {compareItems.map((item) => (
              <div 
                key={item.id}
                className="relative flex-shrink-0 w-12 h-12 rounded-lg overflow-hidden border"
              >
                <img
                  src={item.images?.[0] || '/placeholder.svg'}
                  alt={item.name}
                  className="w-full h-full object-cover"
                />
                <button
                  onClick={() => removeFromCompare(item.id)}
                  className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
          
          <div className="flex gap-2 flex-shrink-0">
            <Button 
              variant="outline" 
              size="sm"
              onClick={clearCompare}
              className="h-8 px-2 text-xs"
            >
              Clear
            </Button>
            <Button 
              size="sm" 
              asChild
              className="h-8 px-3 text-xs"
              disabled={compareItems.length < 2}
            >
              <Link to="/compare">
                Compare ({compareItems.length})
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
