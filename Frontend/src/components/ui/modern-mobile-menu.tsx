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
      if (activeIndex >= finalItems.length) {
          setActiveIndex(0);
      }
  }, [finalItems, activeIndex]);

  const textRefs = useRef<(HTMLElement | null)[]>([]);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);

  useEffect(() => {
    const setLineWidth = () => {
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
            className={`group relative flex items-center justify-center rounded-full transition-all duration-300 ease-out px-4 py-2 ${
              isActive 
                ? 'bg-cyan-500/15 text-cyan-400' 
                : 'text-n-4 hover:bg-n-7/50 hover:text-n-1'
            }`}
            onClick={() => handleItemClick(index)}
            ref={(el) => (itemRefs.current[index] = el)}
          >
            <div className="flex items-center justify-center z-10">
              <IconComponent className={`w-6 h-6 transition-transform duration-300 ${isActive ? 'animate-[iconBounce_0.5s_ease-out]' : 'group-hover:scale-110'}`} />
            </div>
            
            {/* The Text Label - Visible when active or on hover */}
            <div 
              className={`overflow-hidden transition-all duration-300 ease-in-out whitespace-nowrap font-medium text-sm flex items-center ${
                isActive 
                  ? 'opacity-100 ml-2 max-w-[100px]' 
                  : 'opacity-0 max-w-0 ml-0 group-hover:opacity-100 group-hover:max-w-[100px] group-hover:ml-2'
              }`}
              ref={(el) => (textRefs.current[index] = el)}
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