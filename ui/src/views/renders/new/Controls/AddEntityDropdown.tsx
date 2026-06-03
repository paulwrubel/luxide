import { useState } from 'react';
import { Dropdown, DropdownItem } from 'flowbite-react';
import { getNextUniqueName, capitalize } from '@/utils/render/utils';
import type { RenderForm } from '@/hooks/useRenderForm';
import { useSelector } from '@tanstack/react-store';
import { HiPlus } from 'react-icons/hi2';
import type { TextureData } from '@/utils/render/texture';
import { defaultGeometricForType, type GeometricData } from '@/utils/render/geometric';
import type { MaterialData } from '@/utils/render/material';
import { AddEntityModal, type AddEntityCreateConfig } from './AddEntityModal';

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
  description?: string;
  disabled?: boolean;
  disabledReason?: string;
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

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedSubtype, setSelectedSubtype] = useState<EntitySubType<T> | null>(null);

  function handleDropdownClick(subtype: EntitySubType<T>) {
    setSelectedSubtype(subtype);
    setModalOpen(true);
  }

  function handleCreate(subtype: EntitySubType<T>, config: AddEntityCreateConfig) {
    const newEntity = getDefault(subtype);
    const option = options.find((o) => o.subtype === subtype);
    const label = option?.label ?? subtype;
    const autoName = `New ${label}`;
    const record = (formValues[type] ?? {}) as EntityRecord<T>;

    if (type === 'geometrics' && (config.instances.length > 0 || config.isConstantVolume)) {
      // determine inner geometric name (use custom or auto-generated)
      let currentRecord = { ...record };
      const innerName = config.customName
        ? getNextUniqueName(currentRecord, config.customName)
        : getNextUniqueName(currentRecord, autoName);

      currentRecord = { ...currentRecord, [innerName]: newEntity };
      let currentRef = innerName;

      // stack instances from inner to outer
      for (const instanceType of config.instances) {
        const instanceName = getNextUniqueName(currentRecord, `New ${capitalize(instanceType)}`);
        const instanceDefault = defaultGeometricForType(
          instanceType as Exclude<GeometricData['type'], 'obj_model'>,
        );
        const wrapper = {
          ...instanceDefault,
          geometric: currentRef,
        };
        currentRecord = { ...currentRecord, [instanceName]: wrapper } as EntityRecord<T>;
        currentRef = instanceName;
      }

      // outermost wrapper: constant volume
      if (config.isConstantVolume) {
        const cvName = getNextUniqueName(currentRecord, 'New Constant Volume');
        const cvDefault = defaultGeometricForType(
          'constant_volume' as Exclude<GeometricData['type'], 'obj_model'>,
        );
        const cv = {
          ...cvDefault,
          geometric: currentRef,
        };
        currentRecord = { ...currentRecord, [cvName]: cv } as EntityRecord<T>;
        currentRef = cvName;
      }

      form.setFieldValue(type, currentRecord as never);
      // signal the outermost wrapper (goes into scene)
      onCreated?.(currentRef, type);
    } else {
      // normal creation (no geometric wrappers)
      const nextName = config.customName
        ? getNextUniqueName(record, config.customName)
        : getNextUniqueName(record, autoName);
      const newRecord = {
        ...record,
        [nextName]: newEntity,
      } as EntityRecord<T>;
      form.setFieldValue(type, newRecord as never);
      onCreated?.(nextName, type);
    }

    setModalOpen(false);
    setSelectedSubtype(null);
  }

  return (
    <>
      <Dropdown label={<HiPlus className="h-6 w-6" />} arrowIcon={false} color="light" size="sm">
        {options.map(({ subtype, label }) => (
          <DropdownItem key={subtype} onClick={() => handleDropdownClick(subtype)}>
            <div className="flex items-center gap-2">
              <HiPlus className="h-4 w-4" />
              {label}
            </div>
          </DropdownItem>
        ))}
      </Dropdown>
      {selectedSubtype && (
        <AddEntityModal
          entityType={type}
          subtype={selectedSubtype}
          option={options.find((o) => o.subtype === selectedSubtype)!}
          open={modalOpen}
          onClose={() => {
            setModalOpen(false);
            setSelectedSubtype(null);
          }}
          onCreate={(config) => handleCreate(selectedSubtype, config)}
        />
      )}
    </>
  );
}
