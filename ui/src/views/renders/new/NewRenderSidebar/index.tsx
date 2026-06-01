import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from '@tanstack/react-store';
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
import { Controls } from '../Controls';
import { useAuth } from '@/providers/auth';
import { postRender } from '@/utils/api';
import type { RenderForm } from '@/hooks/useRenderForm';
import { ViewConfigJSONButton } from './ViewConfigJSONButton';
import { ConfigJSONModal } from '@/components/ViewRenderJSONButton/ConfigJSONModal';

export interface NewRenderSidebarProps {
  form: RenderForm;
}

export function NewRenderSidebar({ form }: NewRenderSidebarProps) {
  const [showModal, setShowModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isCreatingRender, setIsCreatingRender] = useState(false);

  const formValues = useSelector(form.store, (state) => state.values);
  const configName = useSelector(form.store, (state) => state.values.name);

  const jsonString = JSON.stringify(formValues, null, 2);

  const handleDownload = useCallback(() => {
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${configName || 'render-config'}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [jsonString, configName]);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(jsonString);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard write failed — silently ignore
    }
  }, [jsonString]);

  const navigate = useNavigate();
  const { mustGetToken } = useAuth();

  async function handleCreateRender() {
    setIsCreatingRender(true);
    try {
      const response = await postRender(mustGetToken(), formValues);
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
    <>
      <Sidebar theme={sidebarTheme} className="z-10 h-full w-lg">
        <SidebarItems className="h-full">
          <SidebarItemGroup className="flex h-full flex-col">
            <div className="mb-0 flex flex-1 flex-col gap-2 overflow-y-auto">
              <Controls form={form} />
            </div>
            <div className="mt-0 flex flex-col gap-2">
              <Separator className="mt-0" />
              <div className="flex gap-2 px-4">
                <ViewConfigJSONButton onClick={() => setShowModal(true)} />
                <Button
                  onClick={handleCreateRender}
                  disabled={isCreatingRender}
                  color="default"
                  className="flex-1"
                >
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
            </div>
          </SidebarItemGroup>
        </SidebarItems>
      </Sidebar>

      <ConfigJSONModal
        show={showModal}
        onClose={() => setShowModal(false)}
        jsonString={jsonString}
        copied={copied}
        onCopy={handleCopy}
        onDownload={handleDownload}
      />
    </>
  );
}
