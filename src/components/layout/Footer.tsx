import { Link } from 'react-router-dom';
import { Facebook, Instagram, Twitter, Mail, MapPin, Phone } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-primary text-primary-foreground">
      <div className="container py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Brand */}
          <div className="lg:col-span-1">
            <Link to="/" className="font-display text-3xl font-bold mb-6 block">
              LUXE
            </Link>
            <p className="text-primary-foreground/70 mb-6 leading-relaxed">
              Discover premium fashion pieces designed for the modern individual. Quality meets style.
            </p>
            <div className="flex gap-4">
              {[Instagram, Facebook, Twitter].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="h-10 w-10 rounded-full bg-primary-foreground/10 flex items-center justify-center hover:bg-accent hover:text-accent-foreground transition-colors duration-300"
                >
                  <Icon className="h-5 w-5" />
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-display text-xl font-semibold mb-6">Quick Links</h4>
            <ul className="space-y-4">
              {[
                { name: 'All Products', href: '/products' },
                { name: 'Categories', href: '/categories' },
                { name: 'Featured', href: '/products?featured=true' },
                { name: 'Sale', href: '/products?sale=true' },
              ].map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.href}
                    className="text-primary-foreground/70 hover:text-accent transition-colors duration-300 link-underline"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Account */}
          <div>
            <h4 className="font-display text-xl font-semibold mb-6">Account</h4>
            <ul className="space-y-4">
              {[
                { name: 'My Orders', href: '/orders' },
                { name: 'Wishlist', href: '/wishlist' },
                { name: 'Cart', href: '/cart' },
                { name: 'Sign In', href: '/auth' },
              ].map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.href}
                    className="text-primary-foreground/70 hover:text-accent transition-colors duration-300 link-underline"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-display text-xl font-semibold mb-6">Contact</h4>
            <ul className="space-y-4">
              <li className="flex items-start gap-3 text-primary-foreground/70">
                <MapPin className="h-5 w-5 mt-0.5 flex-shrink-0" />
                <span>123 Fashion Street, Mumbai, India 400001</span>
              </li>
              <li className="flex items-center gap-3 text-primary-foreground/70">
                <Phone className="h-5 w-5 flex-shrink-0" />
                <span>+91 98765 43210</span>
              </li>
              <li className="flex items-center gap-3 text-primary-foreground/70">
                <Mail className="h-5 w-5 flex-shrink-0" />
                <span>hello@luxe.com</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-primary-foreground/10">
        <div className="container py-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-primary-foreground/50 text-sm">
            © {new Date().getFullYear()} LUXE. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <a href="#" className="text-primary-foreground/50 text-sm hover:text-primary-foreground transition-colors">
              Privacy Policy
            </a>
            <a href="#" className="text-primary-foreground/50 text-sm hover:text-primary-foreground transition-colors">
              Terms of Service
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
