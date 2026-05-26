import { Dropdown, DropdownItem } from 'flowbite-react';
import { defaultGeometricForType, type GeometricData } from '@/utils/render/geometric';
import { capitalize, getNextUniqueName } from '@/utils/render/utils';
import type { RenderForm } from '@/hooks/useRenderForm';
import { useStore } from '@tanstack/react-form';
import type { NormalizedSceneData } from '@/utils/render/scene';
import { HiPlus } from 'react-icons/hi2';

type GeometricType = Exclude<GeometricData['type'], 'obj_model'>;

const GEOMETRIC_TYPES: { type: GeometricType; label: string }[] = [
  { type: 'box', label: 'Box' },
  { type: 'list', label: 'List' },
  { type: 'rotate_x', label: 'Rotate X' },
  { type: 'rotate_y', label: 'Rotate Y' },
  { type: 'rotate_z', label: 'Rotate Z' },
  { type: 'translate', label: 'Translate' },
  { type: 'parallelogram', label: 'Parallelogram' },
  { type: 'sphere', label: 'Sphere' },
  { type: 'triangle', label: 'Triangle' },
  { type: 'constant_volume', label: 'Constant Volume' },
];

interface NewGeometricSpeedDialProps {
  form: RenderForm;
}

export function NewGeometricSpeedDial(props: NewGeometricSpeedDialProps) {
  const { form } = props;

  const formValues = useStore(form.store, (state) => state.values);

  function handleNewGeometric(type: GeometricType) {
    const newGeometric = defaultGeometricForType(type);
    const nextName = getNextUniqueName(formValues.geometrics ?? {}, `New ${capitalize(type)}`);

    const newGeometrics = {
      ...(formValues.geometrics ?? {}),
      [nextName]: newGeometric,
    };
    const activeSceneData = formValues.scenes?.[formValues.active_scene] as NormalizedSceneData;
    const newScenes = {
      ...formValues.scenes,
      [formValues.active_scene]: {
        ...activeSceneData,
        geometrics: [...activeSceneData.geometrics, nextName],
      },
    };

    form.setFieldValue('geometrics', newGeometrics);
    form.setFieldValue('scenes', newScenes);
  }

  return (
    <Dropdown label={<HiPlus className="h-6 w-6" />} arrowIcon={false} color="light" size="sm">
      {GEOMETRIC_TYPES.map((item) => (
        <DropdownItem
          key={item.label}
          onClick={() => {
            handleNewGeometric(item.type);
          }}
        >
          <div className="flex items-center gap-2">
            <HiPlus className="h-4 w-4" />
            {item.label}
          </div>
        </DropdownItem>
      ))}
    </Dropdown>
  );
}
