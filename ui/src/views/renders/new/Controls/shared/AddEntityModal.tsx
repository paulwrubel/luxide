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
import { useAllResourceMetadataQuery } from '@/hooks/useResources';

export type InstanceType = 'translate' | 'rotate_x' | 'rotate_y' | 'rotate_z' | 'scale';

const INSTANCE_LABELS: Record<InstanceType, string> = {
  rotate_x: 'Rotate X',
  rotate_y: 'Rotate Y',
  rotate_z: 'Rotate Z',
  scale: 'Scale',
  translate: 'Translate',
};

export type AddEntityCreateConfig = {
  customName?: string;
  instances: InstanceType[];
  isConstantVolume: boolean;
  isVirtual: boolean;
  resourceId?: number;
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
  const [selectedResourceId, setSelectedResourceId] = useState<number | null>(null);

  const { data: resources } = useAllResourceMetadataQuery();

  function handleCreate() {
    onCreate({
      customName: customName.trim() || undefined,
      instances,
      isConstantVolume,
      isVirtual,
      resourceId: selectedResourceId ?? undefined,
    });
    // reset all state
    setCustomName('');
    setInstances([]);
    setPendingInstanceType('translate');
    setIsConstantVolume(false);
    setIsVirtual(false);
    setSelectedResourceId(null);
    onClose();
  }

  function handleCancel() {
    setCustomName('');
    setInstances([]);
    setPendingInstanceType('translate');
    setIsConstantVolume(false);
    setIsVirtual(false);
    setSelectedResourceId(null);
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
        {/* name input */}
        <div className="mb-3">
          <label className="mb-1 block text-sm font-medium text-gray-300">Name (optional)</label>
          <TextInput
            placeholder={`New ${option.label}`}
            value={customName}
            onChange={(e) => setCustomName(e.target.value)}
          />
        </div>

        {/* description */}
        {option.description && <p className="mb-4 text-sm text-gray-400">{option.description}</p>}

        {/* geometric-specific: instances and constant volume */}
        {isGeometrics && (
          <>
            {/* stacked instances builder */}
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
                  <option value="rotate_x">Rotate X</option>
                  <option value="rotate_y">Rotate Y</option>
                  <option value="rotate_z">Rotate Z</option>
                  <option value="scale">Scale</option>
                  <option value="translate">Translate</option>
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

            {/* constant volume toggle */}
            <div className="mb-3 flex items-center gap-3">
              <ToggleSwitch
                checked={isConstantVolume}
                onChange={setIsConstantVolume}
                label="Create as Constant Volume?"
              />
            </div>

            {/* virtual toggle */}
            <div className="mb-3 flex items-center gap-3">
              <ToggleSwitch
                checked={isVirtual}
                onChange={setIsVirtual}
                label="Create as Virtual?"
              />
            </div>
          </>
        )}

        {/* image texture: resource picker */}
        {entityType === 'textures' && option.subtype === 'image' && (
          <div className="mb-4">
            <label className="mb-1 block text-sm font-medium text-gray-300">Select Resource</label>
            {resources && resources.length > 0 ? (
              <Select
                value={selectedResourceId ?? ''}
                onChange={(e) =>
                  setSelectedResourceId(e.target.value ? Number(e.target.value) : null)
                }
                sizing="sm"
              >
                <option value="">-- Choose a resource --</option>
                {resources.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name} ({r.mime_type})
                  </option>
                ))}
              </Select>
            ) : (
              <p className="text-sm text-yellow-400">
                No resources available. Upload one on the Resources page.
              </p>
            )}
          </div>
        )}
      </ModalBody>
      <ModalFooter>
        <Button color="light" onClick={handleCancel}>
          Cancel
        </Button>
        <Button
          color="default"
          onClick={handleCreate}
          disabled={entityType === 'textures' && option.subtype === 'image' && !selectedResourceId}
        >
          Create
        </Button>
      </ModalFooter>
    </Modal>
  );
}
