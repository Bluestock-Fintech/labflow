import { createContext, useContext, useEffect } from 'react';

// Lets a page (e.g. FloorsPage while its Add/Edit form is open) hide the
// mobile top bar to reclaim vertical space, without changing route.
export const OwnerLayoutChromeContext = createContext(() => {});

export function useHideMobileHeader(hidden) {
  const setHidden = useContext(OwnerLayoutChromeContext);
  useEffect(() => {
    setHidden(hidden);
    return () => setHidden(false);
  }, [hidden, setHidden]);
}
