import { Dropdown, DropdownItem } from 'flowbite-react';
import { getNextUniqueName } from '@/utils/render/utils';
import type { RenderForm } from '@/hooks/useRenderForm';
import { useSelector } from '@tanstack/react-store';
import { HiPlus } from 'react-icons/hi2';
import type { TextureData } from '@/utils/render/texture';
import type { GeometricData } from '@/utils/render/geometric';
import type { MaterialData } from '@/utils/render/material';

export type EntityType = 'geometrics' | 'materials' | 'textures';
export type EntityData<T> = T extends 'geometrics'
  ? GeometricData
  : T extends 'materials'
    ? MaterialData
    : T extends 'textures'
      ? TextureData
      : never;
export type EntityRecord<T> = Record<string, EntityData<T>>;
export type EntitySubType<T> = EntityData<T>['type'];

export type AddEntityDropdownOption<T extends EntityType> = {
  subtype: EntitySubType<T>;
  label: string;
};

export type AddEntityDropdownProps<T extends EntityType> = {
  form: RenderForm;
  type: T;
  options: AddEntityDropdownOption<T>[];
  getDefault: (subtype: EntitySubType<T>) => EntityData<T>;
  onCreated?: (name: string, type: T) => void;
};

export function AddEntityDropdown<T extends EntityType>(props: AddEntityDropdownProps<T>) {
  const { form, type, options, getDefault, onCreated } = props;

  const formValues = useSelector(form.store, (state) => state.values);

  function handleAdd(subtype: EntitySubType<T>) {
    const newEntity = getDefault(subtype);

    const subtypeLabel = options.find((o) => o.subtype === subtype)?.label ?? subtype;
    const baseName = `New ${subtypeLabel}`;
    const record = (formValues[type] ?? {}) as EntityRecord<T>;
    const nextName = getNextUniqueName(record, baseName);
    const newRecord = {
      ...record,
      [nextName]: newEntity,
    } as EntityRecord<T>;
    form.setFieldValue(type, newRecord as never);
    onCreated?.(nextName, type);
  }

  return (
    <Dropdown label={<HiPlus className="h-6 w-6" />} arrowIcon={false} color="light" size="sm">
      {options.map(({ subtype, label }) => (
        <DropdownItem key={subtype} onClick={() => handleAdd(subtype)}>
          <div className="flex items-center gap-2">
            <HiPlus className="h-4 w-4" />
            {label}
          </div>
        </DropdownItem>
      ))}
    </Dropdown>
  );
}
