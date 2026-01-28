import { Link, useLocation } from 'react-router-dom';
import { Home, Grid3X3, ShoppingBag, PlayCircle, Package } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export function MobileBottomNav() {
  const location = useLocation();
  const { user } = useAuth();

  const navItems = [
    { icon: Home, label: 'Home', href: '/', active: location.pathname === '/' },
    { icon: Grid3X3, label: 'Categories', href: '/categories', active: location.pathname === '/categories' },
    { icon: ShoppingBag, label: 'Mall', href: '/products', active: location.pathname === '/products' },
    { icon: PlayCircle, label: 'Video Finds', href: '/products?featured=true', active: false },
    { icon: Package, label: 'My Orders', href: user ? '/orders' : '/auth', active: location.pathname === '/orders' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border md:hidden" style={{ position: 'fixed' }}>
      <div className="flex items-center justify-around py-2 safe-area-inset-bottom">
        {navItems.map((item) => (
          <Link
            key={item.label}
            to={item.href}
            className={`flex flex-col items-center gap-0.5 px-3 py-1.5 min-w-[60px] ${
              item.active ? 'text-accent' : 'text-muted-foreground'
            }`}
          >
            <item.icon className={`h-5 w-5 ${item.active ? 'text-accent' : ''}`} />
            <span className="text-[10px] font-medium">{item.label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}
