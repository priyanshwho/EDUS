import React, { useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Info, Briefcase, Phone, Sparkles } from 'lucide-react';
import { InteractiveMenu } from '../ui/modern-mobile-menu';

const MobileBottomBar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const items = useMemo(() => [
    { label: 'Home', icon: Home, path: '/' },
    { label: 'About', icon: Info, path: '/about' },
    { label: 'Services', icon: Briefcase, path: '/services' },
    { label: 'Contact', icon: Phone, path: '/contact' },
    { label: 'AI', icon: Sparkles, path: '/ai' },
  ], []);

  // Determine active index based on current path
  const activeIndex = useMemo(() => {
    const index = items.findIndex(item => {
      if (item.path === '/') return location.pathname === '/';
      return location.pathname.startsWith(item.path);
    });
    return index !== -1 ? index : 0;
  }, [location.pathname, items]);

  const handleSelect = (item) => {
    navigate(item.path);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[100] block md:hidden pb-safe">
      <div className="bg-n-8/90 backdrop-blur-md border-t border-n-6 shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
        <InteractiveMenu 
          items={items} 
          defaultActiveIndex={activeIndex}
          onSelect={handleSelect}
          accentColor="#0ea5e9" // blue-500 matching our new theme
        />
      </div>
    </div>
  );
};

export default MobileBottomBar;
