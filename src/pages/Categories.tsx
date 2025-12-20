import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { supabase } from '@/integrations/supabase/client';

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
}

export default function Categories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name');

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="container py-8">
          <h1 className="font-display text-4xl font-bold mb-8">Categories</h1>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="aspect-square bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        </div>
      </Layout>
    );
  }

  if (categories.length === 0) {
    return (
      <Layout>
        <div className="container py-16 text-center">
          <h1 className="font-display text-2xl font-bold mb-4">No Categories Yet</h1>
          <p className="text-muted-foreground">Categories will appear here once added.</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container py-8">
        <h1 className="font-display text-4xl font-bold mb-8">Shop by Category</h1>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
          {categories.map((category) => (
            <Link
              key={category.id}
              to={`/products?category=${category.slug}`}
              className="group relative aspect-square overflow-hidden rounded-lg"
            >
              <img
                src={category.image_url || 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=600'}
                alt={category.name}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-foreground/70 via-foreground/20 to-transparent" />
              <div className="absolute bottom-4 left-4 right-4">
                <h3 className="font-display text-xl md:text-2xl font-semibold text-primary-foreground mb-1">
                  {category.name}
                </h3>
                {category.description && (
                  <p className="text-sm text-primary-foreground/80 line-clamp-2">
                    {category.description}
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </Layout>
  );
}
