import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { RoutePath } from '../types/barbershop';

const VALID_ROUTES: RoutePath[] = [
  '/',
  '/services',
  '/barbers',
  '/gallery',
  '/booking',
  '/contacts',
  '/admin',
];

function normalizeRoute(pathname: string): RoutePath {
  const clean = pathname.replace(/\/+$/, '') || '/';
  return VALID_ROUTES.includes(clean as RoutePath) ? (clean as RoutePath) : '/';
}

interface BookingPrefill {
  serviceId?: string | null;
  barberId?: string | null;
}

interface AppContextValue {
  currentPath: RoutePath;
  navigate: (path: RoutePath, prefill?: BookingPrefill) => void;
  preselectedServiceId: string | null;
  preselectedBarberId: string | null;
  clearBookingPrefill: () => void;
  toastMessage: string | null;
  showToast: (message: string) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentPath, setCurrentPath] = useState<RoutePath>(() =>
    normalizeRoute(window.location.pathname)
  );
  const [preselectedServiceId, setPreselectedServiceId] = useState<string | null>(null);
  const [preselectedBarberId, setPreselectedBarberId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(normalizeRoute(window.location.pathname));
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const showToast = useCallback((message: string) => {
    setToastMessage(message);
    window.setTimeout(() => {
      setToastMessage((prev) => (prev === message ? null : prev));
    }, 3200);
  }, []);

  const navigate = useCallback((path: RoutePath, prefill?: BookingPrefill) => {
    if (prefill?.serviceId !== undefined) {
      setPreselectedServiceId(prefill.serviceId);
    }
    if (prefill?.barberId !== undefined) {
      setPreselectedBarberId(prefill.barberId);
    }

    if (window.location.pathname !== path) {
      window.history.pushState({}, '', path);
    }
    setCurrentPath(path);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const clearBookingPrefill = useCallback(() => {
    setPreselectedServiceId(null);
    setPreselectedBarberId(null);
  }, []);

  return (
    <AppContext.Provider
      value={{
        currentPath,
        navigate,
        preselectedServiceId,
        preselectedBarberId,
        clearBookingPrefill,
        toastMessage,
        showToast,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) {
    throw new Error('useApp must be used within AppProvider');
  }
  return ctx;
}
