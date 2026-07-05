import { PortalDropdown, PortalDropdownItem } from './PortalDropdown';
import { HiEllipsisHorizontal } from 'react-icons/hi2';

export type DuplicateDropdownProps = {
  onDuplicate: () => void;
};

export function DuplicateDropdown(props: DuplicateDropdownProps) {
  const { onDuplicate } = props;

  return (
    <PortalDropdown
      label={<HiEllipsisHorizontal className="h-5 w-5" />}
      triggerClassName="flex items-center"
    >
      <PortalDropdownItem onClick={onDuplicate}>Duplicate</PortalDropdownItem>
    </PortalDropdown>
  );
}
