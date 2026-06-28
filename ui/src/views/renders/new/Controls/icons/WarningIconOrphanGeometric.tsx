import { Tooltip } from 'flowbite-react';
import { HiInformationCircle } from 'react-icons/hi2';

export function WarningIconOrphanGeometric() {
  return (
    <Tooltip
      content={
        <div>
          <h6 className="font-bold">Not in Active Scene</h6>
          <p>
            This geometric is not referenced by the active scene and will not appear in renders.
          </p>
        </div>
      }
    >
      <HiInformationCircle className="h-4 w-4 shrink-0 text-amber-400" />
    </Tooltip>
  );
}
