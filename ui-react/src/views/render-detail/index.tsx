import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Sidebar, SidebarItems, SidebarItemGroup, Spinner } from 'flowbite-react';
import { useAuth } from '../../utils/auth';
import { useRender } from '../../hooks/useRender';
import { useLatestCheckpointImage } from '../../hooks/useLatestCheckpointImage';
import RenderControls from './RenderControls';
import RenderDisplay from './RenderDisplay';

export default function RenderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const renderId = Number(id);
  useAuth(); // ensures authenticated context

  const renderQuery = useRender(renderId);
  const imageURLQuery = useLatestCheckpointImage(renderId);

  // cleanup object URL on unmount
  useEffect(() => {
    return () => {
      const url = imageURLQuery.data;
      if (url) {
        URL.revokeObjectURL(url);
      }
    };
  }, [imageURLQuery.data]);

  return (
    <div className="flex h-full w-full">
      <Sidebar className="z-10 h-full w-82 !bg-zinc-900 [&>div]:!bg-zinc-900">
        <SidebarItems className="h-full">
          <SidebarItemGroup className="flex h-full flex-col">
            {renderQuery.isSuccess && <RenderControls render={renderQuery.data} />}
          </SidebarItemGroup>
        </SidebarItems>
      </Sidebar>

      <div className="h-full min-w-0 flex-1 self-center">
        {renderQuery.isPending && (
          <div className="flex justify-center p-8">
            <Spinner size="xl" color="info" />
          </div>
        )}
        <RenderDisplay renderQuery={renderQuery} imageURLQuery={imageURLQuery} />
      </div>
    </div>
  );
}
