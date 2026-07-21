import { useContext } from 'react';
import { GizmoContext } from './context';
import type { GizmoContextType } from './context';

export function useGizmo(): GizmoContextType {
  const context = useContext(GizmoContext);
  if (context === null) {
    throw new Error('useGizmo must be used within GizmoProvider');
  }
  return context;
}
