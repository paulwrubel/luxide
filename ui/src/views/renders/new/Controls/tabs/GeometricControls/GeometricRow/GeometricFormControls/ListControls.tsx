import { useSelector } from '@tanstack/react-store';
import { HiXMark } from 'react-icons/hi2';
import { getGeometricData } from '@/utils/render/geometric';
import { removeGeometricFromList } from '@/utils/render/geometric';
import type { RenderForm } from '@/hooks/useRenderForm';

export type ListControlsProps = {
  form: RenderForm;
  name: string;
};

export function ListControls(props: ListControlsProps) {
  const { form, name } = props;

  const renderConfig = useSelector(form.store, (state) => state.values);
  const { data } = getGeometricData(renderConfig, name);

  if (data.type !== 'list') {
    return null;
  }

  function handleRemove(childName: string) {
    const result = removeGeometricFromList(renderConfig, childName, name);
    form.setFieldValue('geometrics', result.geometrics);
    form.setFieldValue('scenes', result.scenes);
  }

  return (
    <div>
      <p className="mb-2 text-sm text-zinc-500">
        List — {data.geometrics.length} geometric{data.geometrics.length !== 1 ? 's' : ''}
      </p>
      {data.geometrics.length > 0 ? (
        <div className="space-y-1">
          {data.geometrics.map((childName) => (
            <div
              key={childName}
              className="flex items-center justify-between rounded bg-zinc-800 px-2 py-1 text-sm"
            >
              <span className="text-gray-300">{childName}</span>
              <button
                type="button"
                onClick={() => {
                  handleRemove(childName);
                }}
                className="text-gray-500 hover:text-red-400"
                aria-label={`Remove ${childName} from list`}
              >
                <HiXMark className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-gray-500">No geometrics in this list.</p>
      )}
    </div>
  );
}
