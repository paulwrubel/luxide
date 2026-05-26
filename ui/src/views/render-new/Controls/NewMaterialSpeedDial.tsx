import { Dropdown, DropdownItem } from 'flowbite-react';
import { defaultMaterialForType, type MaterialData } from '@/utils/render/material';
import { capitalize, getNextUniqueName } from '@/utils/render/utils';
import type { RenderForm } from '@/hooks/useRenderForm';
import { useStore } from '@tanstack/react-form';
import { HiPlus } from 'react-icons/hi2';

type MaterialType = Exclude<MaterialData['type'], 'dielectric'>;

interface NewMaterialSpeedDialProps {
  form: RenderForm;
}

export function NewMaterialSpeedDial(props: NewMaterialSpeedDialProps) {
  const { form } = props;

  const formValues = useStore(form.store, (state) => state.values);

  function handleNewMaterial(type: MaterialType) {
    const newMaterial = defaultMaterialForType(type);
    const nextName = getNextUniqueName(formValues.materials ?? {}, `New ${capitalize(type)}`);

    form.setFieldValue('materials', {
      ...formValues.materials,
      [nextName]: newMaterial,
    });
  }

  return (
    <Dropdown label={<HiPlus className="h-6 w-6" />} arrowIcon={false} color="light" size="sm">
      <DropdownItem disabled>
        <div className="flex items-center gap-2">
          <HiPlus className="h-4 w-4" />
          Dielectric Material
        </div>
      </DropdownItem>
      <DropdownItem onClick={() => handleNewMaterial('lambertian')}>
        <div className="flex items-center gap-2">
          <HiPlus className="h-4 w-4" />
          Lambertian Material
        </div>
      </DropdownItem>
      <DropdownItem onClick={() => handleNewMaterial('specular')}>
        <div className="flex items-center gap-2">
          <HiPlus className="h-4 w-4" />
          Specular Material
        </div>
      </DropdownItem>
    </Dropdown>
  );
}
