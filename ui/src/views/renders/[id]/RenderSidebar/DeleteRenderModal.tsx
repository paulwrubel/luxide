import { Button, Modal, ModalHeader, ModalBody, ModalFooter } from 'flowbite-react';

export type DeleteRenderModalProps = {
  show: boolean;
  renderName: string;
  isPending: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

export function DeleteRenderModal(props: DeleteRenderModalProps) {
  const { show, renderName, isPending, onClose, onConfirm } = props;

  return (
    <Modal show={show} onClose={onClose}>
      <ModalHeader>Delete Render</ModalHeader>
      <ModalBody>
        <div className="text-zinc-300">
          <p>
            Are you sure you want to permanently delete <strong>{renderName}</strong>?
          </p>
          <p className="mt-2 text-sm text-zinc-400">
            All checkpoint data associated with this render will be permanently lost. This action
            cannot be undone.
          </p>
        </div>
      </ModalBody>
      <ModalFooter>
        <Button color="default" onClick={onClose}>
          Cancel
        </Button>
        <Button color="red" onClick={onConfirm} disabled={isPending}>
          {isPending ? 'Deleting...' : 'Delete'}
        </Button>
      </ModalFooter>
    </Modal>
  );
}
