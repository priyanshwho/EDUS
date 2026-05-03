import React from 'react';
import AiRoutes from '../ai/AiRoutes';
import { SessionProvider } from '../ai/context/SessionContext';

const Eduai = () => {
  return (
    <div className="min-h-screen bg-background text-text">
      <SessionProvider>
        <AiRoutes />
      </SessionProvider>
    </div>
  );
};

export default Eduai;
