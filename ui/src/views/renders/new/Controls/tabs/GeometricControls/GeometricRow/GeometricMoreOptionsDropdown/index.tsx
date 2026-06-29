import { useState } from 'react';
import { Dropdown, DropdownItem, DropdownDivider } from 'flowbite-react';
import { useSelector } from '@tanstack/react-store';
import { HiEllipsisHorizontal, HiChevronRight, HiChevronDown } from 'react-icons/hi2';
import { wrapGeometric, duplicateGeometric } from '@/utils/render/utils';
import type { RenderForm } from '@/hooks/useRenderForm';

export type GeometricMoreOptionsDropdownProps = {
  form: RenderForm;
  geometricName: string;
};

export function GeometricMoreOptionsDropdown(props: GeometricMoreOptionsDropdownProps) {
  const { form, geometricName } = props;

  const [showInstanceSubmenu, setShowInstanceSubmenu] = useState(false);
  const renderConfig = useSelector(form.store, (state) => state.values);

  function handleWrap(
    instanceType:
      | 'translate'
      | 'rotate_x'
      | 'rotate_y'
      | 'rotate_z'
      | 'constant_volume'
      | 'virtual',
  ) {
    const result = wrapGeometric(renderConfig, geometricName, instanceType);
    form.setFieldValue('geometrics', result.geometrics);
    form.setFieldValue('scenes', result.scenes);
  }

  function handleDuplicate() {
    const result = duplicateGeometric(renderConfig, geometricName);
    form.setFieldValue('geometrics', result.geometrics);
    form.setFieldValue('scenes', result.scenes);
  }

  function handleToggleInstanceSubmenu(e: React.MouseEvent) {
    e.stopPropagation();
    setShowInstanceSubmenu((prev) => !prev);
  }

  return (
    <Dropdown
      label={<HiEllipsisHorizontal className="h-5 w-5" />}
      arrowIcon={false}
      color="light"
      size="sm"
      inline
    >
      <li>
        <button
          type="button"
          onClick={handleToggleInstanceSubmenu}
          className="flex w-full items-center justify-between px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-600"
        >
          Wrap in Instance
          {showInstanceSubmenu ? (
            <HiChevronDown className="h-4 w-4" />
          ) : (
            <HiChevronRight className="h-4 w-4" />
          )}
        </button>
      </li>
      {showInstanceSubmenu && (
        <>
          <DropdownItem
            onClick={() => {
              handleWrap('translate');
            }}
          >
            Translate
          </DropdownItem>
          <DropdownItem
            onClick={() => {
              handleWrap('rotate_x');
            }}
          >
            Rotate X
          </DropdownItem>
          <DropdownItem
            onClick={() => {
              handleWrap('rotate_y');
            }}
          >
            Rotate Y
          </DropdownItem>
          <DropdownItem
            onClick={() => {
              handleWrap('rotate_z');
            }}
          >
            Rotate Z
          </DropdownItem>
        </>
      )}
      <DropdownItem
        onClick={() => {
          handleWrap('constant_volume');
        }}
      >
        Wrap in Constant Volume
      </DropdownItem>
      <DropdownItem
        onClick={() => {
          handleWrap('virtual');
        }}
      >
        Wrap in Virtual
      </DropdownItem>
      <DropdownDivider />
      <DropdownItem onClick={handleDuplicate}>Duplicate</DropdownItem>
    </Dropdown>
  );
}
