import { RenderInfo } from './RenderInfo';
import { CheckpointLimitEditor } from './CheckpointLimitEditor';
import { RenderControls } from './RenderControls';

export type RenderSidebarProps = {
  renderID: number;
};

export function RenderSidebar(props: RenderSidebarProps) {
  const { renderID } = props;

  return (
    <div className="flex h-full flex-col items-stretch gap-4 p-4">
      <RenderInfo renderID={renderID} />
      <CheckpointLimitEditor renderID={renderID} />
      <span className="mt-auto w-full border-b border-zinc-600" />
      <RenderControls renderID={renderID} />
    </div>
  );
}
