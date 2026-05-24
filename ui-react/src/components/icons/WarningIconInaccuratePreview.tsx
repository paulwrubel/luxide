import { Tooltip } from 'flowbite-react';

function InfoCircleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M12 2a10 10 0 100 20 10 10 0 000-20z" />
    </svg>
  );
}

export default function WarningIconInaccuratePreview() {
  return (
    <>
      <InfoCircleIcon className="text-amber-400" />
      <Tooltip>
        <h6>Warning: Inaccurate Preview</h6>
        <p>The effect that this property has on the preview may not reflect the rendered result.</p>
        <p>You may only be able to see this property's full effects accurately by creating a render.</p>
      </Tooltip>
    </>
  );
}
