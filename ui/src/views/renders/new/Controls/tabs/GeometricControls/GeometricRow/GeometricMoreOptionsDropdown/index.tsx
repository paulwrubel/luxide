import { useState } from 'react';
import { Dropdown, DropdownItem, DropdownDivider } from 'flowbite-react';
import { useSelector } from '@tanstack/react-store';
import { HiEllipsisHorizontal } from 'react-icons/hi2';
import { wrapGeometric, duplicateGeometric } from '@/utils/render/geometric';
import type { RenderForm } from '@/hooks/useRenderForm';
import { WrapGeometricModal, type WrapGeometricConfig } from './WrapGeometricModal';

export type GeometricMoreOptionsDropdownProps = {
  form: RenderForm;
  geometricName: string;
};

export function GeometricMoreOptionsDropdown(props: GeometricMoreOptionsDropdownProps) {
  const { form, geometricName } = props;

  const [modalOpen, setModalOpen] = useState(false);
  const renderConfig = useSelector(form.store, (state) => state.values);

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

  function handleDuplicate() {
    const result = duplicateGeometric(renderConfig, geometricName);
    form.setFieldValue('geometrics', result.geometrics);
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
        <DropdownDivider />
        <DropdownItem onClick={handleDuplicate}>Duplicate</DropdownItem>
      </Dropdown>
      <WrapGeometricModal
        geometricName={geometricName}
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
        }}
        onWrap={handleWrap}
      />
    </>
  );
}
