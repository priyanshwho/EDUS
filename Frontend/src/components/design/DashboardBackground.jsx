import React from 'react';
import { Rings, SideLines, BackgroundCircles } from './Header';

const DashboardBackground = () => {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
      <Rings />
      <SideLines />
      <BackgroundCircles />
      
      {/* Soft gradient overlay to enhance depth */}
      <div className="absolute inset-0 bg-gradient-to-t from-n-8/80 via-transparent to-n-8/20" />
    </div>
  );
};

export default DashboardBackground;
