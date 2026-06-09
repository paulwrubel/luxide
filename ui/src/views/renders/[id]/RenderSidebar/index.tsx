import { RenderInfo } from './RenderInfo';
import { RenderNameEditor } from './RenderNameEditor';
import { CheckpointLimitEditor } from './CheckpointLimitEditor';
import { RenderControls } from './RenderControls';
import { Separator } from '@/components/Separator';

export type RenderSidebarProps = {
  renderID: number;
};

export function RenderSidebar(props: RenderSidebarProps) {
  const { renderID } = props;

  return (
    <div className="flex h-full flex-col items-stretch gap-4 p-4">
      <RenderInfo renderID={renderID} />
      <RenderNameEditor renderID={renderID} />
      <Separator />
      <CheckpointLimitEditor renderID={renderID} />
      <span className="mt-auto w-full border-b border-zinc-600" />
      <RenderControls renderID={renderID} />
    </div>
  );
}
