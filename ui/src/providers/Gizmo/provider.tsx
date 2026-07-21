import { useState, useCallback, useMemo } from 'react';
import { GizmoContext } from './context';
import type { GizmoContextType } from './context';

export type GizmoProviderProps = {
  children: React.ReactNode;
  onQuaternionChange: (geometricName: string, quaternion: [number, number, number, number]) => void;
};

export function GizmoProvider(props: GizmoProviderProps) {
  const { children, onQuaternionChange } = props;

  const [activeGizmos, setActiveGizmos] = useState<ReadonlySet<string>>(new Set());

  const toggleGizmo = useCallback((name: string) => {
    setActiveGizmos((prev) => {
      const next = new Set(prev);
      if (next.has(name)) {
        next.delete(name);
      } else {
        next.add(name);
      }
      return next;
    });
  }, []);

  const value = useMemo<GizmoContextType>(
    () => ({ activeGizmos, toggleGizmo, onQuaternionChange }),
    [activeGizmos, toggleGizmo, onQuaternionChange],
  );

  return <GizmoContext.Provider value={value}>{children}</GizmoContext.Provider>;
}
