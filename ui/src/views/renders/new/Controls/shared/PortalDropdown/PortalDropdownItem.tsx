import { useContext } from 'react';
import { PortalDropdownContext } from './PortalDropdownContext';

export type PortalDropdownItemProps = {
  onClick?: () => void;
  children: React.ReactNode;
};

export function PortalDropdownItem(props: PortalDropdownItemProps) {
  const { onClick, children } = props;
  const { close } = useContext(PortalDropdownContext);

  function handleClick() {
    onClick?.();
    close();
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="flex w-full cursor-pointer items-center justify-start px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none dark:text-gray-200 dark:hover:bg-gray-600 dark:hover:text-white dark:focus:bg-gray-600 dark:focus:text-white"
    >
      {children}
    </button>
  );
}
