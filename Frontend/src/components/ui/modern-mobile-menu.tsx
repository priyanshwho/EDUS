import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Home, Briefcase, Calendar, Shield, Settings } from 'lucide-react';

type IconComponentType = React.ElementType<{ className?: string }>;
export interface InteractiveMenuItem {
  label: string;
  icon: IconComponentType;
}

export interface InteractiveMenuProps {
  items?: InteractiveMenuItem[];
  accentColor?: string;
  defaultActiveIndex?: number;
  onSelect?: (item: InteractiveMenuItem, index: number) => void;
}

const defaultItems: InteractiveMenuItem[] = [
    { label: 'home', icon: Home },
    { label: 'strategy', icon: Briefcase },
    { label: 'period', icon: Calendar },
    { label: 'security', icon: Shield },
    { label: 'settings', icon: Settings },
];

const defaultAccentColor = 'var(--component-active-color-default)';

const InteractiveMenu: React.FC<InteractiveMenuProps> = ({ items, accentColor, defaultActiveIndex = 0, onSelect }) => {

  const finalItems = useMemo(() => {
     const isValid = items && Array.isArray(items) && items.length >= 2 && items.length <= 5;
     if (!isValid) {
        console.warn("InteractiveMenu: 'items' prop is invalid or missing. Using default items.", items);
        return defaultItems;
     }
     return items;
  }, [items]);

  const [activeIndex, setActiveIndex] = useState(defaultActiveIndex);

  useEffect(() => {
    setActiveIndex(defaultActiveIndex);
  }, [defaultActiveIndex]);

  useEffect(() => {
      if (activeIndex >= finalItems.length) {
          setActiveIndex(0);
      }
  }, [finalItems, activeIndex]);

  const textRefs = useRef<(HTMLElement | null)[]>([]);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);

  useEffect(() => {
    const setLineWidth = () => {
      if (activeIndex < 0) return;
      const activeItemElement = itemRefs.current[activeIndex];
      const activeTextElement = textRefs.current[activeIndex];

      if (activeItemElement && activeTextElement) {
        const textWidth = activeTextElement.offsetWidth;
        activeItemElement.style.setProperty('--lineWidth', `${textWidth}px`);
      }
    };

    setLineWidth();

    window.addEventListener('resize', setLineWidth);
    return () => {
      window.removeEventListener('resize', setLineWidth);
    };
  }, [activeIndex, finalItems]);

  const handleItemClick = (index: number) => {
    setActiveIndex(index);
    if (onSelect) {
      onSelect(finalItems[index], index);
    }
  };

  const navStyle = useMemo(() => {
      const activeColor = accentColor || defaultAccentColor;
      return { '--component-active-color': activeColor } as React.CSSProperties;
  }, [accentColor]); 

  return (
    <nav
      className="flex w-full items-center justify-between px-2 py-3 bg-transparent"
      role="navigation"
      style={navStyle}
    >
      {finalItems.map((item, index) => {
        const isActive = index === activeIndex;
        const isTextActive = isActive;


        const IconComponent = item.icon;

        return (
          <button
            key={item.label}
            className={`group relative flex flex-col items-center justify-center rounded-2xl transition-all duration-300 ease-out w-14 h-14 ${
              isActive 
                ? 'bg-cyan-500/15 text-cyan-400' 
                : 'text-n-4 hover:bg-n-7/50 hover:text-n-1'
            }`}
            onClick={() => handleItemClick(index)}
            ref={(el) => (itemRefs.current[index] = el)}
          >
            <div className={`flex items-center justify-center z-10 transition-transform duration-300 ${isActive || 'group-hover' ? (isActive ? '-translate-y-2.5' : 'group-hover:-translate-y-2.5') : ''}`}>
              <IconComponent className={`w-5 h-5 transition-transform duration-300 ${isActive ? 'animate-[iconBounce_0.5s_ease-out]' : 'group-hover:scale-110'}`} />
            </div>
            
            {/* The Text Label - Visible when active or on hover */}
            <div 
              className={`absolute bottom-2 overflow-hidden transition-all duration-300 ease-out whitespace-nowrap font-semibold text-[10px] flex items-center justify-center ${
                isActive 
                  ? 'opacity-100 translate-y-0 scale-100' 
                  : 'opacity-0 translate-y-2 scale-95 group-hover:opacity-100 group-hover:translate-y-0 group-hover:scale-100'
              }`}
            >
              {item.label}
            </div>
          </button>
        );
      })}
    </nav>
  );
};

export {InteractiveMenu}