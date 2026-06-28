import { Tooltip } from 'flowbite-react';
import { HiInformationCircle } from 'react-icons/hi2';

export function InfoIconDefaultResource() {
  return (
    <Tooltip
      content={
        <div>
          <h6 className="font-bold">Default Entity</h6>
          <p>This is a built-in default entity and is read-only.</p>
        </div>
      }
    >
      <HiInformationCircle className="h-4 w-4 shrink-0 text-blue-400" />
    </Tooltip>
  );
}
