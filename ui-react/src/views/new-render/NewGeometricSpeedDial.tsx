import { Dropdown, DropdownItem } from 'flowbite-react';
import {
  defaultGeometricForType,
  type GeometricData,
} from '../../utils/render/geometric';
import { capitalize, getNextUniqueName } from '../../utils/render/utils';
import type { RenderConfig } from '../../utils/render/config';

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
    </svg>
  );
}

type GeometricType = Exclude<GeometricData['type'], 'obj_model'>;

const GEOMETRIC_TYPES: { type: GeometricType; label: string; disabled?: boolean; tooltip?: string }[] = [
  { type: 'box', label: 'Box' },
  { type: 'list', label: 'List' },
  { type: 'obj_model' as any, label: '.obj Model', disabled: true, tooltip: '.obj models are not yet implemented' },
  { type: 'rotate_x', label: 'Rotate X' },
  { type: 'rotate_y', label: 'Rotate Y' },
  { type: 'rotate_z', label: 'Rotate Z' },
  { type: 'translate', label: 'Translate' },
  { type: 'parallelogram', label: 'Parallelogram' },
  { type: 'sphere', label: 'Sphere' },
  { type: 'triangle', label: 'Triangle' },
  { type: 'constant_volume', label: 'Constant Volume' },
].filter((g) => g.type !== 'obj_model' || g.label === '.obj Model') as any;

interface NewGeometricSpeedDialProps {
  form: any;
}

export default function NewGeometricSpeedDial({ form }: NewGeometricSpeedDialProps) {
  // We need form.state.values to access current state
  const formValues = form.state.values as RenderConfig;

  function handleNewGeometric(type: GeometricType) {
    const newGeometric = defaultGeometricForType(type as any);
    const nextName = getNextUniqueName(
      formValues.geometrics ?? {},
      `New ${capitalize(type)}`
    );

    const newGeometrics = {
      ...(formValues.geometrics ?? {}),
      [nextName]: newGeometric,
    };
    const activeSceneData = formValues.scenes?.[formValues.active_scene];
    const newScenes = {
      ...formValues.scenes,
      [formValues.active_scene]: {
        ...activeSceneData,
        geometrics: [...(activeSceneData?.geometrics ?? []), nextName],
      },
    };

    form.setFieldValue('geometrics', newGeometrics);
    form.setFieldValue('scenes', newScenes);
  }

  return (
    <Dropdown
      label={<PlusIcon className="h-6 w-6" />}
      arrowIcon={false}
      color="light"
      size="sm"
    >
      {GEOMETRIC_TYPES.map((item) => (
        <DropdownItem
          key={item.label}
          onClick={() => {
            if (!item.disabled) handleNewGeometric(item.type);
          }}
          disabled={item.disabled}
        >
          <div className="flex items-center gap-2">
            <PlusIcon className="h-4 w-4" />
            {item.label}
          </div>
        </DropdownItem>
      ))}
    </Dropdown>
  );
}
