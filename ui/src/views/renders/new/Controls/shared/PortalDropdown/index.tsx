import { useState } from 'react';
import {
  useFloating,
  FloatingPortal,
  useClick,
  useDismiss,
  useRole,
  useInteractions,
  flip,
  shift,
  offset,
  autoUpdate,
} from '@floating-ui/react';
import { PortalDropdownContext } from './PortalDropdownContext';

export { PortalDropdownItem } from './PortalDropdownItem';
export { PortalDropdownDivider } from './PortalDropdownDivider';
export type { PortalDropdownItemProps } from './PortalDropdownItem';

export type PortalDropdownProps = {
  label: React.ReactNode;
  children: React.ReactNode;
  triggerClassName?: string;
  placement?: 'bottom' | 'bottom-start';
};

export function PortalDropdown(props: PortalDropdownProps) {
  const { label, children, triggerClassName, placement } = props;

  const [open, setOpen] = useState(false);

  const { refs, floatingStyles, context } = useFloating({
    open,
    onOpenChange: setOpen,
    placement: placement ?? 'bottom-start',
    strategy: 'fixed',
    whileElementsMounted: autoUpdate,
    middleware: [offset(4), flip(), shift({ padding: 8 })],
  });

  const click = useClick(context);
  const dismiss = useDismiss(context);
  const role = useRole(context, { role: 'menu' });

  const { getReferenceProps, getFloatingProps } = useInteractions([click, dismiss, role]);

  return (
    <PortalDropdownContext.Provider value={{ close: () => setOpen(false) }}>
      <button
        type="button"
        ref={refs.setReference}
        className={triggerClassName}
        {...getReferenceProps()}
      >
        {label}
      </button>
      {open && (
        <FloatingPortal>
          <div
            // eslint-disable-next-line react-hooks/refs
            ref={refs.setFloating}
            style={floatingStyles}
            className="z-50 min-w-fit divide-y divide-gray-100 rounded border border-gray-200 bg-white text-gray-900 shadow focus:outline-none dark:border-none dark:bg-gray-700 dark:text-white"
            {...getFloatingProps()}
          >
            <div className="py-1">{children}</div>
          </div>
        </FloatingPortal>
      )}
    </PortalDropdownContext.Provider>
  );
}
