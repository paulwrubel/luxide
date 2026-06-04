import { Button, Modal, ModalHeader, ModalBody, ModalFooter } from 'flowbite-react';
import type { Role, User } from '@/utils/api';

export type RoleChangeModalProps = {
  confirmTarget: { user: User; newRole: Role } | null;
  isPending: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

export function RoleChangeModal(props: RoleChangeModalProps) {
  const { confirmTarget, isPending, onClose, onConfirm } = props;

  return (
    <Modal show={confirmTarget !== null} onClose={onClose}>
      <ModalHeader>
        {confirmTarget?.newRole === 'admin' ? 'Promote to Admin' : 'Demote to User'}
      </ModalHeader>
      <ModalBody>
        {confirmTarget && (
          <div className="text-zinc-300">
            <p>
              Are you sure you want to{' '}
              <strong>{confirmTarget.newRole === 'admin' ? 'promote' : 'demote'}</strong>{' '}
              <strong>@{confirmTarget.user.username}</strong>?
            </p>
            {confirmTarget.newRole === 'admin' ? (
              <p className="mt-2 text-sm text-zinc-400">
                They will have unlimited access to all resources (unlimited renders, checkpoints,
                and pixel count).
              </p>
            ) : (
              <p className="mt-2 text-sm text-zinc-400">
                Their resource quotas will be reset to the default limits (1 render, 1 checkpoint).
              </p>
            )}
          </div>
        )}
      </ModalBody>
      <ModalFooter>
        <Button color="default" onClick={onClose}>
          Cancel
        </Button>
        <Button
          color={confirmTarget?.newRole === 'admin' ? 'green' : 'red'}
          onClick={onConfirm}
          disabled={isPending}
        >
          {isPending ? 'Updating...' : 'Confirm'}
        </Button>
      </ModalFooter>
    </Modal>
  );
}
