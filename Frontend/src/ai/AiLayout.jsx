import React from 'react';
import { Outlet } from 'react-router-dom';
import PauseOverlay from './components/common/PauseOverlay';

const AiLayout = () => {
  return (
    <>
      <PauseOverlay />
      <Outlet />
    </>
  );
};

export default AiLayout;
