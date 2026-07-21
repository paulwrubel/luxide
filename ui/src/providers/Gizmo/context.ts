import { createContext } from 'react';

export type GizmoContextType = {
  activeGizmos: ReadonlySet<string>;
  toggleGizmo: (name: string) => void;
  onQuaternionChange: (geometricName: string, quaternion: [number, number, number, number]) => void;
};

export const GizmoContext = createContext<GizmoContextType | null>(null);
