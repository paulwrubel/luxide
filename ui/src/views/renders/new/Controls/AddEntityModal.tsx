import { useState } from 'react';
import {
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  ToggleSwitch,
  Select,
  TextInput,
} from 'flowbite-react';
import { HiPlus, HiXMark } from 'react-icons/hi2';
import type { EntityType, EntitySubType, AddEntityDropdownOption } from './AddEntityDropdown';

export type InstanceType = 'translate' | 'rotate_x' | 'rotate_y' | 'rotate_z';

const INSTANCE_LABELS: Record<InstanceType, string> = {
  translate: 'Translate',
  rotate_x: 'Rotate X',
  rotate_y: 'Rotate Y',
  rotate_z: 'Rotate Z',
};

export type AddEntityCreateConfig = {
  customName?: string;
  instances: InstanceType[];
  isConstantVolume: boolean;
  isVirtual: boolean;
};

export type AddEntityModalProps<T extends EntityType> = {
  entityType: T;
  subtype: EntitySubType<T>;
  option: AddEntityDropdownOption<T>;
  open: boolean;
  onClose: () => void;
  onCreate: (config: AddEntityCreateConfig) => void;
};

export function AddEntityModal<T extends EntityType>(props: AddEntityModalProps<T>) {
  const { entityType, option, open, onClose, onCreate } = props;

  const isGeometrics = entityType === 'geometrics';
  const [customName, setCustomName] = useState('');
  const [instances, setInstances] = useState<InstanceType[]>([]);
  const [pendingInstanceType, setPendingInstanceType] = useState<InstanceType>('translate');
  const [isConstantVolume, setIsConstantVolume] = useState(false);
  const [isVirtual, setIsVirtual] = useState(false);

  function handleCreate() {
    onCreate({
      customName: customName.trim() || undefined,
      instances,
      isConstantVolume,
      isVirtual,
    });
    // reset all state
    setCustomName('');
    setInstances([]);
    setPendingInstanceType('translate');
    setIsConstantVolume(false);
    setIsVirtual(false);
    onClose();
  }

  function handleCancel() {
    setCustomName('');
    setInstances([]);
    setPendingInstanceType('translate');
    setIsConstantVolume(false);
    setIsVirtual(false);
    onClose();
  }

  // --- Disabled modal (unchanged logic) ---
  if (option.disabled) {
    return (
      <Modal dismissible show={open} onClose={handleCancel}>
        <ModalHeader>{option.label}</ModalHeader>
        <ModalBody>
          <p className="text-sm text-yellow-400">{option.disabledReason}</p>
        </ModalBody>
        <ModalFooter>
          <Button color="light" onClick={handleCancel}>
            Close
          </Button>
        </ModalFooter>
      </Modal>
    );
  }

  return (
    <Modal dismissible show={open} onClose={handleCancel}>
      <ModalHeader>{option.label}</ModalHeader>
      <ModalBody>
        {/* Name input */}
        <div className="mb-3">
          <label className="mb-1 block text-sm font-medium text-gray-300">Name (optional)</label>
          <TextInput
            placeholder={`New ${option.label}`}
            value={customName}
            onChange={(e) => setCustomName(e.target.value)}
          />
        </div>

        {/* Description */}
        {option.description && <p className="mb-4 text-sm text-gray-400">{option.description}</p>}

        {/* Geometric-specific: instances and constant volume */}
        {isGeometrics && (
          <>
            {/* Stacked instances builder */}
            <div className="mb-4">
              <label className="mb-1 block text-sm font-medium text-gray-300">Instances</label>
              {instances.length > 0 ? (
                <div className="mb-2 space-y-1">
                  {instances.map((inst, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between rounded bg-zinc-800 px-2 py-1 text-sm"
                    >
                      <span className="text-gray-300">
                        [{i + 1}] {INSTANCE_LABELS[inst]}
                      </span>
                      <button
                        type="button"
                        onClick={() => setInstances(instances.filter((_, j) => j !== i))}
                        className="text-gray-500 hover:text-red-400"
                        aria-label={`Remove ${INSTANCE_LABELS[inst]}`}
                      >
                        <HiXMark className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mb-2 text-xs text-gray-500">No transforms applied.</p>
              )}
              <div className="flex gap-2">
                <Select
                  value={pendingInstanceType}
                  onChange={(e) => setPendingInstanceType(e.target.value as InstanceType)}
                  sizing="sm"
                >
                  <option value="translate">Translate</option>
                  <option value="rotate_x">Rotate X</option>
                  <option value="rotate_y">Rotate Y</option>
                  <option value="rotate_z">Rotate Z</option>
                </Select>
                <Button
                  color="light"
                  size="xs"
                  onClick={() => setInstances([...instances, pendingInstanceType])}
                >
                  <HiPlus className="mr-1 h-3.5 w-3.5" />
                  Add
                </Button>
              </div>
            </div>

            {/* Constant volume toggle */}
            <div className="mb-3 flex items-center gap-3">
              <ToggleSwitch
                checked={isConstantVolume}
                onChange={setIsConstantVolume}
                label="Create as Constant Volume?"
              />
            </div>

            {/* Virtual toggle */}
            <div className="mb-3 flex items-center gap-3">
              <ToggleSwitch
                checked={isVirtual}
                onChange={setIsVirtual}
                label="Create as Virtual?"
              />
            </div>
          </>
        )}
      </ModalBody>
      <ModalFooter>
        <Button color="light" onClick={handleCancel}>
          Cancel
        </Button>
        <Button color="default" onClick={handleCreate}>
          Create
        </Button>
      </ModalFooter>
    </Modal>
  );
}
