import { Dropdown, DropdownItem } from 'flowbite-react';
import { HiEllipsisHorizontal } from 'react-icons/hi2';

export type DuplicateDropdownProps = {
  onDuplicate: () => void;
};

export function DuplicateDropdown(props: DuplicateDropdownProps) {
  const { onDuplicate } = props;

  return (
    <Dropdown
      label={<HiEllipsisHorizontal className="h-5 w-5" />}
      arrowIcon={false}
      color="light"
      size="sm"
      inline
    >
      <DropdownItem onClick={onDuplicate}>Duplicate</DropdownItem>
    </Dropdown>
  );
}
