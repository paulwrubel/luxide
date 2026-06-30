import { useState, useMemo } from 'react';
import { Dropdown, DropdownItem, DropdownDivider } from 'flowbite-react';
import { useSelector } from '@tanstack/react-store';
import { HiEllipsisHorizontal } from 'react-icons/hi2';
import {
  wrapGeometric,
  duplicateGeometric,
  addGeometricToList,
  addToScene,
  removeFromScene,
} from '@/utils/render/geometric';
import type { RenderForm } from '@/hooks/useRenderForm';
import { WrapGeometricModal, type WrapGeometricConfig } from './WrapGeometricModal';
import { AddToListModal, type ListOption } from './AddToListModal';

export type GeometricMoreOptionsDropdownProps = {
  form: RenderForm;
  geometricName: string;
  isDirectlyInActiveScene: boolean;
  isUsedByActiveScene: boolean;
};

export function GeometricMoreOptionsDropdown(props: GeometricMoreOptionsDropdownProps) {
  const { form, geometricName, isDirectlyInActiveScene, isUsedByActiveScene } = props;

  const [modalOpen, setModalOpen] = useState(false);
  const [listModalOpen, setListModalOpen] = useState(false);
  const renderConfig = useSelector(form.store, (state) => state.values);

  const availableLists = useMemo(() => {
    const result: ListOption[] = [];
    const allGeometrics = renderConfig.geometrics ?? {};
    for (const [name, geo] of Object.entries(allGeometrics)) {
      if (geo.type === 'list' && name !== geometricName) {
        result.push({ name, childCount: geo.geometrics.length });
      }
    }
    return result;
  }, [renderConfig, geometricName]);

  function handleWrap(wrapConfig: WrapGeometricConfig) {
    let currentConfig = renderConfig;
    let currentName = geometricName;

    // apply instances from inner to outer
    for (const instanceType of wrapConfig.instances) {
      const result = wrapGeometric(currentConfig, currentName, instanceType);
      currentConfig = result.config;
      currentName = result.wrapperName;
    }

    if (wrapConfig.isConstantVolume) {
      const result = wrapGeometric(currentConfig, currentName, 'constant_volume');
      currentConfig = result.config;
      currentName = result.wrapperName;
    }

    if (wrapConfig.isVirtual) {
      const result = wrapGeometric(currentConfig, currentName, 'virtual');
      currentConfig = result.config;
    }

    form.setFieldValue('geometrics', currentConfig.geometrics);
    form.setFieldValue('scenes', currentConfig.scenes);
  }

  function handleAddToList(listName: string) {
    const result = addGeometricToList(renderConfig, geometricName, listName);
    form.setFieldValue('geometrics', result.geometrics);
    form.setFieldValue('scenes', result.scenes);
  }

  function handleDuplicate() {
    const result = duplicateGeometric(renderConfig, geometricName);
    form.setFieldValue('geometrics', result.geometrics);
    form.setFieldValue('scenes', result.scenes);
  }

  function handleAddToScene() {
    const result = addToScene(renderConfig, geometricName);
    form.setFieldValue('scenes', result.scenes);
  }

  function handleRemoveFromScene() {
    const result = removeFromScene(renderConfig, geometricName);
    form.setFieldValue('scenes', result.scenes);
  }

  return (
    <>
      <Dropdown
        label={<HiEllipsisHorizontal className="h-5 w-5" />}
        arrowIcon={false}
        color="light"
        size="sm"
        inline
      >
        <DropdownItem
          onClick={() => {
            setModalOpen(true);
          }}
        >
          Wrap
        </DropdownItem>
        {availableLists.length > 0 && (
          <DropdownItem
            onClick={() => {
              setListModalOpen(true);
            }}
          >
            Add to List
          </DropdownItem>
        )}
        <DropdownDivider />
        <DropdownItem onClick={handleDuplicate}>Duplicate</DropdownItem>
        {isDirectlyInActiveScene && (
          <>
            <DropdownDivider />
            <DropdownItem onClick={handleRemoveFromScene}>Remove from Scene</DropdownItem>
          </>
        )}
        {!isUsedByActiveScene && (
          <>
            <DropdownDivider />
            <DropdownItem onClick={handleAddToScene}>Add to Scene</DropdownItem>
          </>
        )}
      </Dropdown>
      <WrapGeometricModal
        geometricName={geometricName}
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
        }}
        onWrap={handleWrap}
      />
      <AddToListModal
        geometricName={geometricName}
        lists={availableLists}
        open={listModalOpen}
        onClose={() => {
          setListModalOpen(false);
        }}
        onSelect={handleAddToList}
      />
    </>
  );
}
