/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useCallback } from 'react';

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([]);

  const push = useCallback((msg, opts={}) => {
    const id = Date.now() + '-' + Math.random().toString(16).slice(2);
    const n = { id, msg, type: opts.type || 'info', ts: Date.now() };
    setNotifications(prev => [...prev, n]);
    // auto dismiss
    const ttl = opts.ttl ?? 5000;
    setTimeout(() => {
      setNotifications(prev => prev.filter(x => x.id !== id));
    }, ttl);
  }, []);

  const value = { notifications, push };
  return (
    <NotificationContext.Provider value={value}>
      {children}
      <div className="fixed bottom-4 right-4 flex flex-col gap-2 z-50">
        {notifications.map(n => (
          <div key={n.id} className={`px-3 py-2 rounded shadow text-sm bg-white/90 backdrop-blur border ${n.type==='error' ? 'border-rose-400' : n.type==='success' ? 'border-emerald-400' : 'border-slate-300'}`}> {n.msg}</div>
        ))}
      </div>
    </NotificationContext.Provider>
  );
}

export const useNotifications = () => useContext(NotificationContext);

// Exporting both provider and hook from the same file is intentional.
// The Fast Refresh rule is disabled above to allow this pattern without errors.
