import { createContext } from 'react';

export type PortalDropdownContextValue = {
  close: () => void;
};

export const PortalDropdownContext = createContext<PortalDropdownContextValue>({
  close: () => {
    // no-op default; replaced by provider before any consumer reads it
  },
});
