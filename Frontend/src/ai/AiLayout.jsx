import React from 'react';
import { Outlet } from 'react-router-dom';
import PauseOverlay from './components/common/PauseOverlay';

import DashboardBackground from '../components/design/DashboardBackground';

const AiLayout = () => {
  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-[#0b1021] via-[#0E0C15] to-[#1a1025] text-n-1">
      <DashboardBackground />
      <div className="relative z-10 h-full">
        <PauseOverlay />
        <Outlet />
      </div>
    </div>
  );
};

export default AiLayout;
