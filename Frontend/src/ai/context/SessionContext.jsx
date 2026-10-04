import React, { createContext, useReducer, useEffect, useContext } from 'react';
import { initialState, sessionReducer } from './sessionReducer';

const SessionContext = createContext();

export const SessionProvider = ({ children }) => {
  const [state, dispatch] = useReducer(sessionReducer, initialState, (initial) => {
    try {
      const saved = localStorage.getItem('edusphere_session');
      if (!saved) return initial;
      const parsed = JSON.parse(saved);
      if (parsed?.semester && !/\d/.test(String(parsed.semester))) {
        parsed.semester = null;
      }
      return { ...initial, ...parsed };
    } catch (e) {
      console.error('Failed to parse session from localStorage', e);
      return initial;
    }
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
