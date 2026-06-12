import React, { useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Info, Briefcase, Phone } from 'lucide-react';
import { InteractiveMenu } from '../ui/modern-mobile-menu';
import eduAiImg from '../../assets/eduai.png';

const EduAiIcon = ({ className }) => <img src={eduAiImg} className={className} alt="Edu AI" />;

const MobileBottomBar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const items = useMemo(() => [
    { label: 'Home', icon: Home, path: '/' },
    { label: 'About', icon: Info, path: '/about' },
    { label: 'Services', icon: Briefcase, path: '/services' },
    { label: 'Contact', icon: Phone, path: '/contact' },
    { label: 'AI', icon: EduAiIcon, path: '/ai' },
  ], []);

  // Determine active index based on current path
  const activeIndex = useMemo(() => {
    const index = items.findIndex(item => {
      if (item.path === '/') return location.pathname === '/';
      return location.pathname.startsWith(item.path);
    });
    return index;
  }, [location.pathname, items]);

  const handleSelect = (item) => {
    navigate(item.path);
  };

  return (
    <div className="fixed bottom-6 left-4 right-4 z-[100] block md:hidden">
      <div className="bg-n-8/85 backdrop-blur-xl border border-n-6/50 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.5)] overflow-hidden">
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
