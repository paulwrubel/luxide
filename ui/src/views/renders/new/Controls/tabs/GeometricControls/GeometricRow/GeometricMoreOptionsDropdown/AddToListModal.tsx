import { useState } from 'react';
import { Modal, ModalHeader, ModalBody, ModalFooter, Button } from 'flowbite-react';

export type ListOption = {
  name: string;
  childCount: number;
};

export type AddToListModalProps = {
  geometricName: string;
  lists: ListOption[];
  open: boolean;
  onClose: () => void;
  onSelect: (listName: string) => void;
};

export function AddToListModal(props: AddToListModalProps) {
  const { geometricName, lists, open, onClose, onSelect } = props;

  const [selectedList, setSelectedList] = useState<string | null>(null);

  function handleAdd() {
    if (selectedList) {
      onSelect(selectedList);
      setSelectedList(null);
      onClose();
    }
  }

  function handleCancel() {
    setSelectedList(null);
    onClose();
  }

  return (
    <Modal dismissible show={open} onClose={handleCancel}>
      <ModalHeader>Add "{geometricName}" to List</ModalHeader>
      <ModalBody>
        {lists.length === 0 ? (
          <p className="text-sm text-gray-400">
            No lists available. Create one from the + Add menu first.
          </p>
        ) : (
          <div className="space-y-2">
            {lists.map((list) => (
              <label
                key={list.name}
                className="flex cursor-pointer items-center gap-3 rounded bg-zinc-800 px-3 py-2 hover:bg-zinc-700"
              >
                <input
                  type="radio"
                  name="listSelect"
                  checked={selectedList === list.name}
                  onChange={() => {
                    setSelectedList(list.name);
                  }}
                  className="h-4 w-4"
                />
                <div>
                  <span className="text-sm font-medium text-gray-200">{list.name}</span>
                  <span className="ml-2 text-xs text-gray-500">
                    ({list.childCount} geometric{list.childCount !== 1 ? 's' : ''})
                  </span>
                </div>
              </label>
            ))}
          </div>
        )}
      </ModalBody>
      <ModalFooter>
        <Button color="light" onClick={handleCancel}>
          Cancel
        </Button>
        <Button color="default" onClick={handleAdd} disabled={!selectedList}>
          Add
        </Button>
      </ModalFooter>
    </Modal>
  );
}
