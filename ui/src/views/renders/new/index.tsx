import { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/providers/Auth';
import { useRenderForm } from '@/hooks/useRenderForm';
import { NewRenderSidebar } from './NewRenderSidebar';
import { Scene } from './Scene';
import type { NormalizedRenderConfig } from '@/utils/render/config';
import { useSelector } from '@tanstack/react-store';

export function NewRenderPage() {
  const { user } = useAuth();
  const location = useLocation();
  const importedConfig = location.state?.importedConfig as NormalizedRenderConfig | undefined;

  // canvas container sizing
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const [containerHeight, setContainerHeight] = useState(0);

  // ResizeObserver for canvas container
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

  const form = useRenderForm({ user, initialValues: importedConfig });

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
  );
}
