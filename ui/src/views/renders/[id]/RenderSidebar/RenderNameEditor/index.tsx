import { Spinner } from 'flowbite-react';
import { useRender } from '@/hooks/useRender';
import { RenameForm } from './RenameForm';

export type RenderNameEditorProps = {
  renderID: number;
};

export function RenderNameEditor(props: RenderNameEditorProps) {
  const { renderID } = props;

  const {
    data: render,
    isLoading: isRenderLoading,
    isError: isRenderError,
    error: renderError,
  } = useRender({ renderID });

  if (isRenderLoading) {
    return <Spinner size="md" className="fill-zinc-400" />;
  }

  if (isRenderError) {
    return <p className="text-sm text-red-500">Error loading render: {renderError.message}</p>;
  }

  if (!render) {
    return null;
  }

  return <RenameForm currentName={render.config.name} renderID={renderID} />;
}
