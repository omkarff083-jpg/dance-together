import { createContext, useContext, useState, ReactNode } from 'react';
import { toast } from 'sonner';

interface CompareProduct {
  id: string;
  name: string;
  slug: string;
  price: number;
  sale_price: number | null;
  images: string[];
  description: string | null;
  category: { name: string } | null;
  sizes: string[];
  colors: string[];
  stock: number;
}

interface CompareContextType {
  compareItems: CompareProduct[];
  addToCompare: (product: CompareProduct) => void;
  removeFromCompare: (productId: string) => void;
  clearCompare: () => void;
  isInCompare: (productId: string) => boolean;
  maxItems: number;
}

const CompareContext = createContext<CompareContextType | undefined>(undefined);

const MAX_COMPARE_ITEMS = 4;

export function CompareProvider({ children }: { children: ReactNode }) {
  const [compareItems, setCompareItems] = useState<CompareProduct[]>([]);

  const addToCompare = (product: CompareProduct) => {
    if (compareItems.length >= MAX_COMPARE_ITEMS) {
      toast.error(`Maximum ${MAX_COMPARE_ITEMS} products can be compared`);
      return;
    }
    
    if (compareItems.find(item => item.id === product.id)) {
      toast.info('Product already in compare list');
      return;
    }
    
    setCompareItems(prev => [...prev, product]);
    toast.success('Added to compare');
  };

  const removeFromCompare = (productId: string) => {
    setCompareItems(prev => prev.filter(item => item.id !== productId));
  };

  const clearCompare = () => {
    setCompareItems([]);
  };

  const isInCompare = (productId: string) => {
    return compareItems.some(item => item.id === productId);
  };

  return (
    <CompareContext.Provider value={{
      compareItems,
      addToCompare,
      removeFromCompare,
      clearCompare,
      isInCompare,
      maxItems: MAX_COMPARE_ITEMS,
    }}>
      {children}
    </CompareContext.Provider>
  );
}

export function useCompare() {
  const context = useContext(CompareContext);
  if (!context) {
    throw new Error('useCompare must be used within a CompareProvider');
  }
  return context;
}
