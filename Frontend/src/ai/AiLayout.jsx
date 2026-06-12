import React from 'react';
import { Outlet } from 'react-router-dom';
import PauseOverlay from './components/common/PauseOverlay';

const AiLayout = () => {
  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--edus-bg)', color: '#fff' }}>
      <PauseOverlay />
      <Outlet />
    </div>
  );
};

export default AiLayout;
