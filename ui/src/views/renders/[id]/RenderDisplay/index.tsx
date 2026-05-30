import { RenderTitleBar } from './RenderTitleBar/RenderTitleBar';
import { RenderPreview } from './RenderPreview';
import { RenderProgress } from './RenderProgress';

export type RenderDisplayProps = {
  renderID: number;
};

export function RenderDisplay(props: RenderDisplayProps) {
  const { renderID } = props;

  return (
    <div className="flex h-full min-w-0 flex-1 flex-col">
      <RenderTitleBar renderID={renderID} />
      <RenderPreview renderID={renderID} />
      <RenderProgress renderID={renderID} />
    </div>
  );
}
