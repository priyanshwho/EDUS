import React, { createContext, useReducer, useEffect, useContext } from 'react';
import { initialState, sessionReducer } from './sessionReducer';

const SessionContext = createContext();

export const SessionProvider = ({ children }) => {
  const [state, dispatch] = useReducer(sessionReducer, initialState, (initial) => {
    const saved = localStorage.getItem('edusphere_session');
    return saved ? JSON.parse(saved) : initial;
  });

  useEffect(() => {
    localStorage.setItem('edusphere_session', JSON.stringify(state));
  }, [state]);

  return (
    <SessionContext.Provider value={{ state, dispatch }}>
      {children}
    </SessionContext.Provider>
  );
};

export const useSession = () => {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
};
