import React, { createContext, useContext, useState, useCallback } from 'react';

export interface PoliciesNavValue {
  activeId: string;
  onSelectSection: (id: string) => void;
}

const PoliciesNavContext = createContext<{
  policiesNav: PoliciesNavValue | null;
  setPoliciesNav: (v: PoliciesNavValue | null) => void;
}>({
  policiesNav: null,
  setPoliciesNav: () => {},
});

export function PoliciesNavProvider({ children }: { children: React.ReactNode }) {
  const [policiesNav, setPoliciesNav] = useState<PoliciesNavValue | null>(null);
  return (
    <PoliciesNavContext.Provider value={{ policiesNav, setPoliciesNav }}>
      {children}
    </PoliciesNavContext.Provider>
  );
}

export function usePoliciesNav() {
  return useContext(PoliciesNavContext);
}
