import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ShoppingBag, Heart, User, Menu, Search, LogOut, Settings, Package, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ProductSearch } from '@/components/ProductSearch';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { Badge } from '@/components/ui/badge';

export function Navbar() {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const { user, isAdmin, signOut } = useAuth();
  const { totalItems } = useCart();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  const navLinks = [
    { name: 'Home', href: '/' },
    { name: 'Shop', href: '/products' },
    { name: 'Categories', href: '/categories' },
  ];

  const isHomePage = location.pathname === '/';
  const navbarBg = isScrolled || !isHomePage 
    ? 'bg-background/95 backdrop-blur-xl shadow-elegant border-b border-border/50' 
    : 'bg-transparent';
  const textColor = isScrolled || !isHomePage ? 'text-foreground' : 'text-primary-foreground';

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${navbarBg}`}>
      <div className="container flex h-20 items-center justify-between">
        {/* Mobile Menu */}
        <Sheet>
          <SheetTrigger asChild className="lg:hidden">
            <Button variant="ghost" size="icon" className={`rounded-full ${textColor}`}>
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-80 bg-background border-border">
            <nav className="flex flex-col gap-2 mt-8">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  to={link.href}
                  className={`text-lg font-medium px-4 py-3 rounded-xl transition-colors hover:bg-secondary ${
                    location.pathname === link.href ? 'bg-secondary text-accent' : ''
                  }`}
                >
                  {link.name}
                </Link>
              ))}
              {user && (
                <Link
                  to="/wishlist"
                  className="text-lg font-medium px-4 py-3 rounded-xl transition-colors hover:bg-secondary flex items-center gap-3"
                >
                  <Heart className="h-5 w-5" />
                  Wishlist
                </Link>
              )}
              {isAdmin && (
                <Link
                  to="/admin"
                  className="text-lg font-medium px-4 py-3 rounded-xl transition-colors hover:bg-secondary text-accent"
                >
                  Admin Panel
                </Link>
              )}
              <div className="border-t border-border mt-4 pt-4">
                <Link
                  to="/privacy-policy"
                  className="text-lg font-medium px-4 py-3 rounded-xl transition-colors hover:bg-secondary flex items-center gap-3 text-muted-foreground"
                >
                  <Shield className="h-5 w-5" />
                  Privacy Policy
                </Link>
              </div>
            </nav>
          </SheetContent>
        </Sheet>

        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <span className={`font-display text-2xl md:text-3xl font-bold tracking-tight transition-colors ${textColor}`}>
            LUXE
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-10">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              to={link.href}
              className={`text-sm font-medium tracking-wide transition-colors link-underline ${textColor} hover:text-accent ${
                location.pathname === link.href ? 'text-accent' : ''
              }`}
            >
              {link.name}
            </Link>
          ))}
          {isAdmin && (
            <Link
              to="/admin"
              className={`text-sm font-medium tracking-wide transition-colors link-underline ${textColor} hover:text-accent`}
            >
              Admin
            </Link>
          )}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {/* Search */}
          {isSearchOpen ? (
            <ProductSearch 
              textColor={textColor} 
              onClose={() => setIsSearchOpen(false)}
              isOpen={isSearchOpen}
            />
          ) : (
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setIsSearchOpen(true)}
              className={`rounded-full ${textColor} hover:bg-foreground/10`}
            >
              <Search className="h-5 w-5" />
            </Button>
          )}

          {/* Wishlist */}
          {user && (
            <Button 
              variant="ghost" 
              size="icon" 
              asChild 
              className={`rounded-full hidden md:flex ${textColor} hover:bg-foreground/10`}
            >
              <Link to="/wishlist">
                <Heart className="h-5 w-5" />
              </Link>
            </Button>
          )}

          {/* Cart */}
          <Button 
            variant="ghost" 
            size="icon" 
            className={`rounded-full relative ${textColor} hover:bg-foreground/10`} 
            asChild
          >
            <Link to="/cart">
              <ShoppingBag className="h-5 w-5" />
              {totalItems > 0 && (
                <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-accent text-accent-foreground text-xs rounded-full animate-scale-in">
                  {totalItems}
                </Badge>
              )}
            </Link>
          </Button>

          {/* User Menu */}
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon"
                  className={`rounded-full ${textColor} hover:bg-foreground/10`}
                >
                  <User className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 bg-popover border-border">
                <DropdownMenuItem asChild>
                  <Link to="/orders" className="flex items-center gap-2 cursor-pointer">
                    <Package className="h-4 w-4" />
                    My Orders
                  </Link>
                </DropdownMenuItem>
                {isAdmin && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link to="/admin" className="flex items-center gap-2 cursor-pointer text-accent">
                        <Settings className="h-4 w-4" />
                        Admin Panel
                      </Link>
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="flex items-center gap-2 cursor-pointer text-destructive">
                  <LogOut className="h-4 w-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button 
              asChild 
              className="bg-accent hover:bg-accent/90 text-accent-foreground rounded-full px-6 ml-2 hidden md:flex"
            >
              <Link to="/auth">Sign In</Link>
            </Button>
          )}

          {!user && (
            <Button 
              variant="ghost" 
              size="icon" 
              asChild 
              className={`rounded-full md:hidden ${textColor}`}
            >
              <Link to="/auth">
                <User className="h-5 w-5" />
              </Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
