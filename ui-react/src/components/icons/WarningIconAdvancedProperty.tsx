import { Tooltip } from 'flowbite-react';

function InfoCircleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M12 2a10 10 0 100 20 10 10 0 000-20z" />
    </svg>
  );
}

export default function WarningIconAdvancedProperty() {
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
      <InfoCircleIcon className="text-amber-400" />
    </Tooltip>
  );
}
