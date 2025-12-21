import { Link } from 'react-router-dom';

interface Category {
  id: string;
  name: string;
  slug: string;
  image_url: string | null;
}

interface CategoryCircleProps {
  category: Category;
}

export function CategoryCircle({ category }: CategoryCircleProps) {
  return (
    <Link
      to={`/products?category=${category.slug}`}
      className="flex flex-col items-center gap-2 min-w-[70px] group"
    >
      <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-gradient-to-br from-secondary to-muted p-1 group-hover:scale-105 transition-transform duration-200">
        <div className="w-full h-full rounded-full overflow-hidden bg-background">
          <img
            src={category.image_url || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200'}
            alt={category.name}
            className="w-full h-full object-cover"
          />
        </div>
      </div>
      <span className="text-xs text-center text-foreground font-medium line-clamp-1 max-w-[70px]">
        {category.name.length > 10 ? category.name.slice(0, 10) + '...' : category.name}
      </span>
    </Link>
  );
}
