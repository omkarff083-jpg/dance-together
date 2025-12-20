import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Truck, Shield, RefreshCw, Sparkles, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Layout } from '@/components/layout/Layout';
import { ProductGrid } from '@/components/products/ProductGrid';
import { supabase } from '@/integrations/supabase/client';

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

export default function Home() {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [productsRes, categoriesRes] = await Promise.all([
        supabase
          .from('products')
          .select('id, name, slug, price, sale_price, images, category:categories(name)')
          .eq('active', true)
          .eq('featured', true)
          .limit(8),
        supabase
          .from('categories')
          .select('*')
          .limit(4)
      ]);

      if (productsRes.data) {
        setFeaturedProducts(productsRes.data as Product[]);
      }
      if (categoriesRes.data) {
        setCategories(categoriesRes.data);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Animated background */}
        <div className="absolute inset-0">
          <div 
            className="absolute inset-0 bg-cover bg-center scale-105"
            style={{
              backgroundImage: 'url(https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1920)',
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-foreground/50 via-foreground/40 to-foreground/70" />
          
          {/* Floating decorative elements */}
          <div className="absolute top-20 left-10 w-32 h-32 bg-accent/20 rounded-full blur-3xl float" />
          <div className="absolute bottom-40 right-20 w-48 h-48 bg-gold/20 rounded-full blur-3xl float" style={{ animationDelay: '2s' }} />
        </div>
        
        <div className="relative z-10 text-center text-primary-foreground px-4 max-w-5xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-background/10 backdrop-blur-sm border border-background/20 mb-8 animate-fade-in-down">
            <Sparkles className="h-4 w-4 text-gold" />
            <span className="text-sm font-medium tracking-wide">New Collection 2025</span>
          </div>
          
          <h1 className="font-display text-6xl md:text-8xl lg:text-9xl font-bold mb-6 animate-fade-in leading-tight">
            Elevate Your
            <span className="block italic text-gold">Style</span>
          </h1>
          
          <p className="text-lg md:text-xl mb-10 max-w-2xl mx-auto opacity-90 animate-fade-in-up font-light tracking-wide" style={{ animationDelay: '0.2s' }}>
            Discover our curated collection of premium fashion pieces designed for the modern individual
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
            <Button 
              size="lg" 
              asChild 
              className="bg-accent hover:bg-accent/90 text-accent-foreground rounded-full px-8 h-14 text-base font-medium shadow-glow btn-shine group"
            >
              <Link to="/products">
                Shop Now
                <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              asChild 
              className="border-2 border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10 rounded-full px-8 h-14 text-base font-medium backdrop-blur-sm"
            >
              <Link to="/categories">View Categories</Link>
            </Button>
          </div>

          {/* Scroll indicator */}
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce-subtle">
            <div className="w-6 h-10 border-2 border-primary-foreground/30 rounded-full flex justify-center pt-2">
              <div className="w-1.5 h-3 bg-primary-foreground/50 rounded-full" />
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 border-b bg-background">
        <div className="container">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {[
              { icon: Truck, title: 'Free Shipping', desc: 'On orders above ₹999' },
              { icon: Shield, title: 'Secure Payment', desc: '100% secure checkout' },
              { icon: RefreshCw, title: 'Easy Returns', desc: '7 days return policy' },
            ].map((feature, index) => (
              <div 
                key={feature.title}
                className="reveal flex items-center gap-5 justify-center group"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="p-4 rounded-2xl bg-secondary group-hover:bg-accent/10 transition-colors duration-300">
                  <feature.icon className="h-8 w-8 text-accent" />
                </div>
                <div>
                  <h3 className="font-display text-xl font-semibold">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      {categories.length > 0 && (
        <section className="py-24">
          <div className="container">
            <div className="flex items-end justify-between mb-12">
              <div>
                <p className="text-accent font-medium tracking-widest uppercase text-sm mb-3">Collections</p>
                <h2 className="font-display text-4xl md:text-5xl font-bold">Shop by Category</h2>
              </div>
              <Button variant="ghost" asChild className="hidden md:flex link-underline">
                <Link to="/categories">
                  View All
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {categories.map((category, index) => (
                <Link
                  key={category.id}
                  to={`/products?category=${category.slug}`}
                  className="stagger-item group relative aspect-[3/4] overflow-hidden rounded-2xl shadow-elegant hover-lift"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <img
                    src={category.image_url || 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=400'}
                    alt={category.name}
                    className="w-full h-full object-cover img-zoom"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 via-foreground/20 to-transparent" />
                  <div className="absolute bottom-6 left-6 right-6">
                    <h3 className="font-display text-2xl md:text-3xl font-bold text-primary-foreground mb-2">
                      {category.name}
                    </h3>
                    <span className="inline-flex items-center text-primary-foreground/80 text-sm font-medium group-hover:text-accent transition-colors">
                      Explore
                      <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Featured Products */}
      <section className="py-24 gradient-warm">
        <div className="container">
          <div className="flex items-end justify-between mb-12">
            <div>
              <p className="text-accent font-medium tracking-widest uppercase text-sm mb-3">Handpicked</p>
              <h2 className="font-display text-4xl md:text-5xl font-bold">Featured Products</h2>
            </div>
            <Button variant="ghost" asChild className="hidden md:flex link-underline">
              <Link to="/products?featured=true">
                View All
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
          
          <ProductGrid products={featuredProducts} loading={loading} />
        </div>
      </section>

      {/* Testimonial/Brand Statement */}
      <section className="py-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-primary" />
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-96 h-96 bg-accent rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-gold rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />
        </div>
        
        <div className="container relative z-10 text-center">
          <div className="flex justify-center gap-1 mb-8">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="h-6 w-6 text-gold fill-gold" />
            ))}
          </div>
          <blockquote className="font-display text-3xl md:text-5xl lg:text-6xl font-bold text-primary-foreground max-w-4xl mx-auto leading-tight mb-8">
            "Fashion is not something that exists in dresses only. Fashion is in the sky, in the street."
          </blockquote>
          <cite className="text-primary-foreground/70 text-lg font-medium not-italic">— Coco Chanel</cite>
        </div>
      </section>

      {/* Newsletter */}
      <section className="py-24">
        <div className="container">
          <div className="relative bg-secondary rounded-3xl p-10 md:p-20 text-center overflow-hidden">
            {/* Decorative circles */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-accent/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-gold/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
            
            <div className="relative z-10">
              <Sparkles className="h-10 w-10 text-accent mx-auto mb-6" />
              <h2 className="font-display text-4xl md:text-5xl font-bold mb-4">
                Join Our Newsletter
              </h2>
              <p className="text-muted-foreground mb-10 max-w-md mx-auto text-lg">
                Subscribe to get special offers, free giveaways, and exclusive deals
              </p>
              <form className="flex flex-col sm:flex-row gap-4 max-w-lg mx-auto">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="flex-1 px-6 py-4 rounded-full bg-background border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent shadow-elegant"
                />
                <Button className="bg-accent hover:bg-accent/90 text-accent-foreground rounded-full px-8 h-14 btn-shine shadow-glow">
                  Subscribe
                </Button>
              </form>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
