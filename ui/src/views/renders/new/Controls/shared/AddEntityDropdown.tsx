import { useState } from 'react';
import { PortalDropdown, PortalDropdownItem } from './PortalDropdown';
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
  getDefault: (subtype: EntitySubType<T>, options?: Record<string, unknown>) => EntityData<T>;
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
    const newEntity = getDefault(subtype, { resource_id: config.resourceId });
    const option = options.find((o) => o.subtype === subtype);
    const label = option?.label ?? subtype;
    const autoName = `New ${label}`;
    const record = (formValues[type] ?? {}) as EntityRecord<T>;

    if (
      type === 'geometrics' &&
      (config.instances.length > 0 || config.isConstantVolume || config.isVirtual)
    ) {
      // the inner geometric always gets an auto-generated name;
      // the user's custom name is applied to the outermost wrapper below
      const instanceTypeLabels: Record<string, string> = {
        translate: 'Translate',
        rotate_x: 'Rotate X',
        rotate_y: 'Rotate Y',
        rotate_z: 'Rotate Z',
        rotate_quaternion: 'Rotate (Quaternion)',
      };
      const nameChain: { oldName: string; typeLabel: string }[] = [];
      let currentRecord = { ...record };
      const innerName = getNextUniqueName(currentRecord, autoName);

      currentRecord = { ...currentRecord, [innerName]: newEntity };
      nameChain.push({ oldName: innerName, typeLabel: label });
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
        nameChain.push({ oldName: instanceName, typeLabel: instanceTypeLabels[instanceType] });
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
        nameChain.push({ oldName: cvName, typeLabel: 'Constant Volume' });
        currentRef = cvName;
      }

      // outermost wrapper: virtual
      if (config.isVirtual) {
        const virtName = getNextUniqueName(currentRecord, 'New Virtual');
        const virtDefault = defaultGeometricForType(
          'virtual' as Exclude<GeometricData['type'], 'obj_model'>,
        );
        const virt = {
          ...virtDefault,
          geometric: currentRef,
        };
        currentRecord = { ...currentRecord, [virtName]: virt } as EntityRecord<T>;
        nameChain.push({ oldName: virtName, typeLabel: 'Virtual' });
        currentRef = virtName;
      }

      // if the user provided a custom name, apply it to the outermost
      // wrapper (the one that goes into the scene), not the inner geometry
      if (config.customName) {
        const outerName = getNextUniqueName(currentRecord, config.customName);
        const { [currentRef]: entry, ...rest } = currentRecord as Record<string, unknown>;
        currentRecord = { ...rest, [outerName]: entry } as EntityRecord<T>;
        currentRef = outerName;
        nameChain[nameChain.length - 1].oldName = currentRef;
      }

      // rename sub-geometrics to inherit their immediate parent's name
      let parentNewName = nameChain[nameChain.length - 1].oldName;

      for (let i = nameChain.length - 2; i >= 0; i--) {
        const { oldName, typeLabel } = nameChain[i];
        const newName = getNextUniqueName(currentRecord, `${parentNewName}_${typeLabel}`);

        // move the entry to the new name
        currentRecord = { ...currentRecord };
        currentRecord[newName] = currentRecord[oldName];
        delete currentRecord[oldName];

        // type narrowing on generic T doesn't propagate inside the if-block
        const parentEntry = currentRecord[parentNewName] as Record<string, unknown>;
        currentRecord = {
          ...currentRecord,
          [parentNewName]: { ...parentEntry, geometric: newName },
        } as EntityRecord<T>;

        // this child's new name becomes the prefix for the next inner sibling
        parentNewName = newName;
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
      <PortalDropdown
        label={<HiPlus className="h-6 w-6" />}
        placement="bottom"
        triggerClassName="p-1 rounded-md border border-gray-300 bg-white text-gray-900 hover:bg-gray-100 dark:border-gray-600 dark:bg-gray-600 dark:text-white dark:hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-700 flex items-center justify-center"
      >
        {options.map(({ subtype, label }) => (
          <PortalDropdownItem key={subtype} onClick={() => handleDropdownClick(subtype)}>
            <div className="flex items-center gap-2">
              <HiPlus className="h-4 w-4" />
              {label}
            </div>
          </PortalDropdownItem>
        ))}
      </PortalDropdown>
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
