import { Link } from 'react-router-dom';
import { Facebook, Instagram, Twitter } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t bg-secondary/30">
      <div className="container py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <Link to="/" className="font-display text-2xl font-bold">
              LUXE
            </Link>
            <p className="text-sm text-muted-foreground">
              Premium fashion destination for the modern style-conscious individual.
            </p>
            <div className="flex gap-4">
              <a href="#" className="text-muted-foreground hover:text-accent transition-colors">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="#" className="text-muted-foreground hover:text-accent transition-colors">
                <Instagram className="h-5 w-5" />
              </a>
              <a href="#" className="text-muted-foreground hover:text-accent transition-colors">
                <Twitter className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Shop */}
          <div className="space-y-4">
            <h4 className="font-semibold">Shop</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/products" className="hover:text-foreground transition-colors">All Products</Link></li>
              <li><Link to="/categories" className="hover:text-foreground transition-colors">Categories</Link></li>
              <li><Link to="/products?featured=true" className="hover:text-foreground transition-colors">Featured</Link></li>
              <li><Link to="/products?sale=true" className="hover:text-foreground transition-colors">Sale</Link></li>
            </ul>
          </div>

          {/* Account */}
          <div className="space-y-4">
            <h4 className="font-semibold">Account</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/profile" className="hover:text-foreground transition-colors">My Profile</Link></li>
              <li><Link to="/orders" className="hover:text-foreground transition-colors">My Orders</Link></li>
              <li><Link to="/wishlist" className="hover:text-foreground transition-colors">Wishlist</Link></li>
              <li><Link to="/cart" className="hover:text-foreground transition-colors">Cart</Link></li>
            </ul>
          </div>

          {/* Support */}
          <div className="space-y-4">
            <h4 className="font-semibold">Support</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="#" className="hover:text-foreground transition-colors">Contact Us</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors">Shipping Info</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors">Returns</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors">FAQ</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t mt-8 pt-8 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} LUXE. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
