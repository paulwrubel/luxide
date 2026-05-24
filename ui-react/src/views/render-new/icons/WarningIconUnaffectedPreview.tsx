import { Tooltip } from 'flowbite-react';
import { HiInformationCircle } from 'react-icons/hi2';

export default function WarningIconUnaffectedPreview() {
  return (
    <Tooltip
      content={
        <div>
          <h6 className="font-bold">Warning: Unaffected Preview</h6>
          <p>Editing this property will not affect the preview.</p>
          <p>You will only be able to see this property's effects by creating a render.</p>
        </div>
      }
    >
      <HiInformationCircle className="h-5 w-5 shrink-0 text-amber-400" />
    </Tooltip>
  );
}
