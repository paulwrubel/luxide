import { useState, useRef, useEffect, useCallback } from 'react';
import { useAuth } from '@/providers/Auth';
import { useRenderForm } from '@/hooks/useRenderForm';
import { NewRenderSidebar } from './NewRenderSidebar';
import { Scene } from './Scene';
import { useSelector } from '@tanstack/react-store';
import { GizmoProvider } from '@/providers/Gizmo';

export function NewRenderPage() {
  const { user } = useAuth();

  // canvas container sizing
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const [containerHeight, setContainerHeight] = useState(0);

  // resize observer for canvas container
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const observer = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      setContainerWidth(width);
      setContainerHeight(height);
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  const form = useRenderForm({ user });

  const handleQuaternionChange = useCallback(
    (geometricName: string, q: [number, number, number, number]) => {
      form.setFieldValue(`geometrics.${geometricName}.quaternion` as never, q as never);
    },
    [form],
  );

  // canvas sizing - maintain aspect ratio in container
  const imageDimensions = useSelector(
    form.store,
    (state) => state.values.parameters.image_dimensions,
  );
  const aspectRatio = imageDimensions[0] / imageDimensions[1];

  let canvasWidth = 0;
  let canvasHeight = 0;
  if (containerWidth > 0 && containerHeight > 0) {
    const containerAspectRatio = containerWidth / containerHeight;
    if (containerAspectRatio > aspectRatio) {
      canvasHeight = containerHeight;
      canvasWidth = containerHeight * aspectRatio;
    } else {
      canvasWidth = containerWidth;
      canvasHeight = containerWidth / aspectRatio;
    }
  }

  return (
    <GizmoProvider onQuaternionChange={handleQuaternionChange}>
      <div className="flex h-full w-full">
        <NewRenderSidebar form={form} />
        <div ref={containerRef} className="m-8 flex flex-1 items-center justify-center">
          <div
            style={{ width: canvasWidth, height: canvasHeight }}
            className="box-border border border-zinc-500"
          >
            {canvasWidth > 0 && canvasHeight > 0 && <Scene form={form} />}
          </div>
        </div>
      </div>
    </GizmoProvider>
  );
}
