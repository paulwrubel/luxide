import { useParams } from 'react-router-dom';
import {
  Sidebar,
  SidebarItems,
  SidebarItemGroup,
  type SidebarTheme,
} from 'flowbite-react';
import { useRender } from '@/hooks/useRender';
import type { DeepPartial } from 'flowbite-react/types';
import { useLatestCheckpointImage } from '@/hooks/useLatestCheckpointImage';
import { useRenderStats } from '@/hooks/useRenderStats';
import { RenderSidebar } from './RenderSidebar';
import { RenderDisplay } from './RenderDisplay';

/** render detail page showing a single render's progress and controls */
export function RenderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const renderID = Number(id);

  const renderQuery = useRender({ renderID });
  const imageURLQuery = useLatestCheckpointImage({ renderID });
  const statsQuery = useRenderStats({ renderID });
  const sidebarTheme: DeepPartial<SidebarTheme> = {
    root: {
      base: 'bg-zinc-900 dark:bg-zinc-900',
      inner: 'bg-zinc-900 dark:bg-zinc-900',
    },
  };

  return (
    <div className="flex h-full w-full">
      <Sidebar theme={sidebarTheme} className="z-10 h-full w-82">
        <SidebarItems className="h-full">
          <SidebarItemGroup className="flex h-full flex-col">
            {renderQuery.isSuccess && (
              <RenderSidebar render={renderQuery.data} renderID={renderID} />
            )}
          </SidebarItemGroup>
        </SidebarItems>
      </Sidebar>

      <RenderDisplay
        renderQuery={renderQuery}
        imageURLQuery={imageURLQuery}
        samplesPerCheckpoint={
          renderQuery.isSuccess
            ? renderQuery.data.config.parameters.samples_per_checkpoint
            : undefined
        }
        statsQuery={statsQuery}
      />
    </div>
  );
}
