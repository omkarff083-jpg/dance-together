import { ArrowUpDown, ChevronDown, SlidersHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface FilterBarProps {
  onSortChange?: (sort: string) => void;
  onCategoryChange?: (category: string) => void;
  onGenderChange?: (gender: string) => void;
}

export function FilterBar({ onSortChange, onCategoryChange, onGenderChange }: FilterBarProps) {
  return (
    <div className="flex items-center gap-2 overflow-x-auto py-3 px-4 bg-background border-b border-border/50 sticky top-[64px] z-40 scrollbar-hide">
      {/* Sort */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="rounded-full flex items-center gap-1.5 shrink-0 h-9 px-4 border-border">
            <ArrowUpDown className="h-3.5 w-3.5" />
            <span className="text-sm">Sort</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-40">
          <DropdownMenuItem onClick={() => onSortChange?.('price-low')}>
            Price: Low to High
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onSortChange?.('price-high')}>
            Price: High to Low
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onSortChange?.('newest')}>
            Newest First
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onSortChange?.('rating')}>
            Best Rating
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Category */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="rounded-full flex items-center gap-1.5 shrink-0 h-9 px-4 border-border">
            <span className="text-sm">Category</span>
            <ChevronDown className="h-3.5 w-3.5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-40">
          <DropdownMenuItem onClick={() => onCategoryChange?.('all')}>
            All Categories
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onCategoryChange?.('mens-fashion')}>
            Men's Fashion
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onCategoryChange?.('womens-fashion')}>
            Women's Fashion
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onCategoryChange?.('accessories')}>
            Accessories
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onCategoryChange?.('footwear')}>
            Footwear
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Gender */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="rounded-full flex items-center gap-1.5 shrink-0 h-9 px-4 border-border">
            <span className="text-sm">Gender</span>
            <ChevronDown className="h-3.5 w-3.5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-32">
          <DropdownMenuItem onClick={() => onGenderChange?.('all')}>
            All
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onGenderChange?.('men')}>
            Men
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onGenderChange?.('women')}>
            Women
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onGenderChange?.('kids')}>
            Kids
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Filters */}
      <Button variant="outline" size="sm" className="rounded-full flex items-center gap-1.5 shrink-0 h-9 px-4 border-border relative">
        <SlidersHorizontal className="h-3.5 w-3.5" />
        <span className="text-sm">Filters</span>
        <span className="absolute -top-1 -right-1 w-2 h-2 bg-accent rounded-full"></span>
      </Button>
    </div>
  );
}
