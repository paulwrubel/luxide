import { Tooltip } from 'flowbite-react';
import { HiInformationCircle } from 'react-icons/hi2';

export function WarningIconInaccuratePreview() {
  return (
    <Tooltip
      content={
        <div>
          <h6 className="font-bold">Warning: Inaccurate Preview</h6>
          <p>
            The effect that this property has on the preview may not reflect the rendered result.
          </p>
          <p>
            You may only be able to see this property's full effects accurately by creating a
            render.
          </p>
        </div>
      }
    >
      <HiInformationCircle className="h-5 w-5 shrink-0 text-amber-400" />
    </Tooltip>
  );
}
