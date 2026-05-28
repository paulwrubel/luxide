import { Tooltip } from 'flowbite-react';
import { HiInformationCircle } from 'react-icons/hi2';

export function WarningIconAdvancedProperty() {
  return (
    <Tooltip
      content={
        <div>
          <h6 className="font-bold">Warning: Advanced Property</h6>
          <p>This property is advanced and may not be visible in the preview.</p>
          <p>It is recommended to leave this property at its default value.</p>
        </div>
      }
    >
      <HiInformationCircle className="h-5 w-5 shrink-0 text-amber-400" />
    </Tooltip>
  );
}
