import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

// Custom Meesho-style icons as SVG components
const HomeIcon = ({ active }: { active: boolean }) => (
  <svg viewBox="0 0 24 24" className="h-6 w-6" fill={active ? "#9333ea" : "none"} stroke={active ? "#9333ea" : "currentColor"} strokeWidth="1.5">
    <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1h-5v-6H9v6H4a1 1 0 01-1-1V9.5z" />
  </svg>
);

const CategoriesIcon = ({ active }: { active: boolean }) => (
  <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke={active ? "#9333ea" : "currentColor"} strokeWidth="1.5">
    <rect x="4" y="3" width="16" height="4" rx="1" />
    <path d="M6 10h12v11H6z" />
    <path d="M10 10v11M14 10v11" />
    <circle cx="12" cy="7" r="0.5" fill="currentColor" />
  </svg>
);

const MallIcon = ({ active }: { active: boolean }) => (
  <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke={active ? "#9333ea" : "currentColor"} strokeWidth="1.5">
    <path d="M12 2l8 4v6c0 5.5-3.5 10-8 11-4.5-1-8-5.5-8-11V6l8-4z" />
    <path d="M9 12l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const VideoFindsIcon = ({ active }: { active: boolean }) => (
  <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke={active ? "#9333ea" : "currentColor"} strokeWidth="1.5">
    <rect x="3" y="4" width="18" height="16" rx="2" />
    <line x1="3" y1="8" x2="21" y2="8" />
    <line x1="7" y1="4" x2="7" y2="8" />
    <line x1="17" y1="4" x2="17" y2="8" />
    <polygon points="10,12 10,17 15,14.5" fill={active ? "#9333ea" : "currentColor"} stroke="none" />
  </svg>
);

const OrdersIcon = ({ active }: { active: boolean }) => (
  <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke={active ? "#9333ea" : "currentColor"} strokeWidth="1.5">
    <path d="M20 7H4a1 1 0 00-1 1v12a1 1 0 001 1h16a1 1 0 001-1V8a1 1 0 00-1-1z" />
    <path d="M16 7V5a4 4 0 00-8 0v2" />
    <line x1="3" y1="11" x2="21" y2="11" />
  </svg>
);

export function MobileBottomNav() {
  const location = useLocation();
  const { user } = useAuth();

  const navItems = [
    { icon: HomeIcon, label: 'Home', href: '/', active: location.pathname === '/' },
    { icon: CategoriesIcon, label: 'Categories', href: '/categories', active: location.pathname === '/categories' },
    { icon: MallIcon, label: 'Mall', href: '/products', active: location.pathname === '/products' },
    { icon: VideoFindsIcon, label: 'Video Finds', href: '/products?featured=true', active: false },
    { icon: OrdersIcon, label: 'My Orders', href: user ? '/orders' : '/auth', active: location.pathname === '/orders' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 md:hidden" style={{ position: 'fixed' }}>
      <div className="flex items-center justify-around py-2 pb-safe">
        {navItems.map((item) => (
          <Link
            key={item.label}
            to={item.href}
            className={`flex flex-col items-center gap-0.5 px-2 py-1 min-w-[56px] ${
              item.active ? 'text-purple-600' : 'text-gray-500'
            }`}
          >
            <item.icon active={item.active} />
            <span className={`text-[10px] font-medium ${item.active ? 'text-purple-600' : 'text-gray-500'}`}>
              {item.label}
            </span>
          </Link>
        ))}
      </div>
    </nav>
  );
}
