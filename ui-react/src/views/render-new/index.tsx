import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '@tanstack/react-form';
import { Sidebar, SidebarItems, SidebarItemGroup, Spinner, Button } from 'flowbite-react';
import Separator from '../../components/Separator';
import Controls from './Controls';
import Scene from './Scene';
import { useAuth } from '../../utils/auth';
import { postRender } from '../../utils/api';
import { useRenderForm } from '../../hooks/useRenderForm';

export default function NewRenderPage() {
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const [isCreatingRender, setIsCreatingRender] = useState(false);

  // Canvas container sizing
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

  // TanStack Form

  const form = useRenderForm({ user: user! });
  // Canvas sizing: maintain aspect ratio in container
  const imageDimensions = useStore(form.store, (state) => state.values.parameters.image_dimensions);
  const aspectRatio = imageDimensions[0] / imageDimensions[1];
  const formValuesForSubmit = useStore(form.store, (state) => state.values);

  let canvasWidth = 0;
  let canvasHeight = 0;
  if (containerWidth && containerHeight) {
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
      const response = await postRender(token!, formValuesForSubmit);
      navigate(`/renders/${response.id}`);
    } catch {
      setIsCreatingRender(false);
    }
  }

  return (
    <div className="flex h-full w-full">
      <Sidebar className="z-10 w-lg bg-zinc-900! [&>div]:bg-zinc-900!">
        <SidebarItems>
          <SidebarItemGroup>
            <div className="flex min-h-full flex-col items-stretch gap-2">
              <Controls form={form} />
              <Separator className="mt-auto" />
              <Button onClick={handleCreateRender} disabled={isCreatingRender} color="default">
                {isCreatingRender ? (
                  <span className="flex items-center justify-center gap-2">
                    <Spinner size="sm" />
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

      {/* 3D scene canvas placeholder — replaced by Phase 6 */}
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
