import { Dropdown, DropdownItem } from 'flowbite-react';
import {
  defaultMaterialForType,
  type MaterialData,
} from '../../utils/render/material';
import { capitalize, getNextUniqueName } from '../../utils/render/utils';
import type { RenderForm } from '../../hooks/useRenderForm';
import { useStore } from '@tanstack/react-form';

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
    </svg>
  );
}

type MaterialType = Exclude<MaterialData['type'], 'dielectric'>;

interface NewMaterialSpeedDialProps {
  form: RenderForm;
}

export default function NewMaterialSpeedDial({ form }: NewMaterialSpeedDialProps) {
  const formValues = useStore(form.store, (state) => state.values);

  function handleNewMaterial(type: MaterialType) {
    const newMaterial = defaultMaterialForType(type as any);
    const nextName = getNextUniqueName(
      formValues.materials ?? {},
      `New ${capitalize(type)}`
    );

    (form as any).setFieldValue('materials', {
      ...formValues.materials,
      [nextName]: newMaterial,
    });
  }

  return (
    <Dropdown
      label={<PlusIcon className="h-6 w-6" />}
      arrowIcon={false}
      color="light"
      size="sm"
    >
      <DropdownItem disabled>
        <div className="flex items-center gap-2">
          <PlusIcon className="h-4 w-4" />
          Dielectric Material
        </div>
      </DropdownItem>
      <DropdownItem onClick={() => handleNewMaterial('lambertian')}>
        <div className="flex items-center gap-2">
          <PlusIcon className="h-4 w-4" />
          Lambertian Material
        </div>
      </DropdownItem>
      <DropdownItem onClick={() => handleNewMaterial('specular')}>
        <div className="flex items-center gap-2">
          <PlusIcon className="h-4 w-4" />
          Specular Material
        </div>
      </DropdownItem>
    </Dropdown>
  );
}
