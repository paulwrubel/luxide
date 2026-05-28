import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '@tanstack/react-form';
import {
  Sidebar,
  SidebarItems,
  SidebarItemGroup,
  Spinner,
  Button,
  type SidebarTheme,
} from 'flowbite-react';
import { Separator } from '@/components/Separator';
import type { DeepPartial } from 'flowbite-react/types';
import { Controls } from './Controls';
import { Scene } from './Scene';
import { useAuth } from '@/providers/auth';
import { postRender } from '@/utils/api';
import { useRenderForm } from '@/hooks/useRenderForm';

export function NewRenderPage() {
  const navigate = useNavigate();
  const { user, mustGetToken } = useAuth();
  const token = mustGetToken();

  const [isCreatingRender, setIsCreatingRender] = useState(false);

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

  const form = useRenderForm({ user });

  // canvas sizing - maintain aspect ratio in container
  const imageDimensions = useStore(form.store, (state) => state.values.parameters.image_dimensions);
  const aspectRatio = imageDimensions[0] / imageDimensions[1];
  const formValuesForSubmit = useStore(form.store, (state) => state.values);

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

  async function handleCreateRender() {
    setIsCreatingRender(true);
    try {
      const response = await postRender(token, formValuesForSubmit);
      navigate(`/renders/${response.id}`);
    } catch {
      setIsCreatingRender(false);
    }
  }

  const sidebarTheme: DeepPartial<SidebarTheme> = {
    root: {
      base: 'bg-zinc-900 dark:bg-zinc-900',
      inner: 'bg-zinc-900 dark:bg-zinc-900',
    },
  };

  return (
    <div className="flex h-full w-full">
      <Sidebar theme={sidebarTheme} className="z-10 h-full w-lg">
        <SidebarItems className="h-full">
          <SidebarItemGroup className="flex h-full flex-col">
            <div className="mb-0 flex flex-1 flex-col gap-2 overflow-y-auto">
              <Controls form={form} />
            </div>
            <div className="mt-0 flex flex-col gap-2">
              <Separator className="mt-0" />
              <Button onClick={handleCreateRender} disabled={isCreatingRender} color="default">
                {isCreatingRender ? (
                  <span className="flex items-center justify-center gap-2">
                    <Spinner size="sm" color="info" />
                    Creating...
                  </span>
                ) : (
                  'Create Render'
                )}
              </Button>
            </div>
          </SidebarItemGroup>
        </SidebarItems>
      </Sidebar>

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
