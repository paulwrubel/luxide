import { useState } from 'react';
import { useFieldContext } from '@/hooks/formContext';
import { Button, Label, Select } from 'flowbite-react';
import { HiPlus, HiXMark } from 'react-icons/hi2';

export type InstanceType =
  | 'translate'
  | 'rotate_x'
  | 'rotate_y'
  | 'rotate_z'
  | 'rotate_quaternion'
  | 'scale';

const INSTANCE_LABELS: Record<InstanceType, string> = {
  rotate_x: 'Rotate X',
  rotate_y: 'Rotate Y',
  rotate_z: 'Rotate Z',
  rotate_quaternion: 'Rotate (Quaternion)',
  scale: 'Scale',
  translate: 'Translate',
};

export type InstancesBuilderControlProps = {
  label?: string;
};

export function InstancesBuilderControl(props: InstancesBuilderControlProps) {
  const { label = 'Instances' } = props;

  const field = useFieldContext<InstanceType[]>();
  const [pendingInstanceType, setPendingInstanceType] = useState<InstanceType>('translate');

  const instances = field.state.value;

  function handleRemoveInstance(index: number) {
    field.handleChange(instances.filter((_, j) => j !== index));
  }

  function handleAddInstance() {
    field.handleChange([...instances, pendingInstanceType]);
  }

  return (
    <fieldset className="flex flex-col gap-2 rounded-lg border border-zinc-700 py-3">
      <Label className="text-zinc-300">{label}</Label>
      {instances.length > 0 ? (
        <div className="flex flex-col gap-1">
          {instances.map((inst, i) => (
            <div
              key={i}
              className="flex items-center justify-between rounded-lg bg-zinc-800 px-3 py-2 text-sm"
            >
              <span className="text-zinc-300">
                [{i + 1}] {INSTANCE_LABELS[inst]}
              </span>
              <button
                type="button"
                onClick={() => handleRemoveInstance(i)}
                className="rounded p-1 text-zinc-500 transition-colors hover:bg-zinc-700 hover:text-red-400"
                aria-label={`Remove ${INSTANCE_LABELS[inst]}`}
              >
                <HiXMark className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-zinc-500">No transforms applied.</p>
      )}
      <div className="flex items-center gap-2">
        <Select
          value={pendingInstanceType}
          onChange={(e) => {
            // flowbite-react Select onChange yields a generic HTMLSelectElement
            // event whose value is string; the options are all valid InstanceType values
            setPendingInstanceType(e.target.value as InstanceType);
          }}
          sizing="sm"
          className="flex-1"
        >
          <option value="rotate_x">Rotate X</option>
          <option value="rotate_y">Rotate Y</option>
          <option value="rotate_z">Rotate Z</option>
          <option value="rotate_quaternion">Rotate (Quaternion)</option>
          <option value="scale">Scale</option>
          <option value="translate">Translate</option>
        </Select>
        <Button color="light" size="sm" onClick={handleAddInstance}>
          <HiPlus className="mr-1 h-4 w-4" />
          Add
        </Button>
      </div>
    </fieldset>
  );
}
