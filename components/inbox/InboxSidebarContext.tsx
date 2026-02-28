'use client';

import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from 'react';

export interface InboxSidebarContextValue {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
}

const InboxSidebarContext = createContext<InboxSidebarContextValue | null>(null);

export function InboxSidebarProvider({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const toggleSidebar = useCallback(() => {
    setSidebarOpen((prev) => !prev);
  }, []);

  return (
    <InboxSidebarContext.Provider
      value={{ sidebarOpen, setSidebarOpen, toggleSidebar }}
    >
      {children}
    </InboxSidebarContext.Provider>
  );
}

export function useInboxSidebar(): InboxSidebarContextValue {
  const ctx = useContext(InboxSidebarContext);
  if (!ctx) {
    throw new Error('useInboxSidebar must be used within InboxSidebarProvider');
  }
  return ctx;
}
